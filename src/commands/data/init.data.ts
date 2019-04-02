export const gitIgnoreValue =
	`node_modules
.idea
monopoly.log
`.trim();

export const lernaVersion = "3.2.1";

export function getPackageJsonValue() {
	return JSON.stringify({
		"devDependencies": {
			"lerna": lernaVersion
		}
	}, null, 2);
}

export function getLernaJsonValue(hoist: boolean,noHoist:string[] = []) {
	const lernaBaseConfig: any = {
		"lerna": lernaVersion,
		"useGitVersion": true,
		"gitVersionPrefix": "v",
		"packages": [],
		"version": "independent"
	};
	if (hoist) {
		lernaBaseConfig.nohoist = noHoist;
		lernaBaseConfig.hoist = true;
	}
	return JSON.stringify(lernaBaseConfig, null, 4);

}
