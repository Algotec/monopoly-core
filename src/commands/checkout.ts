import {BaseCommand} from "./baseCommand";
import {Logger} from "../types";

export interface checkoutArgs {
	branch: string
	source?: string;
}

export interface checkoutOptions {
	b?: boolean
}

export class CheckoutCommand extends BaseCommand {
	getHandler() {
		return async (args: checkoutArgs, options: checkoutOptions, logger: Logger) => {
			try {
				this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
				this.spinner.start(`checking out ${args.branch}`);
				const cmd = `git submodule foreach "git checkout ${(options.b) ? '-B' : '' } ${args.branch} ${args.source ? args.source : ''}"`;
				await this.exec(cmd);
				this.spinner.succeed('checkout completed')
			} catch (e) {
				this.spinner.fail(e.message);
				this.error(e.message);
				throw new Error(e);
			}
		}
	}
}
