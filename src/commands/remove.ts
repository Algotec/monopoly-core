import {Logger} from "../types/index";
import {RepoApiInterface} from "../types/repo.api-interface";
import chalk from "chalk";
import {isInMonopoly} from "../lib/fs";
import {BaseCommand, cmdsArray, ShellCommands} from "./baseCommand";
import * as cli from 'caporal';

export class RemoveCommand extends BaseCommand {
	getHandler() {
		return async (args: { [k: string]: any }, options: { [k: string]: any }, logger: Logger) => {
			this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			if (!isInMonopoly()) {
				logger.error(chalk.red('Not in monopoly folder, please use init command first or change directory'));
				return;
			}
			const {repoNames} = args;
			await this.execAll(repoNames.map((repoName: string) => async () => {
				this.spinner.info(chalk.green(`Removing submodule ${repoName} ....`)).start();
				const cmds: cmdsArray = [
					`git submodule deinit -f ${repoName}`,
					[ShellCommands.RM, '-rf', `.git/modules/${repoName}`],
					`git rm -f ${repoName}`,
					async () => {
						const lerna = await this.getDocument('lerna.json');
						const index = lerna.content.packages.indexOf(repoName);
						if (index !== -1) {
							lerna.content.packages.splice(index, 1);
							await lerna.write();
						} else {
							this.warn('package not found in lerna.json');
						}
					},
					`git commit -m "removing ${repoName}`
				];
				return await (this.execAll(cmds).then((v: any) => {
					this.spinner.succeed(`removed module ${repoNames}`)
				}));
			}));


		}
	}
}

const removeCommand = new RemoveCommand();
cli.command('remove', 'remove repo(s) to monopoly')
	.alias('rm')
	.argument('<repoNames...>', 'repository name(s)', /\w+/)
	.action(removeCommand.getHandler() as ActionCallback);