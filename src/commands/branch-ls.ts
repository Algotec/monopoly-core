import {BaseCommand} from './baseCommand';

import {IRepoSearchOpts} from '../types';
import {IProjectRepoName, projectRepoValidator} from "../lib/general";
import chalk from "chalk";
import {consoleLogger} from "../lib/logger";
import * as caporal from 'caporal';
import {DieHardError} from "../types";


export interface IListBranchesCommandOptions {
	name?: string;
	json?: boolean;
}

export class ListBranchesCommand extends BaseCommand<IProjectRepoName, IListBranchesCommandOptions> {

	getHandler(): ActionCallback {
		return async (args: Partial<IProjectRepoName>, options: IListBranchesCommandOptions, logger: Logger) => {
			this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			try {
				const [project, repoName] = this.getProjectRepo(args);
				if (project && repoName) {
					const filter: IRepoSearchOpts = {name: options.name};
					await this.listBranches(logger, project, repoName, filter.name, options.json);
				}
				else {
					this.error('must include project and repo for branch-ls command');
				}
			} catch (e) {
				throw new DieHardError('unable to list branches, check connection: ' + e)
			}
		};
	}


	private async listBranches(logger: Logger, project: string, repoName: string, filter?: string, json?: boolean) {
		if (!json) {
			this.spinner.info(chalk.red(`listing branches on ${project}${repoName ? `/${repoName}` : ''}`)).start();
		}
		const branchSearchResult = await this.repoApi.listBranches(logger, project, repoName, filter);
		if (json) {
			consoleLogger.info(JSON.stringify(branchSearchResult.branchList, null, 4))
		} else {
			if (branchSearchResult.branchList) {
				branchSearchResult.branchList.forEach((branchName: string) => {
					consoleLogger.info(chalk.green(branchName));
				});
			}
		}
		this.spinner.stop();
	}
}

const listBranchesCommand = new ListBranchesCommand();
caporal.command('branch-ls', 'list branches in repo')
	.argument('<projectRepoNames>', 'project & repository name', projectRepoValidator)
	.option('--json', 'format output as json')
	.option('--name <nameFilter>', 'filter by repository name')
	.action(listBranchesCommand.getHandler() as ActionCallback);
