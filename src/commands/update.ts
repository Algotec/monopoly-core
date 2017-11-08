import {BaseCommand} from "./baseCommand";
import {Logger} from "../types";

export interface updatetArgs {
	remote: string
	branch: string;
}

export interface updatetOptions {
	rebase: boolean;
}


export class UpdateCommand extends BaseCommand {
	getHandler() {
		return async (args: updatetArgs, options: any, logger: Logger) => {
			try {
				this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
				this.spinner.start(`Updating git from  ${args.branch}`);
				const cmd = `git submodule foreach "git pull ${(options.rebase) ? '--rebase' : ''} ${args.remote} ${args.branch}"`;
				await this.exec(cmd);
				this.spinner.succeed('update completed')
			} catch (e) {
				this.spinner.fail(e.message);
				this.error(e.message);
				throw new Error(e);
			}
		}
	}
}

export default new UpdateCommand();