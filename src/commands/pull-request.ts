import {asyncCommandFn, BaseCommand, execResult} from "./baseCommand";
import {ActionCallback, Logger, RepoApiInterface, TasksManagementAPIInterface} from "../types";
import {LernaUtil} from "../lib/lerna-util";
import {isInMonopoly} from "../lib/fs";

export interface PRArgs {
	taskId: string
}

const updated = require('lerna/lib/commands/UpdatedCommand');
export type lernaUpdatedType = { name: string, version: string, private: boolean }[];

export class PullRequestCommand extends BaseCommand {
	getHandler(): ActionCallback {
		return async (args: PRArgs, options: { [p: string]: any }, logger: Logger) => {
			isInMonopoly();
			this.spinner.info('fetching issue from Jira').start();
			try {
				this.debug(args.taskId);
				const issue = await this.taskApi.getTaskInfo(logger, args.taskId);
				if (issue.status == 'OK' && issue.taskInfo) {
					this.debug(JSON.stringify(issue));
					// const lernaUpdated = await updated.handler({"--loglevel=warn"});
					const lernaUpdated = `lerna updated --json --loglevel=warn`;
					const updatedStatus = await this.exec(lernaUpdated);
					const updatedPackagesString: string = updatedStatus.stdout;
					const updatedPackages: lernaUpdatedType = JSON.parse(updatedPackagesString);
					const updatedPackagesNames = updatedPackages.map((pack) => pack.name);
					this.debug(JSON.stringify(updatedPackagesNames));
					const lernaUtil = (await new LernaUtil().parse('lerna.json'));
					const packageInfos = await lernaUtil.packageInfo();
					await Promise.all(packageInfos.map(async (pack) => {
							if (updatedPackagesNames.indexOf(pack.name) !== -1) {
								this.spinner.info(`opening PR for ${pack.name}`).start();
								this.debug(pack.repoUrl);
								let branch: string;
								try {
									branch = (await this.exec('git rev-parse --abbrev-ref HEAD', {cwd: pack.folder})).stdout.trim();
								}
								catch (e) {
									this.debug(e);
									this.spinner.fail('unable to create PR or get source branch from git');
									throw e;
								}
								this.debug('branch:' + branch);
								const PRTitle = `${issue.taskInfo.id} - ${issue.taskInfo.title}`;
								try {
									const openPR = await this.repoApi.openPR(logger, pack.repoUrl, branch, 'develop', PRTitle, issue.taskInfo.description);
									this.debug(JSON.stringify(openPR));
									if (openPR.status == 'OK') {
										this.spinner.succeed(`opend PR for ${pack.name} - ${openPR.openedPR.pullRequestId} ${openPR.openedPR.url}`);
									}
									else {
										throw new Error('unable to open a new PR for ' + pack.name);
									}
								} catch (e) {
									this.spinner.fail(e.message);
								}
							}
						}
					)).catch(e => {
						this.error('pull Request failed ', e);
					});
				}
			} catch (e) {
				this.error(e.message);
				this.debug(e);
				this.spinner.fail('failed to get issue from JIRA or open PR');
			}
			finally {
				this.spinner.stop();
			}
		}
	}

}
