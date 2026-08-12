import { type AppConfigInput, createAppConfig } from "./app-config";

export function getLocalAppConfig() {
	return createAppConfig(process.env as AppConfigInput);
}
