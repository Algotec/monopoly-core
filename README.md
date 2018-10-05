# Monopoly 
## @monopoly/core  
#### Mono Repo of Poly Repos workflow tool 


~~ Documentation development is in initial stages ~~
## Introduction
This packages allows for creation of CLI tools that help with workflow related to using multiple related repos in a setup similar to a monorepo without loosing the separation of history,ownership, CI processes etc.

In [Algotec](http://algotec.co.il) Monopoly is used with a front end wrapper that connects to the internal TFS/Git server since November 2017.

Now in October 2018 we decided to open-source the tool and extracted the @monopoly/core part to this public repo.

A github oriented CLI wrapper will soon follow suit (@monopoly/gh-cli)


## Technical details

Monopoly exposes a function [makeCLI](https://github.com/Algotec/monopoly-core/blob/9f8fd356e31178fa594cfe2ea01d0f47a224cd36/src/index.ts#L27) which takes a repoAPI implementation which needs to implement the [RepoApiInterface](https://github.com/Algotec/monopoly-core/blob/9f8fd356e31178fa594cfe2ea01d0f47a224cd36/src/types/repo.api-interface.ts#L57)
 