import { Resend } from "resend";
import type { AppConfig } from "./app-config";
import { getLocalAppConfig } from "./local-config";

export interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	text: string;
}

export type EmailSender = (options: SendEmailOptions) => Promise<void>;

export function createResendEmailSender(
	config: Pick<AppConfig, "RESEND_API_KEY" | "RESEND_FROM_EMAIL">,
): EmailSender {
	const resend = new Resend(config.RESEND_API_KEY);

	return async ({ to, subject, html, text }) => {
		if (!config.RESEND_API_KEY) {
			throw new Error("RESEND_API_KEY is not configured");
		}

		const { error } = await resend.emails.send({
			from: config.RESEND_FROM_EMAIL,
			to: [to],
			subject,
			html,
			text,
		});

		if (error) {
			throw new Error(`Failed to send email with Resend: ${error.message}`);
		}
	};
}

export async function sendEmailWithResend(options: SendEmailOptions) {
	return createResendEmailSender(getLocalAppConfig())(options);
}
