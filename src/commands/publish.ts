import {BaseCommand} from "./baseCommand";
import {Logger} from "../types";
import {LernaUtil} from "../lib/lerna-util";
import * as path from "path";
import {FileDocument} from "../lib/fileDocument";
export type NPMPreValidatedVersions =  'major' | 'minor' | 'patch' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease' |'from-git'
export interface publishArgs {
	version: string;
}

export interface publishOptions {
	distTag:string

}

export class PublishCommand extends BaseCommand {
	getHandler() {
		return async (args: publishArgs, options: publishOptions, logger: Logger) => {

		}
	}
}