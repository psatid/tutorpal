import { ENV } from "./env";

export interface LineLoginCredentials {
	channelId: string;
	channelSecret: string;
}

export interface LineBotInfo {
	userId: string;
	basicId: string;
	premiumId?: string;
	displayName: string;
}

interface LineTokenResponse {
	access_token: string;
	token_type: string;
	refresh_token: string;
	expires_in: number;
	scope: string;
	id_token: string;
}

interface LineProfileResponse {
	userId: string;
	displayName: string;
	pictureUrl?: string;
	statusMessage?: string;
}

export async function exchangeCodeForToken(
	code: string,
	credentials: LineLoginCredentials,
): Promise<LineTokenResponse> {
	const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: ENV.LINE_LINK_REDIRECT_URL,
			client_id: credentials.channelId,
			client_secret: credentials.channelSecret,
		}),
	});

	if (!response.ok) {
		const text = await response.text();
		console.error("LINE token exchange failed:", text);
		throw new Error("Failed to exchange LINE authorization code");
	}

	return response.json() as Promise<LineTokenResponse>;
}

export async function getLineProfile(
	accessToken: string,
): Promise<LineProfileResponse> {
	const response = await fetch("https://api.line.me/v2/profile", {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (!response.ok) {
		const text = await response.text();
		console.error("LINE profile fetch failed:", text);
		throw new Error("Failed to fetch LINE profile");
	}

	return response.json() as Promise<LineProfileResponse>;
}

export function buildLineAuthUrl(state: string, channelId: string): string {
	const params = new URLSearchParams({
		response_type: "code",
		client_id: channelId,
		redirect_uri: ENV.LINE_LINK_REDIRECT_URL,
		state,
		scope: "profile",
		bot_prompt: "aggressive",
	});

	return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

export async function sendLinePushMessage(
	lineUserId: string,
	messages: Array<{ type: string; text: string }>,
	channelAccessToken: string,
): Promise<void> {
	const response = await fetch("https://api.line.me/v2/bot/message/push", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${channelAccessToken}`,
		},
		body: JSON.stringify({
			to: lineUserId,
			messages,
		}),
	});

	if (!response.ok) {
		const text = await response.text();
		console.error("LINE push message failed:", text);
		throw new Error("Failed to send LINE push message");
	}
}

export async function getLineBotInfo(
	channelAccessToken: string,
): Promise<LineBotInfo> {
	const response = await fetch("https://api.line.me/v2/bot/info", {
		headers: { Authorization: `Bearer ${channelAccessToken}` },
	});
	if (!response.ok) {
		throw new Error("Failed to verify LINE Messaging API credentials");
	}
	return response.json() as Promise<LineBotInfo>;
}

export async function validateLineRecipient(
	lineUserId: string,
	channelAccessToken: string,
): Promise<void> {
	const response = await fetch(
		`https://api.line.me/v2/bot/profile/${encodeURIComponent(lineUserId)}`,
		{ headers: { Authorization: `Bearer ${channelAccessToken}` } },
	);
	if (!response.ok) {
		throw new Error(
			"The LINE account has not added this Official Account as a friend",
		);
	}
}
