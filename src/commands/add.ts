import {DieHardError, Logger} from "../types/index";
import {RepoApiInterface} from "../types/repo.api-interface";
import chalk from "chalk";
import {isInMonopoly} from "../lib/fs";
import {BaseCommand} from "./baseCommand";

export const projectRepoValidator = /\w+\/\w+/g;

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
				await Promise.all(projectRepoNames.map(async (projectAndRepo: string) => {
					const [project, repoName] = projectAndRepo.split('/');

					const repoResult = await this.repoApi.getRepo(logger, {organization: project, name: repoName});
					if (repoResult.status != 'OK' || !repoResult.repo) {
						return new DieHardError('Could not clone repo, can not get repo URL');
					}
					const url = repoResult.repo.url;
					if (!repoResult.repo.defaultBranch) {
						return new DieHardError('The repo does not have a branch yet, perhaps a bare repo?');
					}
					const defaultBranch = repoResult.repo.defaultBranch.replace('refs/heads/','');
					this.spinner.info(chalk.green(`Adding submodule ${repoName} ....`)).start();
					const cmds = [
						`git submodule add --force -b ${branch || defaultBranch} ${url} ${repoName}`,
						async () => {
							const lerna = await this.getDocument('lerna.json');
							lerna.content.packages.push(repoName);
							await lerna.write();
						},
						`git commit -am"Add module ${repoName}"`
					];
					return await this.execAll(cmds);
				}));
				this.spinner.succeed('added successfully! - now run sync command');
			} catch (e) {
				this.spinner.fail('failed to add !');
				this.error(e);
			}
			finally {
				this.spinner.stop();
			}
		}
	}
}
