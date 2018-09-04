# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

      # Monopoly
#### Mono repo in a poly repo world.


### CHANGE LOG
### [1.0.0-beta.7](http://git-srv.algotec.co.il:8080/tfs/DefaultCollection/web-common/_git/workspace-project/branches?baseVersion=GTv1.0.0-beta.6&targetVersion=GTv1.0.0-beta.7&_a=commits) (2018-07-31)
- update lerna to 3.2.1
### BREAKING CHANGES
- since lerna is a peer global dependency users need to manually update it via 
	`npm i -g lerna@3.2.1`
	 
### [1.0.0-beta.6](http://git-srv.algotec.co.il:8080/tfs/DefaultCollection/web-common/_git/workspace-project/branches?baseVersion=GTv1.0.0-beta.5&targetVersion=GTv1.0.0-beta.6&_a=commits) (2018-07-31)
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
