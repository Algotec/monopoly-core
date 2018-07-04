#!/usr/bin/env node
// async iterator polyfill for node
import {promisify} from "util";

(<any>Symbol).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");

import './lib/ide-fix';
import {cliLogger} from "./lib/logger";
import {CliTool, DieHardError, ICliOptions, RepoApiInterface, TasksManagementAPIInterface} from "./types/index";
import {BaseCommand} from "./commands/baseCommand";
import * as caporal from "caporal";
import {readdir, statSync} from "fs";
import * as path from "path";
import {onlyJSFile} from "./lib/general";

const read = promisify(readdir);


const packageJson = require('../package.json');
//exports
export * from "./types/index";
export {BaseCommand} from "./commands/baseCommand";
export {consoleLogger} from "./lib/logger";
export default async function makeCli(repoApi: RepoApiInterface, tasksApi: TasksManagementAPIInterface, cliOptions: Partial<ICliOptions> = {}): Promise<CliTool> {
	BaseCommand.repoApi = repoApi;
	BaseCommand.taskApi = tasksApi;

	const cli = caporal
		.name(cliOptions.name || 'monopoly CLI')
		.logger(cliOptions.logger || cliLogger as any)
		.description(cliOptions.description || 'Monopoly based CLI')
		.version(cliOptions.version || packageJson.version);

	const {doLogin} = require('./commands/login');
	if (!process.argv.includes('login')) {
		try {
			await doLogin()
		} catch (e) {
			cliLogger.debug(e.message);
			cliLogger.error('not logged in to Monopoly, please run login command');
			process.exit(1);
		}
	}

	const commands = await read(path.join(__dirname, 'commands'));
	commands
		.map(filename => path.join(__dirname, 'commands/', filename))
		.filter(fileName => onlyJSFile(fileName) && !fileName.includes('baseCommand'))
		.forEach(require);


	return cli as CliTool;
}


