import {BaseCommand} from "./baseCommand";
import {ActionCallback, DieHardError, Logger} from "../types/general-cli.types";
import * as path from "path";
import {LernaUtil} from "../lib/lerna-util";
import {existsSync, renameSync} from 'fs';
import * as cli from 'caporal';
import {promisify} from 'util';
import * as _rimraf from 'rimraf';
import {installHandler} from "./install";

const rimraf = promisify(_rimraf);

export interface focusOptions {
	restore?: boolean;
	link?: boolean;
}

export interface FocusArgs {
	project: string;
}

export class FocusCommand extends BaseCommand {
	getHandler() {
		return async (args: FocusArgs, options: focusOptions, logger: Logger) => {
			try {
				this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)}, options :${JSON.stringify(options)}`);
				let lerna = await (new LernaUtil().parse(path.join(process.cwd(), 'lerna.json')));
				if (!lerna.hoist) {
					throw new DieHardError('focus is relevant only in hoisting mode');
				}
				this.spinner.info(`Focusing package ${args.project}`).start();
				const wsContextModulesPath = path.resolve('./node_modules');
				const wsContextModules = existsSync(wsContextModulesPath);
				const wsContextModulesBakPath = wsContextModulesPath + '.bak';
				const wsContextModulesBak = existsSync(wsContextModulesBakPath);
				if (wsContextModulesBak) {
					throw new DieHardError('backup for context already exists - use `amp focus --restore` first');
				}
				if (wsContextModules) {
					renameSync(wsContextModulesPath, wsContextModulesBakPath);
				}
				(lerna.lernaJson.content as any).focus = args.project;
				await lerna.lernaJson.write();
				const focusPath = path.resolve(args.project);
				await this.exec('npm i', {cwd: focusPath, progress: true});
				this.spinner.succeed('focus done');
			} catch (e) {
				this.spinner.fail(e);
				this.error(e.message);
			}
		}
	}

	async restore(args: FocusArgs, options: focusOptions, logger: Logger) {
		this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)}, options :${JSON.stringify(options)}`);
		let lerna = await (new LernaUtil().parse(path.join(process.cwd(), 'lerna.json')));
		const packageToRestore = (lerna.lernaJson.content as any).focus;
		if (!packageToRestore) {
			throw new DieHardError('lerna.json does not contain info about package to restore - was amp focus used?')
		}
		delete (lerna.lernaJson.content as any).focus;
		await lerna.lernaJson.write();
		// todo: refactor not to repeat code from above;
		const wsContextModulesPath = path.resolve('./node_modules');
		const wsContextModules = existsSync(wsContextModulesPath);
		const wsContextModulesBakPath = wsContextModulesPath + '.bak';
		const wsContextModulesBak = existsSync(wsContextModulesBakPath);
		if (wsContextModules) {
			throw new DieHardError('context node_modules already exists  - could not restore backup');
		}
		if (wsContextModulesBak) {
			renameSync(wsContextModulesBakPath, wsContextModulesPath);
		}
		const focusedModules = path.resolve(packageToRestore, 'node_modules');
		await rimraf(focusedModules);
		await (installHandler({}, {}, logger));
	}
}

const focusCommand = new FocusCommand();
cli.command('focus', 'install local npm dependencies for project whilst (temporarily) removing hoisted workspace context')
	.alias('f')
	.option('--link', 'crates links to workspace modules after the focused install overring local package.json')
	.argument('project', 'project to focus - must be in lerna.json config', String)
	.action(focusCommand.getHandler() as ActionCallback);

cli.command('restore', 'uninstall local npm dependencies for project and restore hoisted workspace context')
	.alias('r')
	.action(focusCommand.restore.bind(focusCommand) as ActionCallback);
