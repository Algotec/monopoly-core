import {IPackageInfo} from "./index";
import {IRepoSearchOpts} from "../commands/list";
import {AsyncAPIResult, Logger} from "./general-cli.types";

export {IRepoSearchOpts} from "../commands/list";

export interface repoInfo extends IPackageInfo {
	name: string,
	project: string,
}

export type repoList = { organization: string, repos: repoInfo[] }[];

export interface RepoListResults extends AsyncAPIResult {
	repoList?: repoList;
}

export enum dependencyTypes {
	deps = 'deps',
	devDeps = 'devDeps',
	peerDeps = 'peerDeps'
};

export interface DependenciesSearchResult extends AsyncAPIResult {
	depsList?: repoInfo
}

export interface BranchListSearchResult extends AsyncAPIResult {
	branchList?: string[];
}

export interface RepoInterface {
	name: string;
	id?: string;
	organization?: string;
	url: string;
	defaultBranch?: string;
}

export interface repoResult extends AsyncAPIResult {
	repo?: RepoInterface;
}


export interface OpenPRResult extends AsyncAPIResult {
	openedPR: {
		pullRequestId: number;
		url: string;
		[key: string]: any;
	}
}
export interface AffectedResult extends AsyncAPIResult {
	affected?:boolean;
}

export type PackageDesc = [string, string] // packageName,version
export interface RepoApiInterface {
	setCredentials(username: string, password: string): void;

	connect(): Promise<boolean>

	list(logger: Logger, filter: { name?: string, organization?: string }, branch: string | undefined, dependencies?: string | boolean): Promise<RepoListResults>;

	listBranches(logger: Logger, project: string, repoName: string, filter?: string): Promise<BranchListSearchResult>;

	listDependencies(logger: Logger, project: string, repoName: string, branch?: string, dependenciesFilter?: string): Promise<DependenciesSearchResult>;

	getRepo(logger: Logger, filter: { name?: string, organization?: string }): Promise<repoResult>;

	openPR?(logger: Logger, repoURL: string, sourceBranch: string, taregtBranch: string, title: string, description?: string): Promise<OpenPRResult>;

	affectedByPackage?(logger: Logger, packageDesc: PackageDesc, project: string, repoName: string, branch?: string): Promise<AffectedResult>
}


