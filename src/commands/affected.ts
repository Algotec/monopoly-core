import {DieHardError, Logger, PackageDesc} from "../types";
import {BaseCommand} from "./baseCommand";
import * as cli from 'caporal';
import {projectRepoValidator} from "../lib/general";
import {consoleLogger} from "../lib/logger";


export interface affectedOpts {
	branch?: string;
}

export interface affectedArgs {
	projectRepoNames: string
	packageDesc: string
}

export class AffectedCommand extends BaseCommand {

	getHandler() {
		return async (args: Partial<affectedArgs>, options: Partial<affectedOpts>, logger: Logger) => {
			this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			try {
				const [project, repoName] = this.getProjectRepo(args);
				if (project && repoName && args.packageDesc && this.repoApi.affectedByPackage) {
					logger.debug(args.packageDesc);
					const packageDesc: PackageDesc = args.packageDesc.split(':') as PackageDesc;
					const affected = await this.repoApi.affectedByPackage(logger, packageDesc, project, repoName, options.branch);
					if (affected.status === 'OK') {
						this.debug(JSON.stringify(affected));
						if (affected.affected) {
							consoleLogger.info('true');
						} else {
							consoleLogger.info('false');
						}
					} else {
						this.fatalErrorHandler(affected.message, 'could not get package dependencies for affected check');
					}
				}
				else {
					this.error('must supply arguments : amp affected project/repo packageName:version');
				}
			} catch (e) {
				throw new DieHardError('unable to list branches, check connection: ' + e)
			}

		}
	}
}

const affectedCommand = new AffectedCommand();
cli.command('affected', 'check if package is affected by another')
	.alias('af')
	.argument('<projectRepoNames>', 'project & repository name', projectRepoValidator)
	.argument('<packageDesc>', 'package name and version') // todo write validator
	.option('--branch <branch>', 'branch name')
	.action(affectedCommand.getHandler() as  ActionCallback);