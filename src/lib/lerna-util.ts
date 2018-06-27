import {FileDocument} from "./fileDocument";

import * as path from "path";
import * as fs from "fs";
import * as glob from "glob";
import {lernaJsonType, PackageInfo} from "../types/package.types";



export class LernaUtil {
	private lernaJson!: FileDocument<lernaJsonType>;
	public packageFolders!: string[];

	async parse(pathToLerna: string) {
		this.lernaJson = await new FileDocument<lernaJsonType>(pathToLerna).read();
		this.packageFolders = await this.get_packageFolders();

		return this;
	}

	get packages() {
		if (this.selfCheck(this.lernaJson)) {
			return this.lernaJson.content!.packages;

		} else
			throw new Error('lerna json not yet parsed')

	}

	private selfCheck(file: FileDocument): file is FileDocument<lernaJsonType> {
		return (file && file.content);
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
				const url = (json.repository) ? json.repository.url : '';
				return {
					filename: filePath, json, version: json.version, name: json.name, repoUrl: url, folder: packageFolder
				};
			})
		);
	}
}

