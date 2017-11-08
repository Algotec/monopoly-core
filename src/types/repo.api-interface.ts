import {AsyncResult, Logger, SingleValueResult} from "./index";

export type repoList = { organization: string, repos: string[] }[];

export interface repoListResults extends AsyncResult {
	repoList?: repoList;
}

export interface RepoInterface {
	name: string;
	id: string;
	organization: string;
	url: string;
	defaultBranch: string;
}

export interface repoResult extends AsyncResult {
	repo?: RepoInterface;
}


export interface OpenPRResult extends AsyncResult {
	openedPR: {
		pullRequestId: number;
		url: string;
		[key: string]: any;
	}
}

export interface RepoApiInterface {
	list(logger: Logger, filter: { name?: string, organization?: string }): Promise<repoListResults>;

	getRepo(logger: Logger, filter: { name?: string, organization?: string }): Promise<repoResult>;

	openPR(logger: Logger, repoURL: string, sourceBranch: string, taregtBranch: string, title: string, description?: string): Promise<OpenPRResult>;
}


