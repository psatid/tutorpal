import { bunPluginPino } from "bun-plugin-pino";

const result = await Bun.build({
	entrypoints: ["./src/index.ts"],
	format: "esm",
	outdir: "./dist",
	plugins: [bunPluginPino({ logging: "quiet", root: import.meta.dir })],
	target: "bun",
});

if (!result.success) {
	for (const log of result.logs) {
		console.error(log);
	}

	process.exit(1);
}
