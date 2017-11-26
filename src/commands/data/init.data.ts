export const gitIgnoreValue =
`node_modules
.idea
monopoly.log
`.trim();

export const packageJsonValue =
`
	{
        "devDependencies": {
                "lerna": "^2.5.1"
        }
}
	`.trim();

export const lernaJsonValue =
	`
	{
  "lerna": "2.5.1",
	"useGitVersion": true,
  "gitVersionPrefix": "v",
  "packages": [
  ],
  "version": "independent"
}

	`.trim();
