import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { InputField, type InputFieldProps } from "./input-field";

type PasswordFieldProps = Omit<InputFieldProps, "type" | "rightAdornment">;

function PasswordField({ disabled, ...props }: PasswordFieldProps) {
  const { t } = useTranslation("common");
  const [isVisible, setIsVisible] = useState(false);

  const toggleLabel = isVisible
    ? t("form.hidePassword")
    : t("form.showPassword");
  const ToggleIcon = isVisible ? EyeOff : Eye;

  return (
    <InputField
      {...props}
      disabled={disabled}
      type={isVisible ? "text" : "password"}
      rightAdornment={
        <button
          type="button"
          onClick={() => setIsVisible((previous) => !previous)}
          aria-label={toggleLabel}
          title={toggleLabel}
          disabled={disabled}
          className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50"
        >
          <ToggleIcon className="size-4" />
        </button>
      }
    />
  );
}

export { PasswordField };
