import { ENV } from "./env";

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
): Promise<LineTokenResponse> {
	const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: ENV.LINE_LINK_REDIRECT_URL,
			client_id: ENV.LINE_LOGIN_CHANNEL_ID,
			client_secret: ENV.LINE_LOGIN_CHANNEL_SECRET,
		}),
	});

	if (!response.ok) {
		const text = await response.text();
		console.error("LINE token exchange failed:", text);
		throw new Error("Failed to exchange LINE authorization code");
	}

	return response.json();
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

	return response.json();
}

export function buildLineAuthUrl(state: string): string {
	const params = new URLSearchParams({
		response_type: "code",
		client_id: ENV.LINE_LOGIN_CHANNEL_ID,
		redirect_uri: ENV.LINE_LINK_REDIRECT_URL,
		state,
		scope: "profile",
	});

	return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

export async function sendLinePushMessage(
	lineUserId: string,
	messages: Array<{ type: string; text: string }>,
): Promise<void> {
	const response = await fetch("https://api.line.me/v2/bot/message/push", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${ENV.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN}`,
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
