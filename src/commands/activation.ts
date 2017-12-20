import {BaseCommand} from "./baseCommand";
import {Logger} from "../types";

export interface activationArgs {
	repoNames: string[]
}

export class ActivationCommand extends BaseCommand {

	getHandler() {
		return async (args: activationArgs, options: { [k: string]: any }, logger: Logger) => {
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
		}

	}
}