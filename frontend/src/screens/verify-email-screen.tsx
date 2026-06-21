import { AuthShell } from "@/components/auth/auth-shell";
import { buttonVariants } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants/routes";
import { Link, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

type VerifyEmailSearch = {
  email?: string;
  error?: string;
};

export function VerifyEmailScreen() {
  const { t } = useTranslation(["auth"]);
  const search = useSearch({ strict: false }) as VerifyEmailSearch;

  const hasError = !!search.error;
  const description = hasError
    ? t(`auth:verifyEmail.errors.${search.error}`, {
        defaultValue: t("auth:verifyEmail.errors.default"),
      })
    : t("auth:verifyEmail.subtitle");

  return (
    <AuthShell
      eyebrow={t("auth:brand.eyebrow")}
      title={
        hasError
          ? t("auth:verifyEmail.errorTitle")
          : t("auth:verifyEmail.title")
      }
      subtitle={description}
      form={null}
      ctaArea={
        <Link
          to={APP_ROUTES.LOGIN}
          className={buttonVariants({
            className: "h-12 w-full",
          })}
        >
          {t("auth:verifyEmail.cta")}
        </Link>
      }
    />
  );
}
