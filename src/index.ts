#!/usr/bin/env node
// async iterator polyfill for node
(<any>Symbol).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");

import {projectRepoValidator} from "./lib/general";
import './lib/ide-fix';
import {cliLogger} from "./lib/logger";
import * as path from "path";

import {ActionCallback, CliTool, TasksManagementAPIInterface, RepoApiInterface, ICliOptions} from "./types/index";

import {AddCommand} from "./commands/add";
import {InitCommand} from "./commands/init";
import {RemoveCommand} from "./commands/remove";
import {CheckoutCommand} from "./commands/checkout";
import {UpdateCommand} from "./commands/update";
import {LinkCommand} from "./commands/link";
import {LoginCommand} from "./commands/login";
import {GeneralCommand} from "./commands/general";
import {InstallCommand} from "./commands/install";
import {PullRequestCommand} from "./commands/pull-request";

import {BaseCommand} from "./commands/baseCommand";
import {ActivationCommand} from "./commands/activation";
import {DeactivationCommand} from "./commands/deactivation";
import * as caporal from "caporal";

//exports
export * from './types/index';


const packageJson = require('../package.json');
export {BaseCommand} from "./commands/baseCommand";
export {consoleLogger} from "./lib/logger";
export default function makeCli(repoApi: RepoApiInterface, tasksApi: TasksManagementAPIInterface, cliOptions: Partial<ICliOptions> = {}): CliTool {
	BaseCommand.repoApi = repoApi;
	BaseCommand.taskApi = tasksApi;
	const cli = caporal
		.name(cliOptions.name || 'monopoly CLI')
		.logger(cliOptions.logger || cliLogger as any)
		.description(cliOptions.description || 'Monopoly based CLI')
		.version(cliOptions.version || packageJson.version);

	require('./commands/publish');
	require('./commands/version');
	require('./commands/branch-ls');
	require('./commands/list');

	const loginCommand = new LoginCommand();
	loginCommand.getCredentials();


	const removeCommand = new RemoveCommand();
	const updateCommand = new UpdateCommand();
	const installCommand = new InstallCommand();
	const pullRequestCommand = new PullRequestCommand();
	const generalCommand = new GeneralCommand();
	const checkoutCommand = new CheckoutCommand();
	const activatationCommand = new ActivationCommand();
	const deactivatationCommand = new DeactivationCommand();
	const initCommand = new InitCommand();



	cli.command('login', 'stores username and password for repo access')
		.action(loginCommand.getHandler());
	cli.command('logout', 'removes username and password storage')
		.action(loginCommand.logOutHandler);

	cli.command('init', 'init a new monopoly workspace at current folder')
		.argument('[folder]', 'folder to create  - defaults to current folder', cli.STRING, '.')
		.action(initCommand.getHandler());


	const addCommand = new AddCommand();
	cli.command('add', 'add repo(s) to monopoly')
		.alias('a')
		.argument('<projectRepoNames...>', 'project & repository name(s)', projectRepoValidator)
		.option('--branch <branch>', 'branch name')
		.action(addCommand.getHandler() as  ActionCallback);


	cli.command('remove', 'remove repo(s) to monopoly')
		.alias('rm')
		.argument('<repoNames...>', 'repository name(s)', /\w+/)
		.action(removeCommand.getHandler() as ActionCallback);

	cli.command('activate', 'activate repo(s) in monopoly')
		.alias('act')
		.argument('<repoNames...>', 'repository name(s)', /\w+/)
		.action(activatationCommand.getHandler() as ActionCallback);


	cli.command('deactivate', 'deactivate repo(s) in monopoly')
		.alias('deact')
		.argument('<repoNames...>', 'repository name(s)', /\w+/)
		.action(deactivatationCommand.getHandler() as ActionCallback);


	cli.command('checkout', 'checkout branch for all repo(s)')
		.alias('ck')
		.argument('<branch>', 'branch name', /\w+/)
		.argument('[source]', 'source branch name', /\w+/)
		.option('-b', 'create new branch')
		.option('--fallbackToDefault', 'if checkout fails - checkout repository default folder')
		.action(checkoutCommand.getHandler() as ActionCallback);


	cli.command('update', 'update git for all repo(s)')
		.alias('u')
		.argument('<remote>', 'remote name', /\w+/)
		.argument('<branch>', 'branch name', /\w+/)
		.option('--rebase', 'use rebase')
		.action(updateCommand.getHandler() as ActionCallback);

	const linkCommand = new LinkCommand();
	cli.command('link', 'link repos dependencies')
		.alias('l')
		.option('--install', 'also run npm install')
		.option('--force-local', 'force link ignoreing different versions')
		.action(linkCommand.getHandler() as ActionCallback);


	cli.command('install', 'install depe dependencies and link repos')
		.alias('i')
		.action(installCommand.getHandler() as ActionCallback);


	cli.command('pull-request', 'create a Pull-request in all repos taking title and description from a task #')
		.alias('pr')
		.argument('<taskID>', 'the ID of the task from which to take the title and description')
		.action(pullRequestCommand.getHandler() as ActionCallback);


	cli.command('ide-fix', 'fix intellij ide (webstorm etc) constant indexing when working with symlinks')
		.action(() => {
			const cmdpath = path.join(__dirname, 'lib', 'ide-fix.js');
			generalCommand.debug(cmdpath);
			generalCommand.exec(`node "${cmdpath}"`);
		});


	return cli as CliTool;
}


export * from "./types/index";