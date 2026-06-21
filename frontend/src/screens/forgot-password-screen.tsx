import { Link, Navigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { RHFInputField } from "@/components/ui/form/rhf";
import { APP_ROUTES } from "@/constants/routes";
import { useRequestPasswordReset } from "@/hooks/mutations/use-request-password-reset";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordScreen() {
	const { t } = useTranslation(["auth", "common"]);
	const [submittedEmail, setSubmittedEmail] = useState("");

	const forgotPasswordSchema = z.object({
		email: z.email(t("common:form.invalidEmail")),
	});

	type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

	const {
		control,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			email: "",
		},
	});

	const { data: session } = authClient.useSession();
	const { mutate: requestPasswordReset, isPending } = useRequestPasswordReset();

	if (session) {
		return <Navigate to={APP_ROUTES.HOME} />;
	}

	if (submittedEmail) {
		return (
			<AuthShell
				eyebrow={t("auth:brand.eyebrow")}
				title={t("auth:forgotPassword.successTitle")}
				subtitle={t("auth:forgotPassword.successBody", {
					email: submittedEmail,
				})}
				form={null}
				ctaArea={
					<Link
						to={APP_ROUTES.LOGIN}
						className={buttonVariants({
							className: "h-12 w-full",
						})}
					>
						{t("auth:forgotPassword.successCta")}
					</Link>
				}
			/>
		);
	}

	const onSubmit = ({ email }: ForgotPasswordFormData) => {
		requestPasswordReset(email, {
			onSuccess: () => {
				setSubmittedEmail(email);
			},
		});
	};

	return (
		<AuthShell
			eyebrow={t("auth:brand.eyebrow")}
			title={t("auth:forgotPassword.title")}
			subtitle={t("auth:forgotPassword.subtitle")}
			form={
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
					<RHFInputField
						control={control}
						name="email"
						label={t("common:form.email")}
						inputProps={{
							type: "email",
							placeholder: t("auth:forgotPassword.emailPlaceholder"),
							leftIcon: Mail,
						}}
					/>
					<button type="submit" className="hidden" aria-hidden />
				</form>
			}
			ctaArea={
				<Button
					type="button"
					onClick={handleSubmit(onSubmit)}
					loading={isSubmitting || isPending}
					className="h-12 w-full"
				>
					{t("auth:forgotPassword.submit")}
				</Button>
			}
			footer={
				<p className="flex flex-wrap items-center gap-1">
					<span>{t("auth:signup.alternatePrompt")}</span>
					<Link
						to={APP_ROUTES.LOGIN}
						className={buttonVariants({
							variant: "link",
							className: "h-auto p-0 font-semibold",
						})}
					>
						{t("auth:signup.alternateAction")}
					</Link>
				</p>
			}
		/>
	);
}
