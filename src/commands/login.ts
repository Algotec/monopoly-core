import {BaseCommand} from "./baseCommand";
import {Logger, RepoApiInterface, TasksManagementAPIInterface} from "../types";
import * as inquirer from "inquirer";
import * as keytar from 'keytar';
import {SERVICE_NAME} from "../index";

export class LoginCommand extends BaseCommand {
	getHandler(repoApi: RepoApiInterface, tasksApi: TasksManagementAPIInterface) {
		return async (args: { [p: string]: any }, options: { [p: string]: any }, logger: Logger) => {
			const answers = await inquirer.prompt([
				{type: 'input', name: 'username', message: 'please enter your domain username'},
				{type: 'password', name: 'password', message: 'please enter your domain password'}]);

			const {username, password} = answers;
			keytar.setPassword(SERVICE_NAME, username, password);
			//this.debug(`setting username and password : ${username} : ${[password]}`);
		}
	}

}

export default new LoginCommand();