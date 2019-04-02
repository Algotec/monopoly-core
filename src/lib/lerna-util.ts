import {FileDocument} from "./fileDocument";

import * as path from "path";
import * as fs from "fs";
import * as glob from "glob";
import {lernaJsonType, WorkspacePackageInfo} from "../types/package.types";


export class LernaUtil {
	private lernaJson!: FileDocument<lernaJsonType>;
	public packageFolders!: string[];
	private lernaRootPath!: string;

	async parse(pathToLerna: string) {
		this.lernaJson = await new FileDocument<lernaJsonType>(pathToLerna).read();
		this.lernaRootPath = path.dirname(path.resolve(pathToLerna));
		this.packageFolders = await this.get_packageFolders();

		return this;
	}

	get packages() {
		if (this.selfCheck(this.lernaJson)) {
			return this.lernaJson.content!.packages;

		} else
			throw new Error('lerna json not yet parsed')

	}

	get hoist() : boolean{
        if (this.selfCheck(this.lernaJson)) {
            return this.lernaJson.content!.hoist;

        } else
            throw new Error('lerna json not yet parsed')
	}

	get noHoist() : string[] {
        if (this.selfCheck(this.lernaJson)) {
            return this.lernaJson.content!.nohoist;

        } else
            throw new Error('lerna json not yet parsed')
	}

	private selfCheck(file: FileDocument): file is FileDocument<lernaJsonType> {
		return (file && file.content);
	}

	private async get_packageFolders() {
		let packages = this.packages
			.reduce((acc: string[], packageFolder: string) => {
				if (glob.hasMagic(packageFolder)) {
					let matches = glob.sync(path.join(this.lernaRootPath, packageFolder), {});
					if (matches) {
						acc = acc.concat(matches.filter(((match: string) => !match.includes('node_modules'))));
					}
				} else {
					acc.push(path.join(this.lernaRootPath, packageFolder));
				}
				return acc;
			}, [])
			.filter((packageFolder: string) => {
				let folder = path.resolve(packageFolder);
				return fs.existsSync(folder);
			})
			.filter((packageFolder) => {
				const filePath = path.join(packageFolder, 'package.json');
				return fs.existsSync(filePath)
			});

		return packages;
	}

	async packageInfo(): Promise<WorkspacePackageInfo[]> {
		return await Promise.all(this.packageFolders.map(async (packageFolder: string) => {
				const filePath = path.join(packageFolder, 'package.json');
				const json = (await new FileDocument(filePath, {addBlankLine: true}).read()).content;
				const url = (json.repository) ? json.repository.url : '';
				return {
					filename: filePath, json, version: json.version, name: json.name, repoUrl: url, folder: packageFolder
				};
			})
		);
	}

	static packageInfoToPackageName(packageInfos: WorkspacePackageInfo[]) {
		return packageInfos.reduce((acc, packageInfo) => {
			acc.push(packageInfo.name);
			return acc;
		}, [] as string[]);
	}
}

