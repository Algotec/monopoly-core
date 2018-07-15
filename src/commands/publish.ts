import {BaseCommand} from "./baseCommand";
import {Logger} from "../types";
import * as shell from 'shelljs';
import * as caporal from "caporal";
import {FileDocument} from "../lib/fileDocument";
import * as path from "path";

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
	noBuild: boolean;
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
					await this.exec(`npm unpublish ${packageJson.name}@${distTag}`, {progress: true});
					await this.exec(`git tag -d ${tagName}`, {progress: true});
					await this.exec(`git push --delete origin refs/tags/${tagName}`, {progress: true});
				} catch (e) {
					this.fatalErrorHandler(e, 'unpublish failed');
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
			const monopolyExtraConfig = packageJson.config && packageJson.config.monopoly ? packageJson.config.monopoly : {};
			const gitStatus = await this.exec('git status --porcelain');
			if (gitStatus.stdout.length) {
				this.fatalErrorHandler(gitStatus.stdout, 'could not publish if working tree is not clean, commit changes first')
			}
			let gitRemoteDiff;
			try {
				gitRemoteDiff = await this.exec('git rev-list --count --left-only @{u}...HEAD');
			} catch (e) { // todo: refactor DRY
				this.fatalErrorHandler(`git rev-list failed`, 'Remote history differs. Please pull changes.')
			}
			if (gitRemoteDiff && gitRemoteDiff.stderr.length > 0 || gitRemoteDiff && parseInt(gitRemoteDiff.stdout.trim()) !== 0) {
				this.fatalErrorHandler(`git rev-list failed :  ${gitRemoteDiff.stdout}`, 'Remote history differs. Please pull changes.')
			}
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
					this.fatalErrorHandler(e, 'cleaning node_modules failed!')
				}
				try {
					this.spinner.info('running npm clean install');
					await this.exec('npm i', {progress: true});
				} catch (e) {
					this.fatalErrorHandler(e, 'npm install failed');
				}
			}
			if (!options.noTests) {
				this.spinner.info('running tests');
				const retVal = await this.exec('npm t', {progress: true});
				if (retVal.code) {
					this.fatalErrorHandler(`Tests failed with exit code : ${retVal.code}`, 'tests failed, stopping publish');
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
					await this.exec(`git tag -a ${tagName} -m"canary release for version ${versionBase} in branch ${branch}"`, {progress: true});
				} catch (e) {
					this.fatalErrorHandler('tag failed', 'git tag failed, stopping publish');
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
					this.fatalErrorHandler(err, `standardVersion failed!`);
				}
			}
			if (monopolyExtraConfig.build && !options.noBuild) {
				this.spinner.info(`building via custom scripts : ${monopolyExtraConfig.build}`);
				try {
					await this.exec(monopolyExtraConfig.build, {progress: true});
				} catch (err) {
					this.fatalErrorHandler(err, `custom build failed!`);
				}
			}
			if (!options.noPush) {
				this.spinner.info('pushing into origin');
				try {
					await this.exec('git push --follow-tags', {progress: true});
				} catch (err) {
					this.fatalErrorHandler(err, `git push failed!`);
				}
			}
			if (!options.noPublish) {
				this.spinner.info('publishing into npm registry');
				const basePublish = ['npm publish'];
				if (options.distTag) {
					basePublish.push(`--tag ${options.distTag}`);
				}
				let pjsonPath = path.join(process.cwd(), 'package.json');
				if (packageJson.publishDir) {
					basePublish.push(packageJson.publishDir);
					pjsonPath = path.join(process.cwd(), packageJson.publishDir, 'package.json');
				}
				const publishedVersion = await this.getPjsonVersion(pjsonPath);
				try {
					await this.exec(basePublish.join(' '), {progress: true});
					const publishMeta: any = {version: publishedVersion};
					if (options.distTag) {
						publishMeta.distTag = options.distTag;
					}
					logger.log(` published metadata : ####$$$$ 
					${JSON.stringify(publishMeta, null, 4)}
					####$$$$`)
				} catch (e) {
					this.fatalErrorHandler(e,'publish command failed');
				}
				if (!options.noDeploy) {
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
			}
		}
	}

	private async getPjsonVersion(pjsonPath: string): Promise<string> {
		try {
			const pJsonPublished = (await new FileDocument(pjsonPath).read()).content;
			return pJsonPublished.version;
		} catch (e) {
			return this.fatalErrorHandler(e, 'could not read build package.json version');
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
	.option('--noBuild', 'do not run custom build command (set via config in package.json)')
	.option('--noTests', 'do not run tests prior to publishing')
	.option('--noDeploy', 'do not run deployment push to additional remotes (set via config in package.json)')
	.option('--naive', 'sets both noTests and noClean')
	.option('--dryRun', 'sets both noPublish and noPush and does a dry-run for the bump (no files actually modified)')
	.action(publishCommand.getHandler());


caporal
	.command('unpublish', 'publishes the package in current folder').argument(
	'[version]', 'version identifier x.x.x - needed unless canary').option(
	'--canary', 'use canary version based on branch name and last sha')
	.action(publishCommand.unpublish())
