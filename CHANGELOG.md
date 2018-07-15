# Monopoly
#### Mono repo in a poly repo world.


### CHANGE LOG
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
