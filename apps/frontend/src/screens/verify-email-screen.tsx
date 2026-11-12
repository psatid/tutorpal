import { AuthShell } from "@/components/auth/auth-shell";
import { Button, buttonVariants } from "@tutorpal/ui/button";
import { APP_ROUTES } from "@/constants/routes";
import { Link, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSendVerificationEmail } from "@/hooks/mutations/use-send-verification-email";
import { z } from "zod";

type VerifyEmailSearch = {
  email?: string;
  error?: string;
};

export function VerifyEmailScreen() {
  const { t } = useTranslation(["auth"]);
  const search = useSearch({ strict: false }) as VerifyEmailSearch;
  const { mutate: resendVerification, isPending: isResendingVerification } =
    useSendVerificationEmail();

  const hasError = !!search.error;
  const canResend =
    hasError && z.string().email().safeParse(search.email).success;
  const description = hasError
    ? t(`auth:verifyEmail.errors.${search.error}`, {
        defaultValue: t("auth:verifyEmail.errors.default"),
      })
    : t("auth:verifyEmail.subtitle");

  return (
    <AuthShell
      title={
        hasError
          ? t("auth:verifyEmail.errorTitle")
          : t("auth:verifyEmail.title")
      }
      subtitle={description}
      form={null}
      footerText={t("auth:footer.copyright")}
      ctaArea={
        <>
          <Link
            to={APP_ROUTES.LOGIN}
            className={buttonVariants({ className: "h-12 w-full" })}
          >
            {t("auth:verifyEmail.cta")}
          </Link>
          {canResend ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full"
              loading={isResendingVerification}
              onClick={() =>
                resendVerification(search.email!, {
                  onSuccess: () =>
                    toast.success(t("auth:verifyEmail.resendSuccess")),
                  onError: () => toast.error(t("auth:verifyEmail.resendError")),
                })
              }
            >
              {t("auth:verifyEmail.resend")}
            </Button>
          ) : null}
        </>
      }
    />
  );
}
