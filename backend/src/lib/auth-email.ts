import { type EmailSender, sendEmailWithResend } from "./resend";

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export async function sendVerificationEmail(
	{
		email,
		name,
		verificationUrl,
	}: {
		email: string;
		name: string;
		verificationUrl: string;
	},
	sendEmail: EmailSender = sendEmailWithResend,
) {
	const safeName = escapeHtml(name || "there");
	const safeUrl = escapeHtml(verificationUrl);
	const subject = "Confirm your TutorPal account";
	const text = [
		`Hi ${name || "there"},`,
		"",
		"Welcome to TutorPal. Please confirm your email address to finish setting up your account.",
		"",
		verificationUrl,
		"",
		"If you did not create this account, you can safely ignore this email.",
	].join("\n");

	const html = `
		<div style="background:#fcf8ff;padding:32px 16px;font-family:Manrope,Arial,sans-serif;color:#1b1b24;">
			<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2dff0;border-radius:24px;padding:32px;">
				<div style="margin-bottom:24px;">
					<div style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f6f2ff;color:#6c63ff;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
						TutorPal
					</div>
				</div>
				<h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;font-weight:800;color:#1b1b24;">
					Confirm your email
				</h1>
				<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#464555;">
					Hi ${safeName}, welcome to TutorPal. Confirm your email address to finish setting up your account.
				</p>
				<div style="margin:24px 0 28px;">
					<a href="${safeUrl}" style="display:inline-block;background:#6c63ff;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700;">
						Confirm email
					</a>
				</div>
				<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#464555;">
					If the button does not work, copy and paste this link into your browser:
				</p>
				<p style="margin:0 0 16px;font-size:14px;line-height:1.6;word-break:break-all;color:#6c63ff;">
					${safeUrl}
				</p>
				<p style="margin:0;font-size:14px;line-height:1.6;color:#777587;">
					If you did not create this account, you can safely ignore this email.
				</p>
			</div>
		</div>
	`;

	await sendEmail({
		to: email,
		subject,
		html,
		text,
	});
}

export async function sendResetPasswordEmail(
	{
		email,
		name,
		resetUrl,
	}: {
		email: string;
		name: string;
		resetUrl: string;
	},
	sendEmail: EmailSender = sendEmailWithResend,
) {
	const safeName = escapeHtml(name || "there");
	const safeUrl = escapeHtml(resetUrl);
	const subject = "Reset your TutorPal password";
	const text = [
		`Hi ${name || "there"},`,
		"",
		"We received a request to reset your TutorPal password.",
		"This link will expire in 1 hour.",
		"",
		resetUrl,
		"",
		"If you did not request a password reset, you can safely ignore this email.",
	].join("\n");

	const html = `
		<div style="background:#fcf8ff;padding:32px 16px;font-family:Manrope,Arial,sans-serif;color:#1b1b24;">
			<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2dff0;border-radius:24px;padding:32px;">
				<div style="margin-bottom:24px;">
					<div style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f6f2ff;color:#6c63ff;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
						TutorPal
					</div>
				</div>
				<h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;font-weight:800;color:#1b1b24;">
					Reset your password
				</h1>
				<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#464555;">
					Hi ${safeName}, we received a request to reset your TutorPal password.
				</p>
				<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#464555;">
					This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
				</p>
				<div style="margin:24px 0 28px;">
					<a href="${safeUrl}" style="display:inline-block;background:#6c63ff;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700;">
						Reset password
					</a>
				</div>
				<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#464555;">
					If the button does not work, copy and paste this link into your browser:
				</p>
				<p style="margin:0 0 16px;font-size:14px;line-height:1.6;word-break:break-all;color:#6c63ff;">
					${safeUrl}
				</p>
				<p style="margin:0;font-size:14px;line-height:1.6;color:#777587;">
					If you did not request a password reset, no further action is needed.
				</p>
			</div>
		</div>
	`;

	await sendEmail({
		to: email,
		subject,
		html,
		text,
	});
}
