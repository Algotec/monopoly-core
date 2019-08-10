#!/usr/bin/env node
// async iterator polyfill for node
import {promisify} from "util";
import {cliLogger} from "./lib/logger";
import {AuthHandler, RepoApiInterface} from "./types/index";

export {AuthHandler, RepoApiInterface} from "./types/index";
import {BaseCommand} from "./commands/baseCommand";
import * as caporal from "caporal";
import {readdir} from "fs";
import * as path from "path";
import {onlyJSFile} from "./lib/general";
import {CliTool, ICliOptions} from "./types/general-cli.types";


//node 8/9 compatability
if (typeof Symbol.asyncIterator === 'undefined') {
	(<any>Symbol).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");
}

const read = promisify(readdir);


const packageJson = require('../package.json');
//exports
export * from './types';
export {InitCommand} from "./commands/init";
export {HoistCommand} from "./commands/hoist";
export {BaseCommand} from "./commands/baseCommand";
export {PublishCommand} from "./commands/publish";
export {isInMonopoly} from "./lib/fs";
export {FileDocument} from "./lib/fileDocument";
export {LernaUtil} from "./lib/lerna-util";
export {consoleLogger} from "./lib/logger";
export default async function makeCli(repoApi: RepoApiInterface, cliOptions: Partial<ICliOptions> = {}, authHandler: AuthHandler): Promise<CliTool> {
	BaseCommand.repoApi = repoApi;

	const cli = caporal
		.name(cliOptions.name || 'monopoly CLI')
		.logger(cliOptions.logger || cliLogger as any)
		.description(cliOptions.description || 'Monopoly based CLI')
		.version(cliOptions.version || packageJson.version);

	const commands = await read(path.join(__dirname, 'commands'));
	commands
		.map(filename => path.join(__dirname, 'commands/', filename))
		.filter(fileName => onlyJSFile(fileName) && !fileName.includes('baseCommand'))
		.forEach(require);

	return cli as CliTool;
}

