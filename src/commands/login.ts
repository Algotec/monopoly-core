import {BaseCommand} from "./baseCommand";
import {Logger} from "../types";
import * as clortho from 'clortho';
import {SERVICE_NAME} from "../index";
const loginPrompt = clortho.forService(SERVICE_NAME);

export class LoginCommand extends BaseCommand {
	getHandler(user:string) {
		return async (args: { [p: string]: any }, options: { [p: string]: any }, logger: Logger) => {
			const credentials = await loginPrompt.prompt(user,'Please login to Monopoly');
			const {username, password} = credentials;
			loginPrompt.saveToKeychain(username,password);

		}
	}

}
