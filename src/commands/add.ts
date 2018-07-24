import {repoResult,DieHardError, Logger} from "../types";
import chalk from "chalk";
import {isInMonopoly} from "../lib/fs";
import {BaseCommand} from "./baseCommand";
import * as path from "path";
import * as cli from 'caporal';
import {projectRepoValidator} from "../lib/general";

export class AddCommand extends BaseCommand {

	getHandler() {
		return async (args: { [k: string]: any }, options: { [k: string]: any }, logger: Logger) => {
			this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			if (!isInMonopoly()) {
				this.error(chalk.red('Not in monopoly folder, please use init command first or change directory'));
				return;
			}
			this.spinner.start('adding projects to monopoly repo....');
			const {projectRepoNames} = args;
			const {branch} = options;
			try {
				await this.execAll((projectRepoNames.map((projectAndRepo: string) =>
					async () => {
						const repoResult = await this.getRepoInfo(logger, projectAndRepo);
						if (repoResult.status != 'OK' || !repoResult.repo || !repoResult.repo.url) {
							return new DieHardError('Could not clone repo, can not get repo URL');
						} else {
							const url = repoResult.repo.url;
							const name = repoResult.repo.name;
							let defaultBranch;
							if (repoResult.repo.defaultBranch) {
								defaultBranch = repoResult.repo.defaultBranch.replace('refs/heads/', '');
							}
							this.spinner.info(chalk.green(`Adding submodule ${name} ....`)).start();
							let branchArgument;
							if (branch || defaultBranch) {
								branchArgument = `-b ${branch || defaultBranch}`
							}
							const cmds = [
								`git submodule add ${branchArgument ? branchArgument : ''} --force ${url} ${name}`,
								async () => {
									const lerna = await this.getDocument('lerna.json');
									lerna.content.packages.push(name);
									const publishDir = await this.checkForPublishDir(name);
									if (publishDir) {
										lerna.content.packages.push(`${name}/${publishDir}`);
									}
									await lerna.write();
									if (publishDir) {
										this.spinner.info(chalk.green(`running pre build for submodule ${name} ....`)).start();
										await this.runNpmInstall(name);
									}
								},
								`git commit -am"Add module ${name}"`
							];
							return await
								this.execAll(cmds);
						}
					})));
				this.spinner.succeed('added successfully! - now run install command');
			} catch (e) {
				this.spinner.fail('failed to add !');
				this.error(e);
			}
			finally {
				this.spinner.stop();
			}
		}
	}

	private async getRepoInfo(logger: Logger, projectAndRepo: string): Promise<repoResult> {
		let repoResult: repoResult = {status: "ERROR"};
		if (projectAndRepo.indexOf('://') !== -1) { //absolute url
			const branchIndex = projectAndRepo.lastIndexOf('#');

			repoResult = {
				status: 'OK', repo: {
					url: projectAndRepo.slice(0, branchIndex > -1 ? branchIndex : projectAndRepo.length),
					name:
						projectAndRepo.slice(projectAndRepo.lastIndexOf('/') + 1,
							branchIndex > -1 ? branchIndex : projectAndRepo.length)
				}
			};
			if (branchIndex > -1) {
				(repoResult.repo  as any).defaultBranch = projectAndRepo.slice(branchIndex + 1);
			}
			console.log(JSON.stringify(repoResult, null, 4));
		} else {
			const [project, repoName] = projectAndRepo.split('/');
			repoResult = await this.repoApi.getRepo(logger, {organization: project, name: repoName});
		}
		return repoResult;
	}

	private async checkForPublishDir(name: string) {
		try {
			const packageJson = await this.getDocument(path.join(name, 'package.json'));
			return packageJson.content.publishDir;
		}
		catch (e) {
			this.debug('could not get package.json to check publishDir');
		}
	}

	private async runNpmInstall(name: string) {
		return this.exec('npm install', {cwd: name, progress: true});
	}
}
const addCommand = new AddCommand();
cli.command('add', 'add repo(s) to monopoly')
	.alias('a')
	.argument('<projectRepoNames...>', 'project & repository name(s)', projectRepoValidator)
	.option('--branch <branch>', 'branch name')
	.action(addCommand.getHandler() as  ActionCallback);
