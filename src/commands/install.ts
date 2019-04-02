import {BaseCommand} from "./baseCommand";
import {Logger} from "../types/general-cli.types";
import * as path from "path";
import {LernaUtil} from "../lib/lerna-util";

import * as cli from 'caporal';
import {HoistingUtil} from "../lib/hoisting-util";
export interface installOptions {
}


export class InstallCommand extends BaseCommand {
	getHandler() {
		return async (args: object, options: installOptions, logger: Logger) => {
			try {
				this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)}, options :${JSON.stringify(options)}`);
				let lerna = await (new LernaUtil().parse(path.join(process.cwd(), 'lerna.json')));
				this.debug(JSON.stringify(lerna.packageFolders));
				this.spinner.info(`Setting up packages ${lerna.packageFolders.join(',')}`).start();
				const cmd = `lerna bootstrap`;
				await this.exec(cmd, {silent: false, progress: true});
				this.spinner.succeed('install completed');
				if(lerna.hoist) {
                    await new HoistingUtil().makeHoistingLinks(lerna);
                    this.spinner.succeed('hoisting completed');
                }
			} catch (e) {
				let parsedMessage: any;
				try {
					parsedMessage = JSON.parse(e.message)
				} catch (e) {
				}
				let errorMesaage = '';
				if (parsedMessage && parsedMessage.stderr.indexOf('npm ERR!') > -1) {
					const startErr = parsedMessage.stderr.indexOf('npm ERR!');
					const endOfErr = parsedMessage.stderr.indexOf('lerna ERR!', startErr);
					errorMesaage = parsedMessage.slice(startErr, endOfErr)
				}
				this.spinner.fail(errorMesaage);
				this.error(e.message);
			}
		}
	}
}

const installCommand = new InstallCommand();
cli.command('install', 'install depe dependencies and link repos')
	.alias('i')
	.action(installCommand.getHandler() as ActionCallback);
