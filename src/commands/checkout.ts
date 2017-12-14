import {BaseCommand} from "./baseCommand";
import {Logger} from "../types";
import {LernaUtil} from "../lib/lerna-util";
import * as path from "path";
import {FileDocument} from "../lib/fileDocument";

export interface checkoutArgs {
	branch: string
	source?: string;
}

export interface checkoutOptions {
	b?: boolean
	fallbackToDefault: boolean
}

export class CheckoutCommand extends BaseCommand {
	getHandler() {
		return async (args: checkoutArgs, options: checkoutOptions, logger: Logger) => {
			this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			let lerna;
			try {
				lerna = await (new LernaUtil().parse(path.join(process.cwd(), 'lerna.json')));
				this.debug(JSON.stringify(lerna.packageFolders));
			} catch (e) {
				this.error('Not in workspace root folder!');
				return;
			}
			await this.execAll(lerna.packageFolders.map((packageFolder) => async () => {
				this.spinner.start(`checking out ${args.branch}`);
				const cmd = `git checkout ${(options.b) ? '-B' : '' } ${args.branch} ${args.source ? args.source : ''}`;
				try {
					return await this.exec(cmd, {cwd: path.join(process.cwd(), packageFolder)}).then(() =>
						this.spinner.succeed(`${packageFolder}  checkout completed`));
				} catch (e) {
					this.spinner.fail(`${packageFolder} checkout failed`);
					this.error(e.message);
					if (options.fallbackToDefault) {
						const defaultBranch = await this.getDefaultBranchLocally(packageFolder);
						this.spinner.info(`fallback to check out ${defaultBranch}`).start();
						const cmd = `git checkout ${defaultBranch}`;
						try {
							return await this.exec(cmd, {cwd: path.join(process.cwd(), packageFolder)}).then(() =>
								this.spinner.succeed(`${packageFolder}  checkout completed`));
						} catch (e) {
							this.spinner.fail(`${packageFolder} checkout failed`);
							this.error(e.message);
						}
					}
				}
			}));
		}
	}

	private async getDefaultBranchLocally(packageFolder: string) {
		const HEAD = path.join(process.cwd(), '.git', 'modules', packageFolder, 'refs', 'remotes', 'origin', 'HEAD');
		let headFile = await new FileDocument(HEAD, {parse: false}).read();
		const lastIndex = (headFile.content).lastIndexOf('/');
		const branch = headFile.content.slice(lastIndex+1, headFile.content.length);
		return branch;

	}
}
