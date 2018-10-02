import {BaseCommand} from "./baseCommand";
import {Logger} from "../types/general-cli.types";
import * as clortho from 'clortho';
import * as cli from 'caporal';

export type Credentials = clortho.Credentials;
export const SERVICE_NAME = 'monopoly';
const loginPrompt = clortho.forService(SERVICE_NAME);
import * as username from 'username'
import {cliLogger} from "../lib/logger";

const usernameFromOS = process.env.AMP_USER ? process.env.AMP_USER as string : username.sync().toLowerCase();

export class LoginCommand extends BaseCommand {
	loginCommandWorking: boolean = false;


	async getCredentials() {
		let credentials: Credentials = {username: '', password: ''};
		try {
			if (process.env.AMP_USER && process.env.AMP_PASSWORD) {
				credentials = {username: process.env.AMP_USER as string, password: process.env.AMP_PASSWORD as string};
				console.warn('Using environment credentials!')
			} else {
				credentials = await loginPrompt.getFromKeychain(usernameFromOS);
			}
		}
		catch (e) {
			this.debug('did not get credentials from OS');
		} finally {
			credentials.password = Buffer.from(credentials.password, 'base64').toString('utf8');
			const {username, password} = credentials;
			if (username && password) {
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
			credentials.password = Buffer.from(credentials.password, 'utf8').toString('base64');
			const {username, password} = credentials;
			try {
				const success = await loginPrompt.saveToKeychain(username, password);
				if (!success) {
					throw new Error('could not save credentials to OS keychain');
				}
			} catch (e) {
				this.debug(e);
				this.warn(e.message);
			}
		}
	}
}

const loginCommand = new LoginCommand();

export async function doLogin() {
	await loginCommand.getCredentials();

	return await loginCommand.repoApi.connect();
}

cli.command('login', 'stores username and password for repo access').action(loginCommand.getHandler());
cli.command('logout', 'removes username and password storage').action(loginCommand.logOutHandler);
