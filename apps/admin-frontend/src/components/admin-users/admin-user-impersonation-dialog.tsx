import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon as AlertTriangleHugeIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/types/admin-user";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogOverlay,
	DialogPopup,
	DialogPortal,
	DialogTitle,
	DialogViewport,
} from "@tutorpal/ui/dialog";

type AdminUserImpersonationDialogProps = {
	user: AdminUser | null;
	isPending: boolean;
	isError: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

export function AdminUserImpersonationDialog({
	user,
	isPending,
	isError,
	onOpenChange,
	onConfirm,
}: AdminUserImpersonationDialogProps) {
	const { t } = useTranslation("admin");
	const primaryActionLabel = isPending
		? t("users.impersonation.opening")
		: isError
			? t("users.impersonation.retry")
			: t("users.impersonation.confirm");

	return (
		<Dialog
			disablePointerDismissal={isPending}
			onOpenChange={(open) => {
				if (!isPending) onOpenChange(open);
			}}
			open={user !== null}
		>
			<DialogPortal>
				<DialogOverlay className="z-70" />
				<DialogViewport className="z-80 p-4 sm:p-6">
					<DialogPopup
						aria-busy={isPending}
						className="w-full max-w-md rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-transient-dialog outline-none"
					>
						<div className="flex size-11 items-center justify-center rounded-full bg-warning-container text-warning">
							<HugeiconsIcon icon={AlertTriangleHugeIcon} strokeWidth={2} aria-hidden="true" className="size-5" />
						</div>
						<DialogTitle className="mt-5 text-lg font-semibold text-foreground">
							{t("users.impersonation.title")}
						</DialogTitle>
						<DialogDescription className="mt-2 break-words text-sm leading-6 text-muted-foreground">
							{t("users.impersonation.description", { name: user?.name })}
						</DialogDescription>
						<p className="mt-3 text-sm leading-6 text-muted-foreground">
							{t("users.impersonation.sameTabWarning")}
						</p>
						<p aria-live="polite" className="sr-only" role="status">
							{isPending ? t("users.impersonation.openingStatus") : null}
						</p>
						{isError ? (
							<div
								className="mt-4 rounded-lg border border-warning/30 bg-warning-container p-3"
								role="alert"
							>
								<p className="text-sm text-warning-container-foreground">
									{t("users.impersonation.error")}
								</p>
							</div>
						) : null}
						<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<DialogClose
								disabled={isPending}
								render={
									<Button disabled={isPending} type="button" variant="outline" />
								}
							>
								{t("users.actions.cancel")}
							</DialogClose>
							<Button loading={isPending} onClick={onConfirm} type="button">
								{primaryActionLabel}
							</Button>
						</div>
					</DialogPopup>
				</DialogViewport>
			</DialogPortal>
		</Dialog>
	);
}
