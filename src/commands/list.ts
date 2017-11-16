import {DieHardError, Logger} from "../types/index";
import {RepoApiInterface} from "../types/repo.api-interface";
import chalk from "chalk";
import {BaseCommand} from "./baseCommand";
import {consoleLogger} from "../lib/logger";

export class ListCommand extends BaseCommand {

	getHandler(repoApi: RepoApiInterface) {
		return async (args: { [k: string]: any }, options: { [k: string]: any }, logger: Logger) => {
			this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			try {
				this.spinner.info(chalk.yellow('listing workspace available repos:')).start();
				const repoListResult = await repoApi.list(logger, {organization: options.project, name: options.name});
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
			} catch (e) {
				return new DieHardError('unable to list repositories, check connection: ' + e)
			}
		};
	}
}

export default new ListCommand();
