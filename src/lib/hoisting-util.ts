import {LernaUtil} from "./lerna-util";
import {WorkspacePackageInfo} from "../types";
import * as path from "path";
import * as fs from 'fs';
import {promisify} from 'util';
import {consoleLogger} from "./logger";

const symlink = promisify(fs.symlink);

function isPublicPackage(packageInfo: WorkspacePackageInfo) {
	consoleLogger.debug(`package ${packageInfo.name} is private : ${packageInfo.json.private}`);
	if (packageInfo.json.private) {
		return false;
	} else if (!packageInfo.json.main) {
		return false;
	}
	return true;
}

export class HoistingUtil {
	async makeHoistingLinks(lerna: LernaUtil) {
		const packagesNotToHoist = lerna.noHoist;
		const packagesInfo = await lerna.packageInfo();
		const packagesToHoist: Array<{ name: string, folder: string }> = packagesInfo
			.filter((packageInfo: WorkspacePackageInfo) => {
				return (packagesNotToHoist.indexOf(packageInfo.name) == -1) && isPublicPackage(packageInfo)
			})
			.map((packageInfo: WorkspacePackageInfo) => {
				return {name: packageInfo.name, folder: packageInfo.folder}
			});
		await Promise.all(packagesToHoist.map((pkg) => {
			//Make a link to the package in the hoisted node modules
			const packageInstallPath = path.join('node_modules', pkg.name);
			if (fs.existsSync(packageInstallPath)) {
				fs.unlinkSync(packageInstallPath);
			}
			if (pkg.name.includes('/')) {
				const scope = pkg.name.slice(0, pkg.name.indexOf('/'));
				if (fs.existsSync(scope) == null) {
					fs.mkdirSync(path.join('node_modules', scope));
				}
			}
			return symlink(pkg.folder, packageInstallPath, "dir");
			//Remove all links to other hoisted packages in node_modules
			// const nodeModulesDir = path.join(pkg.folder, 'node_modules');
			// packagesToHoist.forEach((otherPkg) => {
			// 	const otherPkgInNodeModules = path.join(nodeModulesDir, otherPkg.name);
			// 	if (fs.existsSync(otherPkgInNodeModules)) {
			// 		if (fs.lstatSync(otherPkgInNodeModules).isSymbolicLink()) {
			// 			fs.unlinkSync(otherPkgInNodeModules);
			// 		}
			// 	}
			// });
		}));
	}
}
