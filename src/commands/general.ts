import {asyncCommandFn, BaseCommand, execResult} from "./baseCommand";
import {Logger} from "../types";


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

export default new GeneralCommand();