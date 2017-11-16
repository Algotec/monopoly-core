import {AsyncResult, Logger} from "./index";

export interface TaskInfo extends AsyncResult {
	taskInfo: {
		id: string;
		title: string;
		description: string;
	}
}

export interface TasksManagementAPIInterface {
	setCredentials(username: string, password: string):void;
	getTaskInfo(logger: Logger, id: string): Promise<TaskInfo>;
}