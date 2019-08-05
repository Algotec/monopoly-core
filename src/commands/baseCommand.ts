/// <reference types="node"/>
/// <reference types="winston"/>
import * as sh from 'shelljs';
import {DieHardError, Logger, RepoApiInterface} from "../types";
import {cliLogger} from "../lib/logger";
import * as child from "child_process";
import * as Ora from 'ora';
import {FileDocument} from "../lib/fileDocument";
import * as path from "path";
import * as winston from "winston";


export interface ExecOptions extends child.ExecOptions {
	silent?: boolean;
	async?: boolean;
}

export type Color = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray';

export interface ISpinner {
	start(text?: string): ISpinner;

	stop(): ISpinner;

	succeed(text?: string): ISpinner;

	fail(text?: string): ISpinner;

	warn(text?: string): ISpinner;

	info(text?: string): ISpinner;

	clear(): ISpinner;

	text: string;

	color: Color;

}

export enum ShellCommands {
	RM = 'rm'
}

export interface execResult {
	code: number,
	message?: string,
	stdout: string,
	stderr: string
};
export type asyncCommandFn = (...args: any[]) => Promise<any>;
export type cmdArray = [ShellCommands, string] | [ShellCommands, string, string];
export type cmdsArray = Array<string | cmdArray | asyncCommandFn>;

export class ExecError extends Error {
	constructor(e: execResult) {
		super(e.message || '');
		this.message = e.message || '';
		this.code = e.code || 1;
		this.stdout = e.stdout;
		this.stderr = e.stderr || e.message;
	}

	stdout: string | undefined;
	stderr: string | undefined;
	code: string | number;
	message: string;
}

export abstract class BaseCommand<ARGS = any, OPTS = any> {

	constructor() {
		this.repoApi = BaseCommand.repoApi;
	}

	static repoApi: RepoApiInterface;
	repoApi: RepoApiInterface;
	log: winston.LogMethod = cliLogger.log.bind(cliLogger);
	debug: winston.LeveledLogMethod = cliLogger.debug.bind(cliLogger);
	warn: winston.LeveledLogMethod = cliLogger.warn.bind(cliLogger);
	error: winston.LeveledLogMethod = cliLogger.error.bind(cliLogger);
	info: winston.LeveledLogMethod = cliLogger.info.bind(cliLogger);
	protected spinner: ISpinner = Ora({spinner: 'dots'});

	async execAll(cmds: cmdsArray, bailOnError: boolean = false) {
		const final: execResult[] = [];
		try {
			for await (let cmdRet of this.execAllGen(cmds, bailOnError)) {
				final.push(cmdRet);
			}
		} catch (e) {
			throw e;
		}
		return final;
	}

	async* execAllGen(cmds: cmdsArray, bailOnError: boolean = true) {
		const final: execResult[] = [];
		for (let cmd of cmds) {
			let retVal;
			if (typeof cmd === 'function') {
				try {
					retVal = yield await cmd();
				} catch (e) {
					if (bailOnError) {
						throw e;
					} else {
						retVal = e;
					}

				}
			} else {
				try {
					retVal = yield await this.exec(cmd)
				} catch (e) {
					if (bailOnError) {
						throw new Error(`cmd failed : ${cmd}:\n code: ${e.code} \n stdErr : ${e.stderr}`);
					} else {
						retVal = e;
					}
				}
			}
			final.push(retVal);
		}
		return final;
	}

	async* execGenerator(iterable: any[], cmdfn: (value: string) => string) {
		for (let value of iterable) {
			const cmd = cmdfn(value);
			let result;
			try {
				result = await this.exec(cmd);
			} catch (e) {
				result = e;
			}
			yield  [value, result];
		}
	}

	async exec(cmd: string | string[], options?: ExecOptions & { progress?: boolean }): Promise<execResult> {
		let retVal: execResult = {code: 0, stdout: '', stderr: ''};
		if (Array.isArray(cmd)) {
			const [type, ...args] = cmd;
			switch (type) {
				case ShellCommands.RM:
					try {
						sh.rm(...args);
					} catch (e) {
						retVal.code = 1;
						retVal.stderr = e.message;
						throw new Error(JSON.stringify(retVal));
					}
			}
			return retVal;
		} else {
			this.debug(cmd);
			try {
				retVal = await new Promise<execResult>((resolve, reject) => {
					const shOptions: ExecOptions = Object.assign({}, options, {silent: true});
					if (options && options.cwd) {
						shOptions.cwd = options.cwd;
					}
					const childProcess = sh.exec(cmd, shOptions, (code: number, stdout: string, stderr: string) => {
						if (stderr) {
							this.debug(stderr);
						}
						if (code) {
							return reject({code, stdout, stderr});
						}
						return resolve({code, stdout, stderr});
					});
					if (options && options.progress && childProcess.stdout && childProcess.stderr) {
						childProcess.stdout.pipe(process.stdout);
						childProcess.stderr.pipe(process.stderr);
					}
				});
			} catch (e) {
				throw new ExecError(e);
			}
			return retVal;
		}
	}

	protected getProjectRepo(args: Partial<{ projectRepoNames: string }>) {
		const {projectRepoNames} = args;
		return (projectRepoNames || '').split('/');
	}

	protected async getPackageJSON() {
		let packageJson: any;
		try {
			packageJson = (await new FileDocument('package.json', {addBlankLine: true}).read()).content;

		} catch (e) {
			this.spinner.fail(`could not read & parse package.json`);
			throw new DieHardError(e.message);
		}
		return packageJson;
	}

	protected fatalErrorHandler(e: Error | string, message?: string): never {
		this.spinner.fail(message);
		this.debug(e.toString());
		throw new DieHardError((e as Error).message || (e as any).error || e + ': ' + message);
	}

	getDocument(filename: string): Promise<FileDocument> {
		return new FileDocument(path.resolve(filename)).read();
	}

	outputFile(filename: string, content: string) {
		((sh as any).ShellString(content) as any).to(filename);
	}

	protected async getWorkspaceRoot(modulePath: string): Promise<string> {
		const moduleGitDir = (await this.exec(`git rev-parse --git-dir`)).stdout.trim();
		const baseArr = moduleGitDir.split('/');
		const baseStr = baseArr.slice(0, baseArr.indexOf('.git')).join(path.sep);
		return baseStr
	}

	abstract getHandler(...args: any[]): (args: ARGS, options: OPTS, logger: Logger) => void | Promise<void>;
}

