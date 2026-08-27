import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/types/admin-user";

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
		<Dialog.Root
			disablePointerDismissal={isPending}
			onOpenChange={(open) => {
				if (!isPending) onOpenChange(open);
			}}
			open={user !== null}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-70 bg-overlay-navy/45 duration-150 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />
				<Dialog.Viewport className="fixed inset-0 z-80 flex items-center justify-center p-4 sm:p-6">
					<Dialog.Popup
						aria-busy={isPending}
						className="w-full max-w-md rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-transient-dialog outline-none duration-150 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
					>
						<div className="flex size-11 items-center justify-center rounded-full bg-warning-container text-warning">
							<AlertTriangle aria-hidden="true" className="size-5" />
						</div>
						<Dialog.Title className="mt-5 text-lg font-semibold text-foreground">
							{t("users.impersonation.title")}
						</Dialog.Title>
						<Dialog.Description className="mt-2 break-words text-sm leading-6 text-muted-foreground">
							{t("users.impersonation.description", { name: user?.name })}
						</Dialog.Description>
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
							<Dialog.Close
								disabled={isPending}
								render={
									<Button disabled={isPending} type="button" variant="outline" />
								}
							>
								{t("users.actions.cancel")}
							</Dialog.Close>
							<Button loading={isPending} onClick={onConfirm} type="button">
								{primaryActionLabel}
							</Button>
						</div>
					</Dialog.Popup>
				</Dialog.Viewport>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
