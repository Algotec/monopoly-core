import * as fs from 'fs';
import * as path from "path";

export function fileExists(filename: string) {
	const cwd = process.cwd();
	try {
		fs.statSync(path.join(cwd, filename));
		return true;
	} catch {
		return false;
	}
}

export function isInMonopoly(): boolean {
	return fileExists('lerna.json');
}

export function isInGitFolder(folder: string): boolean {
	return fileExists(path.join(folder, '.git'));
}