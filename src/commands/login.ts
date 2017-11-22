import {BaseCommand} from "./baseCommand";
import {Logger} from "../types";
import * as clortho from 'clortho';

export type Credentials = clortho.Credentials;
export const SERVICE_NAME = 'monopoly';
const loginPrompt = clortho.forService(SERVICE_NAME);
import * as username from 'username'
import {cliLogger} from "../lib/logger";

const usernameFromOS = username.sync().toLowerCase();

export class LoginCommand extends BaseCommand {
	loginCommandWorking: boolean = false;


	async getCredentials() {
		let credentials: Credentials = {username: '', password: ''};
		try {
			credentials = await loginPrompt.getFromKeychain(usernameFromOS);
		}
		catch (e) {
			this.debug('did not get credentials from OS');
		} finally {
			const {username, password} = credentials;
			if (username && password) {
				this.taskApi.setCredentials(username, password);
				this.repoApi.setCredentials(username, password);
			} else if (!this.loginCommandWorking) {
				cliLogger.warn('Not logged in to monopoly, please run login command');
			}
		}
	}


	async logOutHandler() {
		return await loginPrompt.removeFromKeychain(usernameFromOS);
	}

	getHandler() {
		return async (args: { [p: string]: any }, options: { [p: string]: any }, logger: Logger) => {
			this.loginCommandWorking = true;
			const credentials = await loginPrompt.prompt(usernameFromOS, 'Please login to Monopoly', true);
			const {username, password} = credentials;
			try {
				const sucess = await loginPrompt.saveToKeychain(username, password);
				if (!sucess) {
					throw new Error('no success saving to OS keychain');
				}
			} catch (e) {
				this.debug(e);
				this.warn('could not save credentials to OS keychain');
			}
		}
	}

}
