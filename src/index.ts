#!/usr/bin/env node

import {CliTool} from "./types/index";
import {RepoApiInterface} from "./types/repo.api-interface";
import {TasksManagementAPIInterface} from "./types/tasks.api-interface";
import caporal = require("caporal");
import {ListCommand} from "./commands/list";
import {AddCommand, projectRepoValidator} from "./commands/add";
import {InitCommand} from "./commands/init";
import {RemoveCommand} from "./commands/remove";
import {CheckoutCommand} from "./commands/checkout";
import {UpdateCommand} from "./commands/update";
import {LinkCommand} from "./commands/link";
import {VersionCommand} from "./commands/version";
import {LoginCommand} from "./commands/login";
import {GeneralCommand} from "./commands/general";
import {InstallCommand} from "./commands/install";
import {PullRequestCommand} from "./commands/pull-request";
import './lib/ide-fix';

import {cliLogger} from "./lib/logger";
import * as path from "path";
import * as clortho from "clortho";

export const SERVICE_NAME = 'monopoly';
import * as username from 'username'
import {BaseCommand} from "./commands/baseCommand";

const usernameFromOS = username.sync().toLowerCase();

export default function makeCli(repoApi: RepoApiInterface, tasksApi: TasksManagementAPIInterface): CliTool {

	const loginPrompt = clortho.forService(SERVICE_NAME);
	loginPrompt.getFromKeyChain(usernameFromOS).then((credentials: clortho.Credentials) => {
		const {username, password} = credentials;
		if (username && password) {
			tasksApi.setCredentials(username, password);
			repoApi.setCredentials(username, password);
		} else {
			cliLogger.warn('Not logged in to monopoly, please run login command');
		}
	});


	BaseCommand.repoApi = repoApi;
	BaseCommand.taskApi = tasksApi;

	const listCommand = new ListCommand();
	const loginCommand = new LoginCommand();
	const removeCommand = new RemoveCommand();
	const updateCommand = new UpdateCommand();
	const installCommand = new InstallCommand();
	const pullRequestCommand = new PullRequestCommand();
	const generalCommand = new GeneralCommand();
	const checkoutCommand = new CheckoutCommand();
	const initCommand = new InitCommand();

	const cli = caporal
		.logger(cliLogger as any)
		.version('0.0.1');


	cli.command('login', 'stores username and password for repo access')
		.action(loginCommand.getHandler(usernameFromOS));

	cli.command('init', 'init a new monopoly workspace at current folder')
		.argument('[folder]', 'folder to create  - defaults to current folder', cli.STRING, '.')
		.action(initCommand.getHandler());

	cli.command('list', 'list repositories or branches in repo')
		.argument('[projectRepoNames]', 'project & repository name - causes branch search', projectRepoValidator)
		.option('--json', 'format output as json')
		.option('--deps [depsName]', 'list project dependencies -> also possible to filter by depName')
		.option('--branch <branchName>', 'relevant to project dependencies -> which branch to check')
		.option('--project <projectFilter>', 'filter by project name')
		.option('--name <nameFilter>', 'filter by repository name')
		.action(listCommand.getHandler());

	cli.command('list-deps', 'list repositories or branches in repo')
		.argument('<projectRepoNames>', 'project & repository name', projectRepoValidator)
		.option('--json', 'format output as json')
		.option('--deps <depsName>', 'filter by dependency name')
		.option('--branch <branchName>', 'which branch to check')
		.action(listCommand.listDepsHandler());

	const addCommand = new AddCommand();
	cli.command('add', 'add repo(s) to monopoly')
		.argument('<projectRepoNames...>', 'project & repository name(s)', projectRepoValidator)
		.option('--branch <branch>', 'branch name')
		.action(addCommand.getHandler());


	cli.command('remove', 'remove repo(s) to monopoly')
		.argument('<repoNames...>', 'repository name(s)', /\w+/)
		.action(removeCommand.getHandler());


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

	const linkCommand = new LinkCommand();
	cli.command('link', 'link repos dependencies')
		.option('--install', 'also run npm install')
		.option('--force-local', 'force link ignoreing different versions')
		.action(linkCommand.getHandler());


	cli.command('install', 'install depe dependencies and link repos')
		.action(installCommand.getHandler());


	cli.command('pull-request', 'create a Pull-request in all repos taking title and description from a task #')
		.alias('pr')
		.argument('<taskID>', 'the ID of the task from which to take the title and description')
		.action(pullRequestCommand.getHandler());


	cli.command('ide-fix', 'fix intellij ide (webstorm etc) constant indexing when working with symlinks')
		.action(() => {
			const cmdpath = path.join(__dirname, 'lib', 'ide-fix.js');
			generalCommand.debug(cmdpath);
			generalCommand.exec(`node ${cmdpath}`);
		});

	const status = cli.command('status', 'show repositories status')
		.alias('versions')
		.option('--fix', 'fix dependencies versions')
		.action(new VersionCommand().getHandler());

	(status as any).default();

	return cli as CliTool;
}


export * from "./types/index";