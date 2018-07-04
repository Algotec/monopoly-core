import {BaseCommand} from "./baseCommand";
import {Logger} from "../types";
import * as path from "path";
import {LernaUtil} from "../lib/lerna-util";
import * as cli from 'caporal';

export interface linkOptions {
	forceLocal?: boolean
}


export class LinkCommand extends BaseCommand {
	getHandler() {
		return async (args: object, options: linkOptions, logger: Logger) => {
			try {
				this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)}, options :${JSON.stringify(options)}`);
				let lerna = await (new LernaUtil().parse(path.join(process.cwd(), 'lerna.json')));
				this.debug(JSON.stringify(lerna.packageFolders));
				this.spinner.info(`Cross-Linking packages ${lerna.packageFolders.join(',')}`).start();
				const cmd = `lerna link ${(options.forceLocal) ? '--force-local' : ''}`;
				await this.exec(cmd);
				this.spinner.succeed('link completed')
			} catch (e) {
				this.debug(e);
				this.spinner.fail(JSON.stringify(e));
				this.error(e.message);
			}
		}
	}
}
const linkCommand = new LinkCommand();
cli.command('link', 'link repos dependencies')
	.alias('l')
	.option('--install', 'also run npm install')
	.option('--force-local', 'force link ignoreing different versions')
	.action(linkCommand.getHandler() as ActionCallback);
