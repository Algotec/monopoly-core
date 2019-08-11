# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 1.2.1 (2019-08-11)


### Bug Fixes

* canary publish will fail ([761a9ae0c27c20980c02f1dbcb4aff89055ba517](https://github.com/Algotec/https://github.com/Algotec/monopoly-core/commit/761a9ae0c27c20980c02f1dbcb4aff89055ba517))

## [1.2.0](https://github.com/Algotec/monopoly-core/compare/v1.1.1...v1.2.0) (2019-08-10)


### Bug Fixes

* **commit:** fix commit change preset ([62b551a](https://github.com/Algotec/monopoly-core/commit/62b551a))
* bug in linking scoped modules where scope folder does not exist ([2ca6856](https://github.com/Algotec/monopoly-core/commit/2ca6856))
* changelog setup, needs @algotec/conventional-changelog-conventionalcommits ([864ba82](https://github.com/Algotec/monopoly-core/commit/864ba82))
* do not run npm version in publishDir if it doesn't exist ([34ed49d](https://github.com/Algotec/monopoly-core/commit/34ed49d))
* fix log formatting with new winston ([4fafa32](https://github.com/Algotec/monopoly-core/commit/4fafa32))


### Features

* integrate conventional-changelog-config-spec to allow proper changelog urls ([c94a552](https://github.com/Algotec/monopoly-core/commit/c94a552))
* publish command configuration options ([1dc9a42](https://github.com/Algotec/monopoly-core/commit/1dc9a42))

<a name="1.1.1"></a>
## [1.1.1](https://github.com/Algotec/monopoly-core/compare/v1.1.0...v1.1.1) (2019-05-13)


### Bug Fixes

* solve problems with publishing publishDir packages ([b4340f6](https://github.com/Algotec/monopoly-core/commit/b4340f6))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/Algotec/monopoly-core/compare/v1.0.4...v1.1.0) (2019-05-07)


### Bug Fixes

* better error messages when commands or connection fails ([8528243](https://github.com/Algotec/monopoly-core/commit/8528243))


### Features

* cleaned up version command ([c2c526d](https://github.com/Algotec/monopoly-core/commit/c2c526d))
* focus & restore commands ([5137551](https://github.com/Algotec/monopoly-core/commit/5137551))
* hoist migration command + hoisting links from link & install ([73f94d5](https://github.com/Algotec/monopoly-core/commit/73f94d5))
* partial error management for add/install with better error handling ([5851f22](https://github.com/Algotec/monopoly-core/commit/5851f22))


### Reverts

* hoisting will now remove all links to other hoisted packages in node_modules ([f9a9ff6](https://github.com/Algotec/monopoly-core/commit/f9a9ff6))



<a name="1.0.4"></a>
## [1.0.4](https://github.com/Algotec/monopoly-core/compare/v1.0.3...v1.0.4) (2019-02-14)


### Bug Fixes

* **publish:** do not check remote updates in canary ([f643234](https://github.com/Algotec/monopoly-core/commit/f643234))



<a name="1.0.3"></a>
## [1.0.3](https://github.com/Algotec/monopoly-core/compare/v1.0.2...v1.0.3) (2019-02-05)


### Bug Fixes

* blank lines in package.json were not kept ([60328ab](https://github.com/Algotec/monopoly-core/commit/60328ab))



<a name="1.0.2"></a>
## [1.0.2](https://github.com/Algotec/monopoly-core/compare/v1.0.0-beta.10...v1.0.2) (2019-01-03)


### Bug Fixes

* affected was returning wrong info for some packages ([40b5613](https://github.com/Algotec/monopoly-core/commit/40b5613))
* do not run git hooks in commit made for submodule add/remove ([5e0d55b](https://github.com/Algotec/monopoly-core/commit/5e0d55b))
* handle connection errors in list response ([4c9f1e6](https://github.com/Algotec/monopoly-core/commit/4c9f1e6))
* improve logging in fatarErrorHandler ([97247cb](https://github.com/Algotec/monopoly-core/commit/97247cb))
* move login/auth into CLI ([b7fae98](https://github.com/Algotec/monopoly-core/commit/b7fae98))
* node 10 compatability via check before install of async interator fix for node<10 ([624aaf3](https://github.com/Algotec/monopoly-core/commit/624aaf3))
* removal of initial login - Handler will create its own login if needed ([635e7b8](https://github.com/Algotec/monopoly-core/commit/635e7b8))



# Change Log
# Monopoly
#### Mono repo in a poly repo world.

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.
### [1.0.0](2018-12-08) - Imagine
- fix: handle connection errors in list response 
- fix: removal of initial login - Handler will create its own login if needed 
- fix: node 10 compatability via check before install of async interator fix for node<10 
- fix: affected was returning wrong info for some packages 
- fix: move login/auth into CLI 
- fix : version (status) command error handling 
- fix : change delimiter to be 2 spaces, and make FileDocument configurable for amnount of spaces when re-writing docs in parse mode 
- chore: add MIT license 
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
