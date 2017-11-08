import {FileDocument} from "./fileDocument";

import * as path from "path";
import * as fs from "fs";
import * as glob from "glob";

export type lernaJsonType = {
	packages: string[]
	[key: string]: any,
}

export interface PackageJsonType {
	name: string;
	version: string;
	dependencies?: { [key: string]: string };
	devDependencies?: { [key: string]: string };
	peerDependencies?: { [key: string]: string };

	[key: string]: any;
}

export interface PackageInfo {
	filename: string,
	json: PackageJsonType,
	version: string,
	name: string,
	repoUrl: string
	folder: string
}

export class LernaUtil {
	private lernaJson: FileDocument<lernaJsonType>;
	public packageFolders: string[];

	async parse(pathToLerna: string) {
		this.lernaJson = await new FileDocument<lernaJsonType>(pathToLerna).read();
		this.packageFolders = await this.get_packageFolders();

		return this;
	}

	get packages() {
		this.selfCheck();
		return this.lernaJson.content.packages;
	}

	private selfCheck() {
		if (!this.lernaJson) {
			throw new Error('lerna json not yet parsed')
		}
	}

	private async get_packageFolders() {
		return this.packages
			.reduce((acc: string[], packageFolder: string) => {
				if (glob.hasMagic(packageFolder)) {
					let matches = glob.sync(packageFolder + '/', {});
					if (matches) {
						acc = acc.concat(matches.filter(((match: string) => !match.includes('node_modules'))));
					}
				} else {
					acc.push(packageFolder);
				}
				return acc;
			}, [])
			.filter((packageFolder: string) => {
				let folder = path.resolve(packageFolder);
				return fs.existsSync(folder);
			});
	}

	async packageInfo(): Promise<PackageInfo[]> {
		return await Promise.all(this.packageFolders.map(async (packageFolder: string) => {
				const filePath = `./${packageFolder}/package.json`;
				const json = (await new FileDocument(filePath).read()).content;
				return {
					filename: filePath, json, version: json.version, name: json.name, repoUrl: json.repository.url, folder: packageFolder
				};
			})
		);
	}
}

