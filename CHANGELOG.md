# Change Log
# Monopoly
#### Mono repo in a poly repo world.

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

### [1.0.0-beta.10] (2018-09-27)
	- split from algotec workspace-project repo, change name to @monopoly/core 
### [1.0.0-beta.9] (2018-09-27)
	- changelog urls 
### [1.0.0-beta.8] (2018-09-04)
	- fixes to file document
### [1.0.0-beta.7] (2018-09-04)
- update lerna to 3.2.1
### BREAKING CHANGES
- since lerna is a peer global dependency users need to manually update it via 
	`npm i -g lerna@3.2.1`
	 
### [1.0.0-beta.6] (2018-07-31)
- update vso-node-api

### [1.0.0-beta.1]
* link command white and black list options
### [1.0.0-beta.0]

* add affected command
* expose cli for external commands
* add publish command
* refactor list and merge list-deps into it, extract branch listing to branch-ls command
* filter out repos with no deps found in case of list --deps
* do login first and error if not successful 
* big internal refactor
* lots still to do (including proper changelog!)

### [0.0.15] 
	* add command can now accept any git valid absolute URL 
### [0.0.14]
	* add activate/deactivate commands
	* add alias for most commands (see help)
	* add execGenerator to baseCommand, add global asyncIterator polyfill
	* add execError, no longer stringifying errors
