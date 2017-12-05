/// <reference types="node"/>
import * as sh from 'shelljs';
import {DieHardError, Logger, RepoApiInterface, TasksManagementAPIInterface} from "../types";
import * as winston from 'winston'; //keep this here for types
import {cliLogger, consoleLogger} from "../lib/logger";
import * as child from "child_process";

export interface ExecOptions extends child.ExecOptions {
	silent?: boolean;
	async?: boolean;
}

import * as Ora from 'ora';
import {FileDocument} from "../lib/fileDocument";
import * as path from "path";

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
	stdout: string,
	stderr: string
};
export type asyncCommandFn = (...args: any[]) => Promise<any>;
export type cmdArray = [ShellCommands, string] | [ShellCommands, string, string];
export type cmdsArray = Array<string | cmdArray | asyncCommandFn>;

export abstract class BaseCommand {

	constructor() {
		this.repoApi = BaseCommand.repoApi;
		this.taskApi = BaseCommand.taskApi;
	}

	static repoApi: RepoApiInterface;
	repoApi: RepoApiInterface;
	static taskApi: TasksManagementAPIInterface;
	taskApi: TasksManagementAPIInterface;
	log = cliLogger.log;
	debug = cliLogger.debug;
	warn = cliLogger.warn;
	error = cliLogger.error;
	info = cliLogger.info;
	protected spinner: ISpinner = Ora({spinner: 'dots'});

	async execAll(cmds: cmdsArray) {
		const final: execResult[] = [];
		await cmds.reduce((promise, cmd) => {
			return promise
				.then(async (result) => {
					if (typeof cmd === 'function') {
						return await cmd();
					}
					else return await this.exec(cmd)
						.then((result: any) => {
							(result) ? final.push(result) : null;
						})
				})
		}, Promise.resolve());
		return final;
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
					if (options && options.progress) {
						childProcess.stdout.pipe(process.stdout);
						childProcess.stderr.pipe(process.stderr);
					}
				});
			} catch (e) {
				retVal.code = e.code || 1;
				retVal.stdout = e.stdout;
				retVal.stderr = e.stderr || e.message;
				throw new Error(JSON.stringify(retVal));
			}
			return retVal;
		}
	}

	getDocument(filename: string): Promise<FileDocument> {
		return new FileDocument(path.resolve(filename)).read();
	}

	outputFile(filename: string, content: string) {
		((sh as any).ShellString(content)as any).to(filename);
	}

	abstract getHandler(...args: any[]): void;
}

