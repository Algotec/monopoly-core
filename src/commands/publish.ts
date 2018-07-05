import {BaseCommand} from "./baseCommand";
import {DieHardError, Logger} from "../types";
import * as shell from 'shelljs';
import * as caporal from "caporal";

const standardVersion = require("standard-version");

export type NPMPreValidatedVersions = 'major' | 'minor' | 'patch' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease' | 'from-git'


export interface publishArgs {
	version?: string | NPMPreValidatedVersions;
}

export interface publishOptions {
	prerelease: string;
	distTag: string;
	canary: boolean;
	noBump: boolean;
	noPush: boolean;
	noPublish: boolean;
	noClean: boolean;
	noDeploy: boolean;
	noTests: boolean;
	naive: boolean;
	dryRun: boolean;
}

export class PublishCommand extends BaseCommand {
	unpublish() {
		return async (args: publishArgs, options: Partial<{ canary: boolean }>, logger: Logger) => {
			if (args.version || options.canary) {
				const packageJson = await this.getPackageJSON();
				let tagName = `v${args.version}`;
				let distTag = args.version;
				if (options.canary) {
					const {branch, sha} = await this.getCanaryArgs();
					tagName = this.getCanaryTagName(packageJson.version, branch, sha);
					distTag = this.getCanaryDistTag(packageJson.version, branch);
				}
				this.spinner.start(`going to unpublish ${tagName} tag and ${distTag} version`);
				try {
					await this.exec(`npm unpublish ${packageJson.name}@${distTag}`);
					await this.exec(`git tag -d ${tagName}`);
					await this.exec(`git push --delete origin refs/tags/${tagName}`);
				} catch (e) {
					this.spinner.fail('unpublish failed');
					this.debug(e);
					throw new DieHardError(e.error);
				}
				this.spinner.succeed('version unpublished');
			} else {
				this.error('must supply version to unpublish');
			}
		}
	}

	getHandler() {
		return async (args: publishArgs, options: Partial<publishOptions>, logger: Logger) => {
			this.spinner.start('starting prerequisite checks...');
			const packageJson = await this.getPackageJSON();
			const gitStatus = await this.exec('git status --porcelain');
			if (gitStatus.stdout.length) {
				this.debug(`gitstatus output : ${gitStatus.stdout}`);
				this.error('could not publish if working tree is not clean, commit changes first');
				throw new DieHardError('working tree dirty');
			}
			let gitRemoteDiff;
			try {
				gitRemoteDiff = await this.exec('git rev-list --count --left-only @{u}...HEAD');
			} catch (e) { // todo: refactor DRY
				this.debug(`git rev-list failed`);
				this.error('Remote history differs. Please pull changes.');
				throw new DieHardError('remote more updated');
			}
			if (gitRemoteDiff && gitRemoteDiff.stderr.length > 0 || parseInt(gitRemoteDiff.stdout.trim()) !== 0) {
				this.debug(`git rev-list output : ${gitRemoteDiff.stdout}`);
				this.error('Remote history differs. Please pull changes.');
				throw new DieHardError('remote more updated');
			}
			const cmds = [];
			if (options.naive) {
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
					throw new DieHardError(e.error);
				}
				try {
					this.spinner.info('running npm clean install');
					await this.exec('npm i', {progress: true});
				} catch (e) {
					this.spinner.fail('npm install failed');
					throw new DieHardError(e.error);
				}
			}
			if (!options.noTests) {
				this.spinner.info('running tests');
				const retVal = await this.exec('npm t', {progress: true});
				if (retVal.code) {
					this.spinner.fail('Tests failed');
					throw new DieHardError('tests failed, stopping publish');
				}
			}
			const standardArgs: any = {dryRun: options.dryRun, silent: !process.env.AMP_DEBUG};
			if (options.canary) {
				const {branch, sha} = await this.getCanaryArgs();
				const versionBase = packageJson.version;
				options.distTag = this.getCanaryDistTag(versionBase, branch);
				this.spinner.info(`starting canary release for distTag ${options.distTag}`);
				const tagName = this.getCanaryTagName(versionBase, branch, sha);
				try {
					await this.exec(`git tag -a ${tagName} -m"canary release for version ${versionBase} in branch ${branch}"`);
				} catch (e) {
					this.spinner.fail('Tests failed');
					throw new DieHardError('git tag failed, stopping publish');
				}
			} else {
				if (args.version) {
					standardArgs.releaseAs = args.version;
				} else if (options.prerelease) {
					standardArgs.prerelease = options.prerelease;
				}

				if (options.noBump) {
					standardArgs.skip = standardArgs.skip || {};
					standardArgs.skip.bump = true;
				}

				this.spinner.info('bumping version and updating changelog via standardVersion');
				try {
					await standardVersion(standardArgs);
					this.spinner.info(`standardVersion work done`);
				}
				catch (err) {
					this.debug(err);
					this.spinner.fail(`standardVersion failed!`);
					throw new DieHardError(err.error);
				}
			}
			if (!options.noPush) {
				this.spinner.info('pushing into origin');
				cmds.push('git push --follow-tags');
			}
			if (!options.noPublish) {
				const basePublish = ['npm publish'];
				if (packageJson.publishDir) {
					basePublish.push(packageJson.publishDir);
				}
				if (options.distTag) {
					basePublish.push(`--tag ${options.distTag}`);
				}
				cmds.push(basePublish.join((' ')));
			}
			try {
				await this.execAll(cmds);
				if (!options.noDeploy) {
					const monopolyExtraConfig = packageJson.config && packageJson.config.monopoly ? packageJson.config.monopoly : undefined;
					let extraRemote: string | string[] | undefined = (monopolyExtraConfig && monopolyExtraConfig.publish && monopolyExtraConfig.publish.postPublishDeploy) ? monopolyExtraConfig.publish.postPublishDeploy : undefined;
					if (extraRemote) {
						if (!Array.isArray(extraRemote)) {
							extraRemote = [extraRemote];
						}
						extraRemote.forEach(async (remote) => {
							try {
								this.spinner.info(`updating  :${remote}...`);
								await this.exec(`git push ${remote}`);
								this.spinner.info(`remote :${remote} updated`);
							} catch (e) {
								this.debug(e);
								this.warn(`failed to deploy to ${remote}`);
							}
						});
					}
				}
				this.spinner.succeed('publish done!');
			} catch (e) {
				this.spinner.fail('publish command failed');
			}
		}
	}

	private async getCanaryArgs() {
		const branch = (await this.exec(` git symbolic-ref -q --short HEAD`)).stdout.trim();
		const sha = (await this.exec(`  git rev-parse --short HEAD`)).stdout.trim();
		return {branch, sha};
	}

	private getCanaryTagName(versionBase: any, branch: string, sha: string) {
		return `v${versionBase}-${branch}.${sha}`
	}

	private getCanaryDistTag(versionBase: any, branch: string) {
		return `${versionBase}-${branch}`;
	}

}

const publishCommand = new PublishCommand();

caporal.command('publish', 'publishes the package in current folder')
	.argument('[version]', 'version identifier x.x.x or major | minor | patch | premajor | preminor | prepatch | prerelease | from-git)')
	.option('--prerelease <prerelease>', 'makes a prerelease such as 1.0.0-beta.0 where beta is the option you can change here')
	.option('--distTag <distTag>', '')
	.option('--noBump', 'do not bump version, use existing')
	.option('--canary', 'use git branch and sha as pre-release-version and dist tag')
	.option('--noPush', 'do not push to origin')
	.option('--noPublish', 'do not publish to npm registry')
	.option('--noClean', 'do not clean node_modules and re-install')
	.option('--noTests', 'do not run tests prior to publishing')
	.option('--noDeploy', 'do not run deployment push to additional remotes')
	.option('--naive', 'sets both noTests and noClean')
	.option('--dryRun', 'sets both noPublish and noPush and does a dry-run for the bump (no files actually modified)')
	.action(publishCommand.getHandler());


caporal
	.command('unpublish', 'publishes the package in current folder').argument(
	'[version]', 'version identifier x.x.x - needed unless canary').option(
	'--canary', 'use canary version based on branch name and last sha')
	.action(publishCommand.unpublish())
