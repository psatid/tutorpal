import { Resend } from "resend";
import { ENV } from "./env";

interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	text: string;
}

const resend = new Resend(ENV.RESEND_API_KEY);

export async function sendEmailWithResend({
	to,
	subject,
	html,
	text,
}: SendEmailOptions) {
	if (!ENV.RESEND_API_KEY) {
		throw new Error("RESEND_API_KEY is not configured");
	}

	const { error } = await resend.emails.send({
		from: ENV.RESEND_FROM_EMAIL,
		to: [to],
		subject,
		html,
		text,
	});

	if (error) {
		throw new Error(`Failed to send email with Resend: ${error.message}`);
	}
}
