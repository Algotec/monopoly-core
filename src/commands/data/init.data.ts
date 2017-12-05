export const gitIgnoreValue =
	`node_modules
.idea
monopoly.log
`.trim();

const lernaVersion = "2.5.1";
export const packageJsonValue =
	`
	{
        "devDependencies": {
                "lerna": "${lernaVersion}"
        }
}
	`.trim();

export const lernaJsonValue =
	`
	{
  "lerna":"${lernaVersion}",
	"useGitVersion": true,
  "gitVersionPrefix": "v",
  "packages": [
  ],
  "version": "independent"
}

	`.trim();
