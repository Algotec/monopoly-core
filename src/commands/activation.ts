import {BaseCommand} from "./baseCommand";
import {Logger} from "../types/general-cli.types";
import * as cli from 'caporal';
export interface activationArgs {
	repoNames: string[]
}

export class ActivationCommand extends BaseCommand {

	getHandler() {
		return async (args: Partial<activationArgs>, options: { [k: string]: any }, logger: Logger) => {
			if (args.repoNames) {
				const iterator = this.execGenerator(args.repoNames, (repoName: string) => `git submodule update --init ${repoName}`);
				this.spinner.start('activating submodules...');
				let hadErrors = false;
				for await (let [value, execResult] of iterator) {
					if (execResult.code) {
						this.error(execResult.stderr);
						hadErrors = true;
					} else {
						this.info(`activated submodule ${value}`);
					}
				}
				if (!hadErrors) {
					this.spinner.succeed('all done');
				} else {
					this.spinner.warn('partially done');
				}
			}else {
				this.error('must have at least one folder argument');
			}
		}

	}
}

const activatationCommand = new ActivationCommand();
cli.command('activate', 'activate repo(s) in monopoly')
	.alias('act')
	.argument('<repoNames...>', 'repository name(s)', /\w+/)
	.action(activatationCommand.getHandler() as ActionCallback);

