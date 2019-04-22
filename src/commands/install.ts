import {BaseCommand} from "./baseCommand";
import {Logger} from "../types/general-cli.types";
import * as path from "path";
import {LernaUtil} from "../lib/lerna-util";

import * as cli from 'caporal';
import {HoistingUtil} from "../lib/hoisting-util";
import {AMP_DEBUG} from "../lib/logger";

export interface installOptions {
}


export class InstallCommand extends BaseCommand {
	getHandler() {
		return async (args: object, options: installOptions, logger: Logger) => {
			try {
				this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)}, options :${JSON.stringify(options)}`);
				let lerna = await (new LernaUtil().parse(path.join(process.cwd(), 'lerna.json')));
				this.debug(JSON.stringify(lerna.packageFolders));
				this.spinner.info(`Setting up packages : \n${lerna.packageFolders.join('\n')}`).start();
				const cmd = `lerna bootstrap`;
				await this.exec(cmd, {silent: false, progress: AMP_DEBUG});
				this.spinner.succeed('install completed');
				if (lerna.hoist) {
					await new HoistingUtil().makeHoistingLinks(lerna);
					this.spinner.succeed('additional hoisting links done');
				}
			} catch (e) {
				this.debug('caught error' + JSON.stringify(e));
				let errorMesaage = '';
				if (e && e.stderr && e.stderr.indexOf('npm ERR!') > -1) {
					const startErr = e.stderr.indexOf('npm ERR!');
					const endOfErr = e.stderr.indexOf('lerna ERR!', startErr);
					errorMesaage = "NPM Install problem : " + e.stderr.slice(startErr, endOfErr);
					this.debug('paresed error' + errorMesaage);
				}
				this.spinner.fail(errorMesaage);
				this.error(e.message);
			}
		}
	}
}

const installCommand = new InstallCommand();
export const installHandler = installCommand.getHandler();
cli.command('install', 'install depe dependencies and link repos')
	.alias('i')
	.action(installHandler as ActionCallback);
