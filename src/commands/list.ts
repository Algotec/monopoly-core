import {DieHardError, Logger, repoInfo} from "../types/index";
import {RepoApiInterface} from "../types/repo.api-interface";
import chalk from "chalk";
import {BaseCommand} from "./baseCommand";
import {consoleLogger} from "../lib/logger";

export interface IListCommandArgs {
	projectRepoNames: string;
}

export interface IDepsListArgs {
	branch?: string;
	deps?: string;
	json?: boolean
}

export interface IListCommandOptions {
	name?: string;
	project?: string;
	branch?: string,
	json?: boolean;
	deps?: string | boolean;
}

export interface IRepoSearchOpts {
	organization?: string,
	name?: string
}

export interface IBranchSearchOpts {
	name: string
}

export class ListCommand extends BaseCommand {

	listDepsHandler() {
		return async (args: IListCommandArgs, options: IDepsListArgs, logger: Logger) => {
			this.debug(`${this.constructor.name + '/listDpes'} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			const [project, repoName] = this.getProjectRepo(args);
			if (project && repoName) {
				if (!options.json) {
					this.spinner.info(chalk.red(`listing dependencies on ${project}${repoName ? `/${repoName}` : ''}`)).start();
				}
				const depsSearchResult = await this.repoApi.listDependencies(logger, project, repoName, options.branch, options.deps);
				if (options.json) {
					consoleLogger.info(JSON.stringify(depsSearchResult.depsList, null, 4))
				} else {
					if (depsSearchResult.depsList) {
						consoleLogger.info('');
						Object.entries(depsSearchResult.depsList).forEach(([depName, version]) => {
							consoleLogger.info(`${chalk.green(depName)} : ${chalk.magenta(version)}`);
						});
					}
				}
				this.spinner.stop();
			} else {
				this.error('must include project and repo for list deps command');
			}
		}
	}

	getHandler() {
		return async (args: IListCommandArgs, options: IListCommandOptions, logger: Logger) => {
			this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			try {
				const [project, repoName] = this.getProjectRepo(args);
				const filter: IRepoSearchOpts = {organization: options.project, name: options.name};
				if (project || repoName) {
					await this.listBranches(project, repoName, filter.name, options.json, logger);
				} else {
					await this.listReposAndprojects(filter, options.deps, options.branch, options.json, logger);
				}
			} catch (e) {
				return new DieHardError('unable to list repositories, check connection: ' + e)
			}
		};
	}

	private getProjectRepo(args: IListCommandArgs) {
		const {projectRepoNames} = args;
		return (projectRepoNames || '').split('/');
	}

	private async listReposAndprojects(filter: IRepoSearchOpts, dependencies: IListCommandOptions["deps"], branch: string | undefined, json: boolean | undefined, logger: Logger) {
		if (!json) {
			this.spinner.info(chalk.yellow('listing workspace available repos:')).start();
		}
		const repoListResult = await this.repoApi.list(logger, filter, branch, dependencies);
		if (repoListResult.repoList) {
			const repoList = repoListResult.repoList;
			if (json) {
				consoleLogger.info(JSON.stringify(repoListResult.repoList, null, 4))
			} else {
				for (let project of repoList) {
					consoleLogger.info(chalk.red(`Project : ${project.organization}`));
					project.repos.forEach((repo: repoInfo) => {
						consoleLogger.info(chalk.green(`    ${repo.name}`));
						if (dependencies && repo.deps && repo.deps.length) {
							consoleLogger.info(chalk.yellow(`	|----->  ${repo.deps.join(',')}`));
						}
					});
				}
			}
		}
		this.spinner.stop();
	}

	private async listBranches(project: string, repoName: string, filter: string | undefined, json: boolean | undefined, logger: Logger) {
		if (!json) {
			this.spinner.info(chalk.red(`listing branches on ${project}${repoName ? `/${repoName}` : ''}`)).start();
		}
		const branchSearchResult = await this.repoApi.listBranches(logger, project, repoName, filter);
		if (json) {
			consoleLogger.info(JSON.stringify(branchSearchResult.branchList, null, 4))
		} else {
			if (branchSearchResult.branchList) {
				branchSearchResult.branchList.forEach(branchName => {
					consoleLogger.info(chalk.green(branchName));
				});
			}
		}
		this.spinner.stop();
	}
}

