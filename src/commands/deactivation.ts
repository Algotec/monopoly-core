import {BaseCommand, execResult} from "./baseCommand";
import {Logger} from "../types";

export interface deActivationArgs {
	repoNames: string[]
}


export class DeactivationCommand extends BaseCommand {


	getHandler() {
		return async (args: deActivationArgs, options: { [k: string]: any }, logger: Logger) => {
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
		}


	}
}