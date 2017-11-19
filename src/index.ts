#!/usr/bin/env node

import {CliTool} from "./types/index";
import {RepoApiInterface} from "./types/repo.api-interface";
import {TasksManagementAPIInterface} from "./types/tasks.api-interface";
import caporal = require("caporal");
import listCommand from "./commands/list";
import addCommand, {projectRepoValidator} from "./commands/add";
import initCommand from "./commands/init";
import removeCommand from "./commands/remove";
import checkoutCommand from "./commands/checkout";
import updateCommand from "./commands/update";
import linkCommand from "./commands/link";
import versionCommand from "./commands/version";
import loginCommand from "./commands/login";
import generalCommand from "./commands/general";
import installCommand from "./commands/install";
import prCommand from "./commands/pull-request";
import './lib/ide-fix';

import {cliLogger} from "./lib/logger";
import * as path from "path";
import * as keytar from "keytar";

export const SERVICE_NAME = 'monopoly';
import * as username from 'username'

export default function makeCli(repoApi: RepoApiInterface, tasksApi: TasksManagementAPIInterface): CliTool {

	const cli = caporal
		.logger(cliLogger as any)
		.version('0.0.1');
	cli.command('login', 'stores username and password for repo access')
		.action(loginCommand.getHandler(repoApi, tasksApi));

	cli.command('init', 'init a new monopoly workspace at current folder')
		.argument('[folder]', 'folder to create  - defaults to current folder', cli.STRING, '.')
		.action(initCommand.getHandler());

	cli.command('list', 'list repositories or branches in repo')
		.argument('<projectRepoNames>', 'project  & repository name(s) - causes branch search',projectRepoValidator)
		.option('--project <projectFilter>', 'filter by project name')
		.option('--name <nameFilter>', 'filter by repository name')
		.action(listCommand.getHandler(repoApi));

	cli.command('add', 'add repo(s) to monopoly')
		.argument('<projectRepoNames...>', 'project & repository name(s)', projectRepoValidator)
		.option('--branch <branch>', 'branch name')
		.action(addCommand.getHandler(repoApi));

	cli.command('remove', 'remove repo(s) to monopoly')
		.argument('<repoNames...>', 'repository name(s)', /\w+/)
		.action(removeCommand.getHandler(repoApi));


	cli.command('checkout', 'checkout branch for all repo(s)')
		.argument('<branch>', 'branch name', /\w+/)
		.argument('[source]', 'source branch name', /\w+/)
		.option('-b', 'create new branch')
		.action(checkoutCommand.getHandler());

	cli.command('update', 'update git for all repo(s)')
		.argument('<remote>', 'remote name', /\w+/)
		.argument('<branch>', 'branch name', /\w+/)
		.option('--rebase', 'use rebase')
		.action(updateCommand.getHandler());

	cli.command('link', 'link repos dependencies')
		.option('--install', 'also run npm install')
		.option('--force-local', 'force link ignoreing different versions')
		.action(linkCommand.getHandler());

	cli.command('install', 'install depe dependencies and link repos')
		.action(installCommand.getHandler());

	cli.command('pull-request', 'create a Pull-request in all repos taking title and description from a task #')
		.alias('pr')
		.argument('<taskID>', 'the ID of the task from which to take the title and description')
		.action(prCommand.getHandler(repoApi, tasksApi));

	cli.command('ide-fix', 'fix intellij ide (webstorm etc) constant indexing when working with symlinks')
		.action(() => {
			const cmdpath = path.join(__dirname, 'lib', 'ide-fix.js');
			generalCommand.debug(cmdpath);
			generalCommand.exec(`node ${cmdpath}`);
		});

	const status = cli.command('status', 'show repositories status')
		.alias('versions')
		.option('--fix', 'fix dependencies versions')
		.action(versionCommand.getHandler());

	(status as any).default();


	const user = username.sync().toLowerCase();
	keytar.getPassword(SERVICE_NAME, user).then(password => {
		// cliLogger.debug(`password got from OS ${password}`);
		if (user && password) {
			tasksApi.setCredentials(user, password);
			repoApi.setCredentials(user, password);
		} else {
			cliLogger.warn('Not logged in to monopoly, please run login command');
		}
	});

	return cli as CliTool;
}


export * from "./types/index";