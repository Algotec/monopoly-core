import * as fs from "fs";
import chalk from "chalk";
import {consoleLogger} from './logger';
import {WorkspacePackageInfo} from "../types";
import * as semver from 'semver'

const log = consoleLogger.info;

export function ShowOrFixPackageVersoins(fix: boolean, packageInfos: WorkspacePackageInfo[]) {
	const filesToWrite: { filename: string, content: any }[] = [];
	const LibPackagesNames = packageInfos.map(packageInfo => packageInfo.json)
		.filter(packageJson => !packageJson.private).map(packageJson => packageJson.name);

	log(chalk.green(`${fix ? 'Fixing' : 'Checking for' } used versions of ${LibPackagesNames.join(', ')}`));

	const fields = ['dependencies', 'devDependencies', 'peerDependencies'];


	packageInfos.forEach((packageInfo) => {
		log(chalk.blue(`${packageInfo.name}: ${packageInfo.version}`));
		const json = packageInfo.json;
		const prompt: any = {};
		fields.forEach(field => {
			LibPackagesNames.forEach((LibPackage) => {
				if (json[field] && LibPackage in json[field]) {
					prompt[field] = prompt[field] || [];
					const packageDef = packageInfos.find((packageInfo) => packageInfo.name === LibPackage);
					if (packageDef) {
						const libPackageVersion = json[field][LibPackage];
						let satisfy = semver.satisfies(packageDef.version, libPackageVersion);
						prompt[field].push(`----${chalk.red(LibPackage)} : ${(!satisfy ? chalk.yellow : chalk.blue)(json[field][LibPackage])}`);
						if (fix && !satisfy) {
							const prefix = (json[field][LibPackage].match(/[\^~]/)) ? json[field][LibPackage][0] : '';
							json[field][LibPackage] = prefix + packageDef.version;
							filesToWrite.push({filename: packageInfo.filename, content: json});
							prompt[field].push(chalk.yellow(`               |->> changed to ${prefix}${packageDef.version}`));
						}
					}
				}
			})
		});
		let entries = Object.keys(prompt);
		entries.forEach((field) => {
				log(`--${field}`);
				log(prompt[field].join('\n'));
			}
		);
		if (filesToWrite) {
			filesToWrite.forEach(fileInfo => {
				fs.writeFileSync(fileInfo.filename, JSON.stringify(fileInfo.content, null, 4), {encoding: 'utf8'});
			});
		}
	});
}



