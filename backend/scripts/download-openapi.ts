import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { ENV } from "../src/lib/env";

interface ServiceConfig {
	name: string;
	port: number;
	endpoint: string;
	outputFile: string;
	envPortVar: string;
}

const services: ServiceConfig[] = [
	{
		name: "main",
		port: 3000,
		endpoint: "/v1/docs/open-api",
		outputFile: "openapi/openapi.json",
		envPortVar: "PORT",
	},
];

const timeoutMs = 5000;
const baseUrl = `http://localhost:${ENV.PORT}`;

interface DownloadResult {
	service: string;
	success: boolean;
	url?: string;
	outputFile?: string;
	error?: string;
}

async function downloadOpenApi(
	service: ServiceConfig,
): Promise<DownloadResult> {
	const port = Number(process.env[service.envPortVar] ?? service.port);
	const url = baseUrl
		? `${baseUrl.replace(/\/$/, "")}${service.endpoint}`
		: `http://localhost:${port}${service.endpoint}`;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch(url, {
			headers: {
				accept: "application/json",
			},
			signal: controller.signal,
		});

		clearTimeout(timeout);

		if (!res.ok) {
			return {
				service: service.name,
				success: false,
				url,
				error: `HTTP ${res.status} ${res.statusText}`,
			};
		}

		const text = await res.text();

		// Ensure output directory exists
		const outputDir = dirname(service.outputFile);
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true });
		}

		await Bun.write(
			service.outputFile,
			text.endsWith("\n") ? text : `${text}\n`,
		);

		return {
			service: service.name,
			success: true,
			url,
			outputFile: service.outputFile,
		};
	} catch (error) {
		clearTimeout(timeout);
		const errorMessage = error instanceof Error ? error.message : String(error);
		return {
			service: service.name,
			success: false,
			url,
			error: errorMessage,
		};
	}
}

async function main() {
	console.log("Downloading OpenAPI specs from services...\n");

	const results = await Promise.all(services.map(downloadOpenApi));

	const successful = results.filter((r) => r.success);
	const failed = results.filter((r) => !r.success);

	// Print successful downloads
	if (successful.length > 0) {
		console.log("✅ Successfully updated:");
		for (const result of successful) {
			console.log(`   ${result.service}: ${result.outputFile}`);
			console.log(`      └─ from ${result.url}`);
		}
		console.log();
	}

	// Print failed downloads
	if (failed.length > 0) {
		console.log("⚠️  Skipped (service not running or unreachable):");
		for (const result of failed) {
			console.log(`   ${result.service}: ${result.error}`);
			if (result.url) {
				console.log(`      └─ tried ${result.url}`);
			}
		}
		console.log();
	}

	// Summary
	console.log(
		`Summary: ${successful.length} updated, ${failed.length} skipped (out of ${results.length} services)`,
	);

	// Exit with success code even if some services failed
	process.exit(0);
}

main().catch((error) => {
	console.error("Unexpected error:", error);
	process.exit(1);
});
