import {AsyncResult, Logger, SingleValueResult} from "./index";
import {IRepoSearchOpts} from "../commands/list";
import {Hash} from "../lib/general";

export {IRepoSearchOpts} from "../commands/list";

export interface DepInfo {
	[key: string]: string;
}

export interface IPackageInfo {
	packageName?: string,
	deps?: DepInfo
	devDeps?: DepInfo
	peerDeps?: DepInfo
}

export interface repoInfo extends IPackageInfo {
	name: string,
	project: string,
}

export type repoList = { organization: string, repos: repoInfo[] }[];

export interface RepoListResults extends AsyncResult {
	repoList?: repoList;
}

export enum dependencyTypes {
	deps = 'deps',
	devDeps = 'devDeps',
	peerDeps = 'peerDeps'
};

export interface DependenciesSearchResult extends AsyncResult {
	depsList?: repoInfo
}

export interface BranchListSearchResult extends AsyncResult {
	branchList?: string[];
}

export interface RepoInterface {
	name: string;
	id?: string;
	organization?: string;
	url: string;
	defaultBranch?: string;
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
	setCredentials(username: string, password: string): void;

	connect():Promise<boolean>

	list(logger: Logger, filter: { name?: string, organization?: string }, branch: string | undefined, dependencies?: string | boolean): Promise<RepoListResults>;

	listBranches(logger: Logger, project: string, repoName: string, filter?: string): Promise<BranchListSearchResult>;

	listDependencies(logger: Logger, project: string, repoName: string, branch?: string, dependenciesFilter?: string): Promise<DependenciesSearchResult>;

	getRepo(logger: Logger, filter: { name?: string, organization?: string }): Promise<repoResult>;

	openPR(logger: Logger, repoURL: string, sourceBranch: string, taregtBranch: string, title: string, description?: string): Promise<OpenPRResult>;
}


