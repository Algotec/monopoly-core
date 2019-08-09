import {BaseCommand} from "./baseCommand";
import {DieHardError, Logger} from "../types/general-cli.types";
import * as shell from 'shelljs';
import * as caporal from "caporal";
import {FileDocument} from "../lib/fileDocument";
import * as path from "path";
import * as semver from 'semver';
import {existsSync} from 'fs';

const standardVersion = require("standard-version");
export const canaryPrefix = 'canary';
export const fullCanaryPrefix = `-${canaryPrefix}.`;
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
	noVerify: boolean;
	noPush: boolean;
	noPublish: boolean;
	noClean: boolean;
	noDeploy: boolean;
	noTests: boolean;
	naive: boolean;
	dryRun: boolean;
}

export interface unPublishOptions {
	canary: boolean
	exact: boolean;
}

export class PublishCommand extends BaseCommand {
	//https://github.com/conventional-changelog/conventional-changelog-config-spec/blob/master/versions/2.0.0/README.md
	static changelogPreset: string | object = 'conventionalcommits';
	static releaseCommitMessageFormat: string = 'chore: release {{currentTag}}';

	unpublish() {
		return async (args: publishArgs, options: Partial<unPublishOptions>, logger: Logger) => {
			if (args.version || options.canary) {
				const packageJson = await this.getPackageJSON();
				let tagName = options.exact ? args.version : `v${args.version}`;
				let publishVersion = args.version;
				if (options.canary) {
					const {sha} = await this.getCanaryArgs();
					console.log('got this sha :', sha);
					const baseVersion = this.getVersionBase(packageJson.version);
					tagName = this.getCanaryTagName(baseVersion, sha);
					publishVersion = this.getCanaryVersion(baseVersion, sha);
				}
				this.spinner.start(`Going to remove  ${tagName} git tag and un-publish version ${publishVersion} from npm`);
				let failures = 0;
				try {
					await this.exec(`git tag -d ${tagName}`, {progress: true});
				} catch (e) {
					failures++;
					this.debug(e);
					this.warn('unable to delete local tag');
				}
				try {
					await this.exec(`git push --delete origin refs/tags/${tagName}`, {progress: true});
				} catch (e) {
					failures++;
					this.debug(e);
					this.warn('unable to delete remote tag');
				}
				try {
					await this.exec(`npm unpublish ${packageJson.name}@${publishVersion}`, {progress: true});
				} catch (e) {
					failures++;
					this.debug(e);
					this.warn('unable to remove npm package');
				}
				if (failures > 0) {
					this.spinner.warn('unpublish failed');
					this.spinner.stop();
				} else {
					this.spinner.warn('notice that dist-tag has not been changed, needs to be manually set to last available valid version for this tag');
					this.spinner.succeed('version unpublished');
				}
			} else {
				this.error('must supply version to unpublish');
			}
		}
	}

	getHandler() {
		const revListErrorHandler = (messagee?: string) => {
			const errorMsg = (messagee) ? `git rev-list failed :  ${messagee}` : `git rev-list failed`;
			this.fatalErrorHandler(errorMsg, 'Remote history differs. Please pull changes.')
		};
		return async (args: publishArgs, options: Partial<publishOptions>, logger: Logger) => {
			this.spinner.start('starting prerequisite checks...');
			const packageJson = await this.getPackageJSON();
			const monopolyExtraConfig = packageJson.config && packageJson.config.monopoly ? packageJson.config.monopoly : {};
			const gitStatus = await this.exec('git status --porcelain');

			if (gitStatus.stdout.length) {
				this.fatalErrorHandler(gitStatus.stdout, 'could not publish if working tree is not clean, commit changes first')
			}
			if (!options.canary) { // canary publishing skips remote check as it is usually done in a commit level
				let gitRemoteDiff;
				try {
					gitRemoteDiff = await this.exec('git rev-list --count --left-only @{u}...HEAD');
				} catch (e) {
					revListErrorHandler(e.toString());
				}
				if (gitRemoteDiff && gitRemoteDiff.stderr.length > 0 || gitRemoteDiff && parseInt(gitRemoteDiff.stdout.trim()) !== 0) {
					revListErrorHandler(gitRemoteDiff.stdout);
				}
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
					this.spinner.info('running npm clean install');
					await this.exec('npm ci', {progress: true});
				} catch (e) {
					this.fatalErrorHandler(e, 'npm clean install failed');
				}
			}
			if (!options.noTests) {
				this.spinner.info('running tests');
				const retVal = await this.exec('npm t', {progress: true});
				if (retVal.code) {
					this.fatalErrorHandler(`Tests failed with exit code : ${retVal.code}`, 'tests failed, stopping publish');
				}
			}

			if (options.canary) {
				let {branch, sha} = await this.getCanaryArgs();
				let versionBase = this.getVersionBase(packageJson.version);
				const version = this.getCanaryVersion(versionBase, sha);
				const distTag = this.getCanaryDistTag(versionBase, branch);
				const canaryTagName = this.getCanaryTagName(versionBase, sha);
				options.distTag = distTag;

				this.spinner.info(`starting canary release for distTag ${options.distTag}`);
				try {
					await this.exec(`npm version --force --git-tag-version=false ${version}`, {progress: true});
					if ((packageJson as any).publishDir) {
						const fullPublishDir = path.join(process.cwd(), ...(packageJson as any).publishDir.split('/'));
						const publishDireExists = existsSync(fullPublishDir);
						if (publishDireExists) {
							await this.exec(`npm version --force --git-tag-version=false ${version}`, {progress: true, cwd: fullPublishDir});
						}
					}
					await this.exec(`git tag ${canaryTagName} -m"canary release for version ${versionBase} in branch ${branch}"`, {progress: true});
					await this.exec('git push --tags', {progress: true});
				} catch (e) {
					this.fatalErrorHandler('npm version failed', 'npm version failed, stopping publish');
				}
			} else {
				const standardArgs: any = {
					releaseCommitMessageFormat: PublishCommand.releaseCommitMessageFormat,
					preset: PublishCommand.changelogPreset,
					dryRun: options.dryRun,
					silent: !process.env.AMP_DEBUG
				};
				if (args.version) {
					standardArgs.releaseAs = args.version;
				} else if (options.prerelease) {
					standardArgs.prerelease = options.prerelease;
				}

				if (options.noVerify) {
					standardArgs.noVerify = true;
				}
				if (options.noBump) {
					standardArgs.skip = standardArgs.skip || {};
					standardArgs.skip.bump = true;
					standardArgs.skip.tag = true;
				}

				this.spinner.info('bumping version and updating changelog via standardVersion');
				try {
					await standardVersion(standardArgs);
					this.spinner.info(`standardVersion work done`);
				} catch (err) {
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
			if (!options.noPush && !options.canary) {
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
					const semverValid = semver.valid(options.distTag);
					if (semverValid) {
						throw new DieHardError(`requested dist-tag name - ${options.distTag} is semver valid and therefor NOT valid as dist-tag, cannot publish`);
					}
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
					logger.info(`published metadata : ####$$$$ ${JSON.stringify(publishMeta, null, 4)}####$$$$`);
				} catch (e) {
					this.fatalErrorHandler(e, 'publish command failed');
				}
				if (options.canary) {
					this.spinner.info('resetting local changes (package.json)');
					try {
						await this.exec('git reset HEAD --hard', {progress: true});
					} catch (e) {
						this.debug(e);
						this.spinner.warn('could not reset worktree');
					}

				}
				if (!options.noDeploy && !options.canary) {
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

	private getVersionBase(version: string) {
		if (version.includes(fullCanaryPrefix)) { // already a canary release - regain the version base
			version = version.substr(0, version.indexOf(fullCanaryPrefix));
		}
		return version;
	}

	private async getPjsonVersion(pjsonPath: string): Promise<string> {
		try {
			const pJsonPublished = (await new FileDocument(pjsonPath, {addBlankLine: true}).read()).content;
			return pJsonPublished.version;
		} catch (e) {
			return this.fatalErrorHandler(e, 'could not read build package.json version');
		}
	}

	private async getCanaryArgs(): Promise<{ branch: string; sha: string }> {
		const branch: string = (await this.exec(`git symbolic-ref -q --short HEAD`)).stdout.trim();
		const sha: string = (await this.exec(``, {progress: true})).stdout.trim();
		return {branch, sha};
	}

	private getCanaryTagName(versionBase: any, sha: string) {
		return `v${this.getCanaryVersion(versionBase, sha)}`
	}

	private getCanaryVersion(versionBase: any, sha: string) {
		return `${versionBase}-${canaryPrefix}.${sha}`;
	}

	private getCanaryDistTag(versionBase: any, branch: string) {
		return `${canaryPrefix}-${versionBase}-${branch}`;

	}

}

const publishCommand = new PublishCommand();

caporal.command('publish', 'publishes the package in current folder')
	.argument('[version]', 'version identifier x.x.x or major | minor | patch | premajor | preminor | prepatch | prerelease | from-git)')
	.option('--prerelease <prerelease>', 'makes a prerelease such as 1.0.0-beta.0 where beta is the option you can change here')
	.option('--distTag <distTag>', '')
	.option('--noBump', 'do not bump version, use existing')
	.option('--noVerify', 'do not run git hooks')
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
	.command('unpublish', 'unpublishes packages').argument(
	'[version]', 'version identifier x.x.x - needed unless canary')
	.option('--canary', 'use canary version based on branch name and last sha')
	.option('--exact', 'use exact version not adding v to tag name')
	.action(publishCommand.unpublish())
