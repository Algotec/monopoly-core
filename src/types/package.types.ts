
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