import {BaseCommand} from "./baseCommand";
import {Logger, WorkspacePackageInfo} from "../types";
import * as path from "path";
import {LernaUtil} from "../lib/lerna-util";
import * as cli from 'caporal';
import {FileDocument} from "../lib/fileDocument";

export interface linkArguments {
	packages?: string[];
}

export interface linkOptions {
	forceLocal?: boolean;
	b: string; //blacklist comma separated string
}


export class LinkCommand extends BaseCommand {
	getHandler() {
		return async (args: linkArguments, options: linkOptions, logger: Logger) => {
			let restorePJSONVersionMap: Map<WorkspacePackageInfo, string> = new Map();
			try {
				this.debug(`${this.constructor.name} handler args: ${JSON.stringify(args)}, options :${JSON.stringify(options)}`);
				let lerna = await (new LernaUtil().parse(path.join(process.cwd(), 'lerna.json')));

				let packageInfos = await lerna.packageInfo();
				if (options && options.b || (args && args.packages && args.packages.length)) {
					const originalPackages = [...packageInfos];
					const blackList = options.b.split(',');
					if (blackList && blackList.length) {
						packageInfos = packageInfos.filter(packageInfo => blackList.indexOf(packageInfo.name) === -1 && blackList.indexOf(packageInfo.folder) === -1);
					}
					if (Array.isArray(args.packages) && args.packages.length) {
						const pakagesWhitelist = args.packages;
						packageInfos = packageInfos.filter(packageInfo => pakagesWhitelist.indexOf(packageInfo.name) !== -1 || pakagesWhitelist.indexOf(packageInfo.folder) !== -1);
					}
					const packagesNotIncluded = originalPackages.filter(packageInfo => !packageInfos.find(pinfo => pinfo.name === packageInfo.name));
					if (packagesNotIncluded.length) {
						packagesNotIncluded.forEach(async packageInfo => {
							const pJsonPath = packageInfo.filename;
							const pJson = await new FileDocument(pJsonPath,{addBlankLine:true}).read();
							restorePJSONVersionMap.set(packageInfo, pJson.content.version);
							pJson.content.version = `0.0.0-temp.${pJson.content.version}`;
							await pJson.write();
						});
					}
					this.debug('packages not included :' + JSON.stringify(LernaUtil.packageInfoToPackageName(packagesNotIncluded), null, 2));
				}
				const packageNames = LernaUtil.packageInfoToPackageName(packageInfos);
				this.debug('packages included :' + JSON.stringify(packageNames, null, 2));
				this.spinner.info(`Cross-Linking packages ${packageNames.join(',')}`).start();
				const cmd = `lerna link ${(options.forceLocal) ? '--force-local' : ''}`;
				await this.exec(cmd);

				this.spinner.succeed('link completed')
			}
			catch
				(e) {
				this.debug(e);
				this.spinner.fail(JSON.stringify(e));
				this.error(e.message);
			}
			finally {
				if (restorePJSONVersionMap.size) {
					restorePJSONVersionMap.forEach(async (oldVersion, packageInfo: WorkspacePackageInfo) => {
						const pJsonPath = packageInfo.filename;
						try {
							const pJson = await new FileDocument(pJsonPath,{addBlankLine:true}).read();
							pJson.content.version = oldVersion;
							await pJson.write();
						} catch (e) {
							this.debug(e);
							this.warn('could not restore package.json for package ' + packageInfo.name)
						}
					});
				}
			}
		}
	}
}

const
	linkCommand = new LinkCommand();
cli.command('link', 'link repos dependencies inside the workspace')
	.alias('l')
	.argument('[packages...]', 'whitelist  - link only within these packages')
	.option('--b <blacklist>', 'blacklist - comma separated of packages NOT to link', undefined, '')
	.option('--install'
		, 'also run npm install')
	.option('--force-local', 'force link ignoring different versions - does not work with black/white listing')
	.action(linkCommand.getHandler() as any)
;
