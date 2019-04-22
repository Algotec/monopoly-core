import {BaseCommand} from "./baseCommand";
import {Logger} from "../types/general-cli.types";
import {LernaUtil} from "../lib/lerna-util";
import * as path from "path";
import {showOrFixPackageVersoins} from "../lib/version";
import * as cli from 'caporal';
import * as fs from 'fs'

export interface versionOptions {
	fix?: boolean;
}


export class VersionCommand extends BaseCommand {
	getHandler() {
		return async (args: object, options: versionOptions, logger: Logger) => {
			try {
				this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)}, options :${JSON.stringify(options)}`);
				let lerna = await (new LernaUtil().parse(path.join(process.cwd(), 'lerna.json')));
				this.debug(JSON.stringify(lerna.packageFolders));
				this.debug(`working with packages ${lerna.cleanPackageNames.join(',')}`);
				this.spinner.info(`${options.fix ? 'Fixing up ' : 'showing'} packages versions :`).start().clear();
				let packageInfos = await lerna.packageInfo();
				await showOrFixPackageVersoins(Boolean(options.fix), packageInfos);
				this.spinner.succeed('sync completed');
			} catch (e) {
				this.spinner.fail(e.message + ' - possibly not in monopoly workspace');
			}
		}
	}

}

cli.command('status', 'show repositories status')
	.alias('versions')
	.option('--fix', 'fix dependencies versions')
	.action(new VersionCommand().getHandler());
