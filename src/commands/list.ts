import {DieHardError, Logger} from "../types/index";
import {RepoApiInterface} from "../types/repo.api-interface";
import chalk from "chalk";
import {BaseCommand} from "./baseCommand";
import {consoleLogger} from "../lib/logger";

export interface IRepoSearchOpts {
	organization: string,
	name: string
}

export interface IBranchSearchOpts {
	name: string
}

export class ListCommand extends BaseCommand {
	private async listReposAndprojects(filter: IRepoSearchOpts, repoApi: RepoApiInterface, logger: Logger) {
		this.spinner.info(chalk.yellow('listing workspace available repos:')).start();
		const repoListResult = await repoApi.list(logger, filter);
		if (repoListResult.repoList) {
			const repoList = repoListResult.repoList;
			for (let project of repoList) {
				consoleLogger.info(chalk.red(`Project : ${project.organization}`));
				project.repos.forEach((repoName) => {
					consoleLogger.info(chalk.green(`    ${repoName}`));
				});
			}
		}
		this.spinner.stop();
	}

	getHandler(repoApi: RepoApiInterface) {
		return async (args: { [k: string]: any }, options: { [k: string]: any }, logger: Logger) => {
			this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			try {
				const {projectRepoNames} = args;
				console.log(projectRepoNames);
				const [project, repoName] = (projectRepoNames || '').split('/');
				const filter: IRepoSearchOpts = {organization: options.project, name: options.name};
				if (project || repoName) {
					await this.listBranches(project, repoName, filter.name, repoApi, logger);
				} else {
					await this.listReposAndprojects(filter, repoApi, logger);
				}
			} catch (e) {
				return new DieHardError('unable to list repositories, check connection: ' + e)
			}
		};
	}

	private async listBranches(project: string, repoName: string, filter: string, repoApi: RepoApiInterface, logger: Logger) {
		this.spinner.info(chalk.red(`listing branches on ${project}${repoName ? `/${repoName}` : ''}`)).start();
		const branchSearchResult = await repoApi.listBranches(logger, project, repoName, filter);
		if (branchSearchResult.branchList) {
			branchSearchResult.branchList.forEach(branchName => {
				consoleLogger.info(chalk.green(branchName));
			});
		}
		this.spinner.stop();
	}
}

export default new ListCommand();
