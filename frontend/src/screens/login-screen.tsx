import { Link, Navigate, useSearch } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Mail, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { RHFInputField, RHFPasswordField } from "@/components/ui/form/rhf";
import { APP_ROUTES } from "@/constants/routes";
import { useLogin } from "@/hooks/mutations/use-login";
import { authClient } from "@/lib/auth-client";
import { usePublicConfig } from "@/lib/public-config";

type LoginSearch = {
	error?: string;
};

type SocialProvider = "google" | "line";

function GoogleMark() {
	return (
		<svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
			<path
				fill="#4285F4"
				d="M21.35 12.23c0-.72-.06-1.25-.2-1.8H12v3.42h5.37c-.11.85-.72 2.13-2.08 2.99l-.02.11 3.02 2.34.21.02c1.92-1.77 2.85-4.38 2.85-7.08Z"
			/>
			<path
				fill="#34A853"
				d="M12 21.73c2.63 0 4.84-.87 6.45-2.38l-3.07-2.47c-.82.57-1.92.97-3.38.97-2.58 0-4.77-1.7-5.55-4.05l-.1.01-3.14 2.43-.03.1A9.74 9.74 0 0 0 12 21.73Z"
			/>
			<path
				fill="#FBBC05"
				d="M6.45 13.8A5.92 5.92 0 0 1 6.14 12c0-.62.11-1.22.3-1.8v-.12L3.27 7.62l-.1.05A9.72 9.72 0 0 0 2.1 12c0 1.56.37 3.03 1.07 4.33l3.28-2.53Z"
			/>
			<path
				fill="#EA4335"
				d="M12 6.15c1.84 0 3.08.8 3.79 1.47l2.77-2.7C16.83 3.3 14.63 2.27 12 2.27a9.74 9.74 0 0 0-8.82 5.4l3.27 2.53C7.23 7.85 9.42 6.15 12 6.15Z"
			/>
		</svg>
	);
}

function LineMark() {
	return (
		<svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
			<path
				fill="#06C755"
				d="M20.65 10.93c0-4.12-4.13-7.47-9.2-7.47s-9.2 3.35-9.2 7.47c0 3.69 3.28 6.78 7.71 7.37.3.06.7.18.8.41.09.21.06.54.03.75l-.13.71c-.04.21-.2.82.8.45s5.4-3.18 7.37-5.44c1.37-1.5 1.87-3.02 1.87-4.25Z"
			/>
			<path fill="white" d="M7.59 8.87h1.04v3.29h1.77v.88H7.59V8.87Zm3.43 0h1.04v4.17h-1.04V8.87Zm1.87 0h1.04l1.77 2.4v-2.4h1.04v4.17h-1.04l-1.77-2.4v2.4h-1.04V8.87Zm4.7 0h2.81v.88h-1.77v.73h1.77v.88h-1.77v.8h1.77v.88h-2.81V8.87Z" />
		</svg>
	);
}

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
			eyebrow={t("auth:brand.eyebrow")}
			title={t("auth:login.title")}
			subtitle={t("auth:login.subtitle")}
			form={
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
					{hasSocialError ? (
						<div
							className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
							role="alert"
						>
							<AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
							<p>{t("auth:login.socialError")}</p>
						</div>
					) : null}
					<RHFInputField
						control={control}
						name="email"
						label={t("common:form.email")}
						inputProps={{
							type: "email",
							placeholder: t("auth:login.emailPlaceholder"),
							leftIcon: Mail,
						}}
					/>

					<RHFPasswordField
						control={control}
						name="password"
						label={t("common:form.password")}
						inputProps={{
							placeholder: t("auth:login.passwordPlaceholder"),
							leftIcon: Lock,
						}}
					/>
					<div className="flex justify-end">
						<Link
							to={APP_ROUTES.FORGOT_PASSWORD}
							className={buttonVariants({
								variant: "link",
								className: "h-auto p-0 text-sm font-semibold",
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
					<p className="text-sm leading-6 text-muted-foreground">
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
						<div className="space-y-3 pt-2">
							<div className="flex items-center gap-3 text-xs text-muted-foreground">
								<div className="h-px flex-1 bg-border" />
								<span>{t("auth:login.socialDivider")}</span>
								<div className="h-px flex-1 bg-border" />
							</div>
							<div className="space-y-3">
								<p aria-live="polite" className="sr-only" role="status">
									{socialLoginLoadingLabel}
								</p>
								{socialLogin.google ? (
									<Button
										aria-busy={socialProvider === "google"}
										type="button"
										variant="outline"
										className="h-12 w-full"
										disabled={socialProvider !== null}
										loading={socialProvider === "google"}
										onClick={() => void startSocialLogin("google")}
									>
										<GoogleMark />
										{t("auth:login.continueWithGoogle")}
									</Button>
								) : null}
								{socialLogin.line ? (
									<Button
										aria-busy={socialProvider === "line"}
										type="button"
										variant="outline"
										className="h-12 w-full"
										disabled={socialProvider !== null}
										loading={socialProvider === "line"}
										onClick={() => void startSocialLogin("line")}
									>
										<LineMark />
										{t("auth:login.continueWithLine")}
									</Button>
								) : null}
							</div>
						</div>
					) : null}
				</>
			}
			footer={
				publicSignupEnabled ? (
					<p className="flex flex-wrap items-center gap-1">
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
