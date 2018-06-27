import {BaseCommand} from "./baseCommand";
import {DieHardError, Logger} from "../types";
import {promisify} from 'util';
import * as shell from 'shelljs';
import {FileDocument} from '../lib/fileDocument';

export type NPMPreValidatedVersions = 'major' | 'minor' | 'patch' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease' | 'from-git'

const standardVersion = promisify(require("standard-version"));

import * as caporal from "caporal";

export interface publishArgs {
	version?: string | NPMPreValidatedVersions;
}

export interface publishOptions {
	prerelease: string;
	distTag: string;
	noBump: boolean;
	noPush: boolean;
	noPublish: boolean;
	noClean: boolean;
	noTests: boolean;
	stupid: boolean;
	dryRun: boolean;
}

export class PublishCommand extends BaseCommand {
	getHandler() {
		return async (args: publishArgs, options: Partial<publishOptions>, logger: Logger) => {
			this.spinner.start('starting prerequisite checks...');
			const gitStatus = await this.exec('git status --porcelain');
			if (gitStatus.stdout.length) {
				this.debug(`gitstatus output : ${gitStatus.stdout}`);
				this.error('could not publish if working tree is not clean, commit changes first');
				throw new DieHardError('working tree dirty');
			}
			const gitRemoteDiff = await this.exec('git rev-list --count --left-only @{u}...HEAD');
			if (gitRemoteDiff.stdout.trim() !== '0') {
				this.debug(`git rev-list output : ${gitRemoteDiff.stdout}`);
				this.error('Remote history differs. Please pull changes.');
				throw new DieHardError('remote more updated');
			}
			const cmds = [];
			if (options.stupid) {
				options.noClean = true;
				options.noTests = true;
			}
			if (options.dryRun) {
				options.noPublish = true;
				options.noPush = true
			}
			if (!options.noClean) {
				try {
					this.spinner.info('cleaning node_modules');
					shell.rm('-rf', 'node_modules');
				} catch (e) {
					this.spinner.fail('cleaning node_modules failed!');
					throw new DieHardError('cleaning failed, stopping publish');
				}
				try {
					this.spinner.info('running npm clean install');
					await this.exec('npm i', {progress: true});
				} catch (e) {
					this.spinner.fail('npm install failed');
					throw new DieHardError('npm install failed, stopping publish');
				}
			}
			if (!options.noTests) {
				this.spinner.start('running tests');
				const retVal = await this.exec('npm t', {progress: true});
				if (retVal.code) {
					this.spinner.fail('Tests failed');
					throw new DieHardError('tests failed, stopping publish');
				}
			}
			const standardArgs: any = {dryRun: options.dryRun};
			if (args.version) {
				standardArgs.releaseAs = args.version;
			}
			if (options.noBump) {
				standardArgs.skip = {bump: true};
			}
			if (options.prerelease) {
				standardArgs.prerelease = options.prerelease;
			}
			this.spinner.start('bumping version and updating changelog');
			try {
				await standardVersion(standardArgs);
				this.spinner.info('bumping version done');
			}
			catch (err) {
				this.spinner.fail(`standard-version failed!`);
				throw new DieHardError(err.message);
			}

			if (!options.noPush) {
				this.spinner.info('pushing into origin');
				cmds.push('git push --follow-tags');
			}
			if (!options.noPublish) {
				const basePublish = ['npm publish'];
				try {
					const packageJson = await new FileDocument('package.json').read();
					if (packageJson.content!.publishDir) {
						basePublish.push(packageJson.content!.publishDir);
					}
				} catch (e) {
					this.spinner.fail(`could not read & parse package.json`);
					throw new DieHardError(e.message);
				}
				if (options.distTag) {
					basePublish.push(`--tag ${options.distTag}`);
				}
				cmds.push(basePublish.join((' ')));
			}
			try {
				await this.execAll(cmds);
				this.spinner.succeed('publish done!');
			} catch (e) {
				this.spinner.fail('publish command failed');
			}
		}
	}
}

caporal.command('publish', 'publishes the package in current folder')
	.argument('[version]', 'version idenfier x.x.x or major | minor | patch | premajor | preminor | prepatch | prerelease | from-git)')
	.option('--prerelease <prerelease>', 'makes a prerelease such as 1.0.0-beta.0 where beta is the option you can change here')
	.option('--distTag <distTag>', '')
	.option('--noBump', 'do not bump version, use existing')
	.option('--noPush', 'do not push to origin')
	.option('--noPublish', 'do not publish to npm registry')
	.option('--noClean', 'do not clean node_modules and re-install')
	.option('--noTests', 'do not run tests prior to publishing')
	.option('--stupid', 'sets both noTests and noClean')
	.option('--dryRun', 'sets both noPublish and noPush and does a dry-run for the bump (no files actually modified)')
	.action(new PublishCommand().getHandler());