import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@tutorpal/ui/button";
import { RHFInputField } from "@tutorpal/ui/form/rhf";
import { APP_ROUTES } from "@/constants/routes";
import { Link, useRouterState, useSearch } from "@tanstack/react-router";
import type { TFunction } from "i18next";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/auth/auth-shell";
import { useSendVerificationEmail } from "@/hooks/mutations/use-send-verification-email";
import { z } from "zod";

type VerifyEmailSearch = {
  error?: string;
};

type VerifyEmailNavigationState = {
  email?: string;
  verificationNeeded?: boolean;
};

const RESEND_FORM_ID = "resend-verification-email-form";

function createResendVerificationSchema(t: TFunction) {
  return z.object({
    email: z.email(t("common:form.invalidEmail")),
  });
}

type ResendFormData = z.infer<
  ReturnType<typeof createResendVerificationSchema>
>;

export function VerifyEmailScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const search = useSearch({ strict: false }) as VerifyEmailSearch;
  const navigationState = useRouterState({
    select: (state) => state.location.state as VerifyEmailNavigationState,
  });
  const { mutate: resendVerification, isPending: isResendingVerification } =
    useSendVerificationEmail();
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">(
    "idle",
  );
  const { control, handleSubmit } = useForm<ResendFormData>({
    resolver: zodResolver(createResendVerificationSchema(t)),
    defaultValues: { email: navigationState.email ?? "" },
  });

  const hasError = Boolean(search.error);
  const verificationNeeded =
    navigationState.verificationNeeded === true ||
    search.error === "EMAIL_NOT_VERIFIED";
  const shouldOfferResend = verificationNeeded;
  const description = verificationNeeded
    ? t("auth:verifyEmail.verificationNeededSubtitle")
    : hasError
    ? t(`auth:verifyEmail.errors.${search.error}`, {
        defaultValue: t("auth:verifyEmail.errors.default"),
      })
    : t("auth:verifyEmail.subtitle");
  const title = verificationNeeded
    ? t("auth:verifyEmail.verificationNeededTitle")
    : hasError
      ? t("auth:verifyEmail.errorTitle")
      : t("auth:verifyEmail.title");

  const submitResend = ({ email }: ResendFormData) => {
    resendVerification(email, {
      onSuccess: () => setResendStatus("sent"),
      onError: () => setResendStatus("error"),
    });
  };

  return (
    <AuthShell
      title={title}
      subtitle={description}
      form={
        shouldOfferResend ? (
          <form
            id={RESEND_FORM_ID}
            onSubmit={handleSubmit(submitResend)}
            className="space-y-4"
          >
            <RHFInputField
              control={control}
              name="email"
              label={t("common:form.email")}
              inputProps={{
                autoComplete: "email",
                placeholder: t("auth:verifyEmail.emailPlaceholder"),
                type: "email",
              }}
            />
            {resendStatus === "sent" ? (
              <p
                aria-live="polite"
                className="text-sm leading-6 text-muted-foreground"
                role="status"
              >
                {t("auth:verifyEmail.resendStatus")}
              </p>
            ) : null}
            {resendStatus === "error" ? (
              <p className="text-sm leading-6 text-destructive" role="alert">
                {t("auth:verifyEmail.resendError")}
              </p>
            ) : null}
          </form>
        ) : null
      }
      footerText={t("auth:footer.copyright")}
      ctaArea={
        <>
          {shouldOfferResend ? (
            <Button
              form={RESEND_FORM_ID}
              type="submit"
              className="h-12 w-full"
              loading={isResendingVerification}
            >
              {t("auth:verifyEmail.resend")}
            </Button>
          ) : null}
          <Link
            to={APP_ROUTES.LOGIN}
            className={buttonVariants({
              className: "h-12 w-full",
              variant: shouldOfferResend ? "outline" : "default",
            })}
          >
            {t("auth:verifyEmail.cta")}
          </Link>
        </>
      }
    />
  );
}
