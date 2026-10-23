const productionConfigs = [
	"wrangler/prod/wrangler.api.prod.jsonc",
	"wrangler/prod/wrangler.reminders.prod.jsonc",
];
const placeholderPattern = /REPLACE_WITH_PRODUCTION_HYPERDRIVE_ID|\.invalid/;

const configsWithPlaceholders: string[] = [];

for (const relativePath of productionConfigs) {
	const configPath = `${import.meta.dir}/../${relativePath}`;
	const config = await Bun.file(configPath).text();

	if (placeholderPattern.test(config)) {
		configsWithPlaceholders.push(relativePath);
	}
}

if (configsWithPlaceholders.length > 0) {
	console.error(
		"Production deployment blocked: replace REPLACE_WITH_PRODUCTION_HYPERDRIVE_ID and .invalid placeholders in:",
	);
	for (const configPath of configsWithPlaceholders) {
		console.error(`- ${configPath}`);
	}
	process.exit(1);
}
