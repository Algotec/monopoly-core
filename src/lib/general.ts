import {dependencyTypes, repoInfo} from "../types";
import {statSync} from "fs";

export const projectRepoValidator = /\w+\/\w+/g;

export interface Hash {
	[key: string]: any;
}

export interface IProjectRepoName {
	projectRepoNames: string;
}

const depTypes = Object.keys(dependencyTypes);

export function hasDependencies(repoInfo: repoInfo): boolean {
	for (let depType of depTypes) {
		if (depType in repoInfo) {
			return true;
		}
	}
	return false;
}

export function getJointDependencies(repoInfo: repoInfo): string[] {
	let acc: string[] = [];
	for (let depType of depTypes) {
		if (depType in repoInfo as any) {
			acc = acc.concat(Object.entries(((repoInfo as any)[depType])).reduce((acc: string[], [packageName, version]) => {
				return [...acc, `${packageName}:${version}`];
			}, []));
		}
	}
	return acc;
}

const jsReg = /\w*.js$/;

export function onlyJSFile(fileName: string) {
	return statSync(fileName).isFile() && jsReg.test(fileName)
}