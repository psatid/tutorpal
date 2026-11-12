import { Link, Navigate, useSearch } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	AlertCircleIcon as AlertCircleHugeIcon,
	Mail01Icon as MailHugeIcon,
	LockPasswordIcon as LockHugeIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleMark, LineMark } from "@/components/auth/provider-marks";
import { Button, buttonVariants } from "@tutorpal/ui/button";
import { RHFInputField, RHFPasswordField } from "@tutorpal/ui/form/rhf";
import { APP_ROUTES } from "@/constants/routes";
import { useLogin } from "@/hooks/mutations/use-login";
import { authClient } from "@/lib/auth-client";
import { usePublicConfig } from "@/lib/public-config";

type LoginSearch = {
	error?: string;
};

type SocialProvider = "google" | "line";

export function LoginScreen() {
	const { t } = useTranslation(["auth", "common"]);
	const search = useSearch({ strict: false }) as LoginSearch;
	const [socialProvider, setSocialProvider] = useState<SocialProvider | null>(
		null,
	);
	const [hasSocialError, setHasSocialError] = useState(Boolean(search.error));

	useEffect(() => {
		if (!search.error) {
			return;
		}

		setHasSocialError(true);
		const url = new URL(window.location.href);
		url.searchParams.delete("error");
		window.history.replaceState({}, "", url);
	}, [search.error]);

	const loginSchema = z.object({
		email: z.email(t("common:form.invalidEmail")),
		password: z.string().min(1, t("common:form.required")),
	});

	type LoginFormData = z.infer<typeof loginSchema>;

	const {
		control,
		handleSubmit,
		formState: { isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const { data: session } = authClient.useSession();
	const {
		isError: isPublicConfigError,
		isFetching: isPublicConfigFetching,
		publicSignupEnabled,
		socialLogin,
		refetch: refetchPublicConfig,
	} = usePublicConfig();
	const { mutate: login, isPending: isLoginPending } = useLogin({
		onError: (error) => {
			if (error.code === "EMAIL_NOT_VERIFIED") {
				toast.error(t("auth:login.unverified"));
				return;
			}

			toast.error(t("auth:login.invalid"));
		},
	});

	if (session) {
		return <Navigate to={APP_ROUTES.HOME} />;
	}

	const onSubmit = (data: LoginFormData) => {
		login(data);
	};

	const startSocialLogin = async (provider: SocialProvider) => {
		setSocialProvider(provider);
		setHasSocialError(false);

		try {
			const origin = window.location.origin;
			const result = await authClient.signIn.social({
				provider,
				callbackURL: new URL("/", origin).toString(),
				errorCallbackURL: new URL("/login", origin).toString(),
			});

			if (result.error) {
				setSocialProvider(null);
				setHasSocialError(true);
			}
		} catch {
			setSocialProvider(null);
			setHasSocialError(true);
		}
	};

	const hasEnabledSocialLogin = socialLogin.google || socialLogin.line;
	const socialLoginLoadingLabel =
		socialProvider === "google"
			? t("auth:login.redirectingToGoogle")
			: socialProvider === "line"
				? t("auth:login.redirectingToLine")
				: null;

	return (
		<AuthShell
			title={t("auth:login.title")}
			subtitle={t("auth:login.subtitle")}
			form={
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
					{hasSocialError ? (
						<div
							className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
							role="alert"
						>
							<HugeiconsIcon
								icon={AlertCircleHugeIcon}
								strokeWidth={2}
								className="mt-0.5 size-4 shrink-0"
								aria-hidden="true"
							/>
							<p>{t("auth:login.socialError")}</p>
						</div>
					) : null}
					{isPublicConfigError ? (
						<div
							className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
							role="alert"
						>
							<p>{t("auth:login.socialConfigError")}</p>
							<Button
								type="button"
								variant="link"
								loading={isPublicConfigFetching}
								onClick={() => void refetchPublicConfig()}
							>
								{t("auth:login.retryAvailability")}
							</Button>
						</div>
					) : null}
					{hasEnabledSocialLogin ? (
						<div className="space-y-3">
							<p aria-live="polite" className="sr-only" role="status">
								{socialLoginLoadingLabel}
							</p>
							<div className="flex gap-3 sm:flex-col">
								{socialLogin.google ? (
									<Button
										aria-busy={socialProvider === "google"}
										type="button"
										variant="outline"
										className="h-12 flex-1 sm:min-h-12 sm:flex-none sm:w-full"
										disabled={socialProvider !== null}
										loading={socialProvider === "google"}
										onClick={() => void startSocialLogin("google")}
									>
										<GoogleMark />
										<span className="sm:hidden">Google</span>
										<span className="hidden sm:inline">
											{t("auth:login.continueWithGoogle")}
										</span>
									</Button>
								) : null}
								{socialLogin.line ? (
									<Button
										aria-busy={socialProvider === "line"}
										type="button"
										variant="outline"
										className="h-12 flex-1 sm:min-h-12 sm:flex-none sm:w-full"
										disabled={socialProvider !== null}
										loading={socialProvider === "line"}
										onClick={() => void startSocialLogin("line")}
									>
										<LineMark />
										<span className="sm:hidden">LINE</span>
										<span className="hidden sm:inline">
											{t("auth:login.continueWithLine")}
										</span>
									</Button>
								) : null}
							</div>
							<div className="flex items-center gap-3 text-xs text-muted-foreground">
								<div className="h-px flex-1 bg-border" />
								<span>{t("auth:login.socialDivider")}</span>
								<div className="h-px flex-1 bg-border" />
							</div>
						</div>
					) : null}
					<RHFInputField
						control={control}
						name="email"
						label={t("common:form.email")}
						inputProps={{
							type: "email",
							autoComplete: "email",
							placeholder: t("auth:login.emailPlaceholder"),
							leftIcon: MailHugeIcon,
						}}
					/>

					<div className="relative">
						<RHFPasswordField
							control={control}
							name="password"
							label={t("common:form.password")}
							inputProps={{
								id: "login-password",
								autoComplete: "current-password",
								placeholder: t("auth:login.passwordPlaceholder"),
								leftIcon: LockHugeIcon,
							}}
						/>
						<Link
							to={APP_ROUTES.FORGOT_PASSWORD}
							className={buttonVariants({
								variant: "link",
								className:
									"absolute right-0 top-0 h-auto p-0 text-sm font-semibold",
							})}
						>
							{t("auth:login.forgotPassword")}
						</Link>
					</div>
					<button type="submit" className="hidden" aria-hidden />
				</form>
			}
			ctaArea={
				<>
					<p className="text-sm leading-6 text-muted-foreground sm:hidden">
						{t("auth:legal")}
					</p>
					<Button
						type="button"
						onClick={handleSubmit(onSubmit)}
						loading={isSubmitting || isLoginPending}
						className="h-12 w-full"
					>
						{t("auth:login.submit")}
					</Button>
				</>
			}
			footer={
				publicSignupEnabled ? (
					<p className="flex flex-wrap items-center justify-center gap-1 text-center">
						<span>{t("auth:login.alternatePrompt")}</span>
						<Link
							to={APP_ROUTES.SIGNUP}
							className={buttonVariants({
								variant: "link",
								className: "h-auto p-0 font-semibold",
							})}
						>
							{t("auth:login.alternateAction")}
						</Link>
					</p>
				) : null
			}
		/>
	);
}
