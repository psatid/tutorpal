import { Link, useSearch } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { RHFPasswordField } from "@/components/ui/form/rhf";
import { APP_ROUTES } from "@/constants/routes";
import { useResetPassword } from "@/hooks/mutations/use-reset-password";
import { AuthFlowError } from "@/hooks/mutations/use-signup";

type ResetPasswordSearch = {
	token?: string;
	error?: string;
};

export function ResetPasswordScreen() {
	const { t } = useTranslation(["auth", "common"]);
	const search = useSearch({ strict: false }) as ResetPasswordSearch;
	const [tokenBecameInvalid, setTokenBecameInvalid] = useState(false);

	const resetPasswordSchema = useMemo(
		() =>
			z
				.object({
					newPassword: z
						.string()
						.min(8, t("auth:resetPassword.passwordTooShort")),
					confirmPassword: z
						.string()
						.min(8, t("auth:resetPassword.passwordTooShort")),
				})
				.refine((data) => data.newPassword === data.confirmPassword, {
					path: ["confirmPassword"],
					message: t("auth:resetPassword.passwordMismatch"),
				}),
		[t],
	);

	type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

	const {
		control,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<ResetPasswordFormData>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			newPassword: "",
			confirmPassword: "",
		},
	});

	const { mutate: resetPassword, isPending } = useResetPassword();

	const onSubmit = ({ newPassword }: ResetPasswordFormData) => {
		if (!search.token) {
			setTokenBecameInvalid(true);
			return;
		}

		resetPassword(
			{
				token: search.token,
				newPassword,
			},
			{
				onError: (error) => {
					const authError = error as AuthFlowError;
					if (authError.code === "INVALID_TOKEN") {
						setTokenBecameInvalid(true);
						return;
					}

					toast.error(authError.message || t("auth:resetPassword.invalidBody"));
				},
			},
		);
	};

	if (search.error || !search.token || tokenBecameInvalid) {
		return (
			<AuthShell
				eyebrow={t("auth:brand.eyebrow")}
				title={t("auth:resetPassword.invalidTitle")}
				subtitle={t("auth:resetPassword.invalidBody")}
				form={null}
				ctaArea={
					<Link
						to={APP_ROUTES.FORGOT_PASSWORD}
						className={buttonVariants({
							className: "h-12 w-full",
						})}
					>
						{t("auth:resetPassword.invalidCta")}
					</Link>
				}
				footer={
					<Link
						to={APP_ROUTES.LOGIN}
						className={buttonVariants({
							variant: "link",
							className: "h-auto p-0 font-semibold",
						})}
					>
						{t("auth:resetPassword.backToLogin")}
					</Link>
				}
			/>
		);
	}

	return (
		<AuthShell
			eyebrow={t("auth:brand.eyebrow")}
			title={t("auth:resetPassword.title")}
			subtitle={t("auth:resetPassword.subtitle")}
			form={
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
					<RHFPasswordField
						control={control}
						name="newPassword"
						label={t("common:form.password")}
						inputProps={{
							placeholder: t("auth:resetPassword.passwordPlaceholder"),
							leftIcon: Lock,
						}}
					/>
					<RHFPasswordField
						control={control}
						name="confirmPassword"
						label={t("auth:resetPassword.confirmLabel")}
						inputProps={{
							placeholder: t("auth:resetPassword.confirmPlaceholder"),
							leftIcon: Lock,
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
					{t("auth:resetPassword.submit")}
				</Button>
			}
		/>
	);
}
