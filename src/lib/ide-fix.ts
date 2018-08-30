"use strict";
import * as fs from "fs";
import *as xml2js from "xml2js";

import * as  path from "path";

/**
 * This is a hack to force exclusion of linked dependencies.
 */

const exec = require('child_process').exec;
const builder = new xml2js.Builder();
const parser = new xml2js.Parser();
let filteredPkgs: any;

function prepare() {
	return new Promise((resolve) => {
		exec('lerna list --json', (err: any, stdout: any) => {
			const lernaOut = JSON.parse(stdout);
			filteredPkgs = lernaOut.reduce(function (ret: any, pkg: any) {
				ret[pkg.name] = pkg;
				return ret;
			}, {});
			resolve();
		});
	});
};

function addIfNotExists(arr: any[], name: string) {
	var url = `file://$MODULE_DIR$/${name}`;
	if (arr.find(function (obj) {
		return obj.$.url === url;
	})) {
		return false;
	}
	arr.push({
		$: {
			url: url
		}
	});
	return true;
}

function isIncludedPackage(name: string) {
	return filteredPkgs[name];
}

function addExcludesToWorkspace(idea: any, done: (...args: any[]) => void) {
	fs.readFile(idea, function (err, data) {
		if (err) return done(err);
		const links = buildLinks();
		let add = false;
		parser.parseString(data, function (err: Error, result: any) {
			if (err) return done(err);
			try {
				//uses this to pass in the array to muck.
				const excludeFolders = result.module.component[0].content[0].excludeFolder;
				Object.keys(links).forEach(function (key) {
					const deps = links[key];
					addIfNotExists(excludeFolders, `${key}/lib`);
					Object.keys(deps).forEach(function (depKey) {
						(add as any) |= (addIfNotExists(excludeFolders, `${key}/node_modules/${deps[depKey]}`)as any);

					})
				});
				if (add) return done(null, builder.buildObject(result));
				return done();
			} catch (e) {
				return done(e);
			}
		});
	});
}

function exit(e: Error, o: any) {
	if (e) {
		console.trace(e);
	} else {
		console.log(o);
	}
	process.exit(0);
}

function findWorkspaceIml(done: Function) {
	var moduleFile = path.join(process.cwd(), '.idea', 'modules.xml')
	if (fs.existsSync(moduleFile)) {
		fs.readFile(moduleFile, 'utf8', function (err, content) {
			if (err) return done(err);
			parser.parseString(content, function (err: Function, result: any) {
				if (err) return done(err);
				try {
					done(null, result.project.component[0].modules[0].module[0].$.filepath.replace('$PROJECT_DIR$', process.cwd()));
				} catch (e) {
					done(e);
				}
			});
		});
	} else {
		done();
	}
}

function copyFile(source: string, target: string, cb: Function) {
	var cbCalled = false;

	var rd = fs.createReadStream(source);
	rd.on("error", function (err) {
		done(err);
	});
	var wr = fs.createWriteStream(target);
	wr.on("error", function (err) {
		done(err);
	});
	wr.on("close", function (err?) {
		done();
	});
	rd.pipe(wr);

	function done(err?: Error) {
		if (!cbCalled) {
			cb(err);
			cbCalled = true;
		}
	}
}


function updateIntellij(done: Function) {
	return function updateIntellij$internal(err: Error, filename: string) {
		if (err || !filename) return done();
		if (fs.existsSync(filename)) {
			var backupFile = filename + '.' + Date.now()
			addExcludesToWorkspace(filename, function (err, content) {
				if (content) {
					console.log(`Backing up ${filename} into ${backupFile}`);
					copyFile(filename, backupFile, function (err?: Error) {
						if (err) return done(err);
						fs.writeFile(filename, content, 'utf8', function (err) {
							if (err) return done(err);
							done(null, `Updated file ignores in workspace`);
						});
					});
				} else {
					done(null, `No changes made.`);
				}
			});
		} else {
			return done(new Error(`file does not exist ${filename}`));
		}
	}
}

function relative(name: string) {
	return path.relative(process.cwd(), name);
}

function buildLinks(): { [key: string]: any } {
	var LINKS: { [key: string]: any } = {};

	function link(from: string, dep: any, linkTo: string) {
		from = relative(from);
		linkTo = relative(linkTo);
		if (!LINKS[from]) {
			LINKS[from] = {};
			(LINKS[from][dep] = linkTo);
			return true;

		} else if (LINKS[from][dep]) {
			return false;
		}
		LINKS[from][dep] = linkTo;
		return true;
	}

	function filterLink(obj: object) {
		if (!obj) return [];
		return Object.keys(obj).map(isIncludedPackage).filter(Boolean);
	}

	function linkDepedencies(pkg: any, deps: any) {
		filterLink(deps).forEach(function (toPkg) {
			if (toPkg == pkg) {
				return;
			}
			if (link(pkg._location, toPkg.name, toPkg._location)) {
				linkDepedencies(pkg, toPkg.dependencies);
				linkDepedencies(pkg, toPkg.devDependencies);
				linkDepedencies(pkg, toPkg.peerDependencies);
			}
		});
	}

	function linkAll(key: string) {
		const pkg = filteredPkgs[key];
		linkDepedencies(pkg, pkg.dependencies);
		linkDepedencies(pkg, pkg.devDependencies);
		linkDepedencies(pkg, pkg.peerDependencies);

	}

	Object.keys(filteredPkgs).forEach(linkAll);
	return LINKS
}


module.exports = {
	exit,
	buildLinks
};
if (require.main === module) {
	prepare().then(() => {
		findWorkspaceIml(updateIntellij(exit));
	});
}


