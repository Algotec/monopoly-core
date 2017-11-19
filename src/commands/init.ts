import {DieHardError, Logger} from "../types";
import {isInGitFolder} from "../lib/fs";
import * as sh from 'shelljs';
import {gitIgnoreValue, lernaJsonValue, packageJsonValue} from "./data/init.data";
import {BaseCommand} from "./baseCommand";


export class InitCommand extends BaseCommand {
	async installLernaIfDoesntExist() {
		const npmStdOut = await this.exec(`npm ls --json -g lerna`);
		const npmParsed = JSON.parse(npmStdOut.stdout);
		this.debug(npmParsed);
		if (!npmParsed.dependencies) {
			this.spinner.info('installing global dependencies...');
			await this.exec(`npm i -g lerna`);
		}
	}

	getHandler() {
		return async (args: any, options: any, logger: Logger) => {
			this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)} + options :${JSON.stringify(options)}`);
			const folder = args.folder;
			if (isInGitFolder(folder)) {
				return new DieHardError('Unable to init  - .git folder exists');
			}
			try {
				this.spinner.start('creating workspace');
				await this.exec(`git init ${folder}`);
				sh.cd(folder);
				await this.installLernaIfDoesntExist();
				/// todo make a repo for these files and get them via git archive --remote=<repository URL> @ | tar -t
				this.spinner.info('adding workspace files...');
				this.outputFile('.gitignore', gitIgnoreValue);
				this.outputFile('lerna.json', lernaJsonValue);
				this.outputFile('package.json', packageJsonValue);
				this.spinner.info('installing workspace dependencies...').start();
				await this.exec('npm i');
				await this.exec('lerna init --loglevel=warn');
				await this.commitAll();
				await this.exec('amp add web-common/web-config');
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

export default new InitCommand();