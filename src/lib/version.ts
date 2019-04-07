import * as fs from "fs";
import chalk from "chalk";
import {consoleLogger} from './logger';
import {WorkspacePackageInfo} from "../types";
import * as semver from 'semver'
import * as path from 'path';
import {FileDocument} from "./fileDocument";

const log = consoleLogger.info;

export async function showOrFixPackageVersoins(fix: boolean, packageInfos: WorkspacePackageInfo[]) {
	const filesToWrite: { filename: string, content: any }[] = [];
	const libPackagesNames = packageInfos.map(packageInfo => packageInfo.json)
		.filter(packageJson => !packageJson.private).map(packageJson => packageJson.name);
	if (fix) {
		log(chalk.cyanBright(`Fixing used versions of ${libPackagesNames.join(', ')}`));
	}

	const fields = ['dependencies', 'devDependencies', 'peerDependencies'];


	await Promise.all(packageInfos.map(async (packageInfo) => {
		let linkedAtRoot = false;
		try {
			const libInstallPath = path.join("node_modules", ...packageNameToFolderArray(packageInfo.name));
			consoleLogger.debug('checking for symlink of :' + libInstallPath);
			const stats = fs.lstatSync(libInstallPath);
			linkedAtRoot = stats.isSymbolicLink();
		} catch (e) {
			consoleLogger.debug(e);
		}
		log(chalk.greenBright('➣ ') +  chalk.blue(`${packageInfo.name}: ${packageInfo.version} ${linkedAtRoot ? chalk.yellow('<Linked@WorkspaceRoot>') : ''}`));
		const json = packageInfo.json;
		const prompt: any = {};
		fields.forEach(field => {
			libPackagesNames.forEach((LibPackage) => {
				if (json[field] && LibPackage in json[field]) {
					prompt[field] = prompt[field] || [];
					const packageDef = packageInfos.find((packageInfo) => packageInfo.name === LibPackage);
					if (packageDef) {
						const libPackageVersion = json[field][LibPackage];
						let satisfy = semver.satisfies(packageDef.version, libPackageVersion);
						let symlinked = false;
						try {
							const libInstallPath = path.join(packageInfo.folder, 'node_modules', ...packageNameToFolderArray(packageDef.name));
							consoleLogger.debug('checking for symlink of :' + libInstallPath);
							const stat = fs.lstatSync(libInstallPath);
							symlinked = stat.isSymbolicLink();
						} catch (e) {
							consoleLogger.debug(e);
						}

						prompt[field].push(`        ⮡${symlinked ? chalk.yellow("SymLinked->") : "NotLinked!"}--${chalk.red(LibPackage)} : ${(!satisfy ? chalk.yellow : chalk.blue)(json[field][LibPackage])}`);
						if (fix && !satisfy) {
							const prefix = (json[field][LibPackage].match(/[\^~]/)) ? json[field][LibPackage][0] : '';
							json[field][LibPackage] = prefix + packageDef.version;
							filesToWrite.push({filename: packageInfo.filename, content: json});
							prompt[field].push(chalk.yellow(`               ⮡ changed to ${prefix}${packageDef.version}`));
						}
					}
				}
			})
		});
		let entries = Object.keys(prompt);
		entries.forEach((field) => {
				log(`  ⮡ ${chalk.greenBright(field)}`);
				log(prompt[field].join('\n'));
			}
		);
		if (filesToWrite) {
			await Promise.all(filesToWrite.map(fileInfo => {
				const file = new FileDocument(fileInfo.filename, {addBlankLine: true});
				file.content = fileInfo.content;
				return file.write();
			}));
		}
	}));
}

function packageNameToFolderArray(name: string): string[] {
	return name.split('/');
}

