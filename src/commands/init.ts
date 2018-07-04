import {ActionCallback, DieHardError, Logger} from "../types";
import {isInGitFolder} from "../lib/fs";
import * as sh from 'shelljs';
import {gitIgnoreValue, lernaJsonValue, packageJsonValue} from "./data/init.data";
import {BaseCommand} from "./baseCommand";
import * as caporal from 'caporal';

export class InitCommand extends BaseCommand {
	async checkAndInstallGloabls() {
		const npmStdOut = await this.exec(`npm ls --json -g lerna`);
		const npmParsed = JSON.parse(npmStdOut.stdout);
		this.debug(npmParsed);
		if (!npmParsed.dependencies) {
			this.spinner.info('installing global dependencies...');
			await this.exec(`npm i -g lerna`);
		}
	}

	getHandler(): ActionCallback {
		return async (args: any, options: any, logger: Logger): Promise<void> => {
			this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			const folder = args.folder;
			if (isInGitFolder(folder)) {
				throw new DieHardError('Unable to init  - .git folder exists');
			}
			try {
				this.spinner.start('creating workspace');
				await this.exec(`git init ${folder}`);
				sh.cd(folder);
				await this.checkAndInstallGloabls();
				/// todo make a repo for these files and get them via git archive --remote=<repository URL> @ | tar -t
				this.spinner.info('adding workspace files...');
				this.outputFile('.gitignore', gitIgnoreValue);
				this.outputFile('lerna.json', lernaJsonValue);
				this.outputFile('package.json', packageJsonValue);
				this.spinner.info('installing workspace dependencies...').start();
				await this.exec('npm i');
				// await this.exec('lerna init --loglevel=warn');
				await this.commitAll();
				this.spinner.succeed('workspace created!')
			} catch (e) {
				this.spinner.fail(`unable to init git monopoly repo`);
				this.debug(e.stack);
				throw new DieHardError(`git exit code ${e}`);
			} finally {
				this.spinner.stop();
			}
		}
	}

	private async commitAll(message: string = 'initial Commit') {
		this.spinner.info('commiting changes...');
		await this.exec(`git add .`);
		await this.exec(`git commit -am"${message}"`);
	}
}

const initCommand = new InitCommand();
caporal.command('init', 'init a new monopoly workspace at current folder')
	.argument('[folder]', 'folder to create  - defaults to current folder', caporal.STRING, '.')
	.action(initCommand.getHandler());

