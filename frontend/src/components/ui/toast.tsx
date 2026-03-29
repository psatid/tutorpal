import { toast } from "sonner";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastOptions {
  title: string;
  description?: string;
}

const toastStyles = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-900",
    descColor: "text-emerald-700",
    closeColor: "text-emerald-400 hover:text-emerald-600",
    Icon: CheckCircle,
  },
  error: {
    bg: "bg-rose-50",
    border: "border-rose-100",
    iconColor: "text-rose-600",
    titleColor: "text-rose-900",
    descColor: "text-rose-700",
    closeColor: "text-rose-400 hover:text-rose-600",
    Icon: XCircle,
  },
  info: {
    bg: "bg-toast-info-bg",
    border: "border-toast-info-border",
    iconColor: "text-toast-info-icon",
    titleColor: "text-toast-info-title",
    descColor: "text-on-surface-variant",
    closeColor: "text-toast-info-close hover:text-primary",
    Icon: Info,
  },
};

function createToast(variant: keyof typeof toastStyles, options: ToastOptions) {
  const styles = toastStyles[variant];
  const { Icon } = styles;

  return toast.custom(
    (t) => (
      <div
        className={cn(
          "p-4 rounded-xl flex items-center gap-3 shadow-sm min-w-[320px]",
          styles.bg,
          styles.border,
          !!options.description && "items-start"
        )}
      >
        <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", styles.iconColor)} />
        <div className="flex-1 gap-1.5">
          <h5
            className={cn(
              "font-headline text-sm font-bold leading-none",
              styles.titleColor
            )}
          >
            {options.title}
          </h5>
          {options.description && (
            <p className={cn("text-xs leading-relaxed", styles.descColor)}>
              {options.description}
            </p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t)}
          className={cn("transition-colors shrink-0", styles.closeColor)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ),
    {
      duration: 3000,
    }
  );
}

export const showToast = {
  success: (title: string, description?: string) =>
    createToast("success", { title, description }),
  error: (title: string, description?: string) =>
    createToast("error", { title, description }),
  info: (title: string, description?: string) =>
    createToast("info", { title, description }),
};
