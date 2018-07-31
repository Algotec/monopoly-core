export const gitIgnoreValue =
	`node_modules
.idea
monopoly.log
`.trim();

const lernaVersion = "2.5.1";

export function getPackageJsonValue() {
	return JSON.stringify({
		"devDependencies": {
			"lerna": lernaVersion
		}
	}, null, 2);
}

export function getLernaJsonValue(hoist: boolean) {
	const lernaBaseConfig: any = {
		"lerna": lernaVersion,
		"useGitVersion": true,
		"gitVersionPrefix": "v",
		"packages": [],
		"version": "independent"
	};
	if (hoist) {
		lernaBaseConfig.hoist = true;
	}
	return JSON.stringify(lernaBaseConfig, null, 4);

}
