import {ActionCallback, DieHardError, Logger, repoInfo} from "../types/index";
import chalk from "chalk";
import {BaseCommand} from "./baseCommand";
import {consoleLogger} from "../lib/logger";
import * as caporal from "caporal";
import {Hash, projectRepoValidator} from "../lib/general";


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


export class ListCommand extends BaseCommand {

	async listProjectDeps(logger: Logger, project: string, repoName: string, options: IListCommandOptions) {
		if (!options.json) {
			this.spinner.info(chalk.red(`listing dependencies on ${project}${repoName ? `/${repoName}` : ''}`)).start();
		}
		const depsSearchResult = await this.repoApi.listDependencies(logger, project, repoName, options.branch, options.deps as string);
		if (options.json) {
			consoleLogger.info(JSON.stringify(depsSearchResult.depsList, null, 4))
		} else {
			if (depsSearchResult.depsList) {
				consoleLogger.info('');
				Object.entries(depsSearchResult.depsList).forEach(([depName, version]) => {
					consoleLogger.info(`${chalk.green(depName)} : ${chalk.magenta(version.toString())}`);
				});
			}
		}
		this.spinner.stop();
	}

	getHandler(): ActionCallback {
		return async (args: Hash, options: IListCommandOptions, logger: Logger) => {
			this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			try {
				const [project, repoName] = this.getProjectRepo(args);
				const filter: IRepoSearchOpts = {organization: options.project, name: options.name};
				if (project && repoName) {
					await this.listProjectDeps(logger, project, repoName, options);
				} else {
					await this.listReposAndprojects(filter, options.deps, options.branch, options.json, logger);
				}
			} catch (e) {
				throw new DieHardError('unable to list repositories, check connection: ' + e)
			}
		};
	}

	private async listReposAndprojects(filter: IRepoSearchOpts, dependencies: IListCommandOptions["deps"], branch: string | undefined, json: boolean | undefined, logger: Logger) {
		if (!json) {
			this.spinner.info(chalk.yellow('listing workspace available repos:')).start();
		}
		const repoListResult = await this.repoApi.list(logger, filter, branch, dependencies);
		if (repoListResult.repoList) {
			const repoList = repoListResult.repoList;
			if (json) {
				const transformedOutput = repoList.reduce((acc: Hash, organization) => {
					return {
						...acc, ...organization.repos.reduce((acc: Hash, repoInfo: repoInfo) => {
							acc[repoInfo.packageName || repoInfo.name] = repoInfo;
							return acc;
						}, {})
					}
				}, {});
				consoleLogger.info(JSON.stringify(transformedOutput, null, 4))
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

}

const listCommand = new ListCommand();
caporal.command('list', 'list repositories or branches in repo')
	.argument('[projectRepoNames]', 'project & repository name - causes branch search', projectRepoValidator)
	.option('--json', 'format output as json')
	.option('--deps [depsName]', 'list project dependencies -> also possible to filter by depName')
	.option('--branch <branchName>', 'relevant to project dependencies -> which branch to check')
	.option('--project <projectFilter>', 'filter by project name')
	.option('--name <nameFilter>', 'filter by repository name')
	.action(listCommand.getHandler() as ActionCallback);
