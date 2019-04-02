import {BaseCommand} from "./baseCommand";
import {ActionCallback, Logger} from "../types";
import * as caporal from 'caporal';
import {InstallCommand} from "./install";
import {LernaUtil} from "..";
import * as path from "path";
import * as rimraf from "rimraf";
import {promisify} from 'util';

export interface HoistOptions {
	keepNodeModules?: boolean;
}

const rmrf = promisify(rimraf);

export class HoistCommand extends BaseCommand {
	static noHoist: string[] = [];

	getHandler(): ActionCallback {
		return async (args: any, options: HoistOptions, logger: Logger): Promise<void> => {
			this.spinner.info("Removing node modules for all the packages");
			if (!options.keepNodeModules) {
				await this.removeAllNodeModules();
			}
			this.spinner.succeed("Removed successfully");
			await this.updateLernaConfigurations();
			await new InstallCommand().getHandler()({}, {}, logger);
		}
	}

	private async removeAllNodeModules() {
		let lerna = await (new LernaUtil().parse(path.join(process.cwd(), 'lerna.json')));
		const packageFolders = lerna.packageFolders;
		await Promise.all([
			...packageFolders.map((folderName: string) => {
				const nodeModulesPath = path.join(folderName, "node_modules");
				return rmrf(nodeModulesPath);
			}),
			rmrf(path.join(process.cwd(), 'node_modules'))]);
	}

	private async updateLernaConfigurations() {
		const lerna = await this.getDocument('lerna.json');
		lerna.content.hoist = true;
		lerna.content.nohoist = HoistCommand.noHoist;
		await lerna.write();
	}
}

const hoistCommand = new HoistCommand();
caporal.command('hoist', 'convert a workspace to be a hoisted workspace')
	.option('--keep-node-modules', 'do not remove node modules for all packages', caporal.BOOLEAN, false)
	.action(hoistCommand.getHandler());
