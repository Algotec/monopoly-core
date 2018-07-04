import {asyncCommandFn, BaseCommand, execResult} from "./baseCommand";
import {Logger} from "../types";
import * as cli from 'caporal';
import * as path from "path";

export class GeneralCommand extends BaseCommand {
	getHandler() {
		return (args: { [p: string]: any }, options: { [p: string]: any }, logger: Logger) => void {}
	}

	async exec(cmd: string | string[]): Promise<execResult> {
		this.spinner.start();
		let ret: execResult = {code: 1, stderr: '', stdout: ''};
		try {
			ret = await super.exec(cmd);
			this.info(ret.stdout);
		} catch (e) {
			ret.stderr = e.message;
			this.error(e);
		} finally {
			this.spinner.stop();
		}
		return ret as execResult;

	}
}
const generalCommand = new GeneralCommand();

cli.command('ide-fix', 'fix intellij ide (webstorm etc) constant indexing when working with symlinks')
	.action(() => {
		const cmdpath = path.join(__dirname, 'lib', 'ide-fix.js');
		generalCommand.debug(cmdpath);
		generalCommand.exec(`node "${cmdpath}"`);
	});
