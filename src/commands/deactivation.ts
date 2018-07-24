import {BaseCommand, execResult} from "./baseCommand";
import {Logger} from "../types/general-cli.types";
import * as cli from 'caporal';

export interface deActivationArgs {
	repoNames?: string[]
}


export class DeactivationCommand extends BaseCommand {


	getHandler() {
		return async (args: deActivationArgs, options: { [k: string]: any }, logger: Logger) => {
			if (args.repoNames) {
				const iterator = this.execGenerator(args.repoNames, (repoName: string) => `git submodule deinit -f ${repoName}`);
				this.spinner.start('deactivating submodules...');
				let hadErrors = false;
				for await (let [value, execResult] of iterator) {
					if (execResult.code) {
						this.error(execResult.stderr);
						hadErrors = true;
					} else {
						this.info(`deactivated submodule ${value}`);
					}
				}
				if (!hadErrors) {
					this.spinner.succeed('all done');
				} else {
					this.spinner.warn('partially done');
				}
			} else {
				this.error('must have at least one folder argument');
			}
		}
	}
}

const deactivatationCommand = new DeactivationCommand();


cli.command('deactivate', 'deactivate repo(s) in monopoly')
	.alias('deact')
	.argument('<repoNames...>', 'repository name(s)', /\w+/)
	.action(deactivatationCommand.getHandler() as ActionCallback);


