import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/types/admin-user";

type AdminUserStatusDialogProps = {
	user: AdminUser | null;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

export function AdminUserStatusDialog({
	user,
	isPending,
	onOpenChange,
	onConfirm,
}: AdminUserStatusDialogProps) {
	const { t } = useTranslation("admin");
	const isDeactivate = user?.status === "active";
	const title = isDeactivate
		? t("users.confirmDeactivate.title")
		: t("users.confirmReactivate.title");

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
					<Dialog.Popup className="w-full max-w-md rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-transient-dialog outline-none duration-150 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
						<div className="flex size-11 items-center justify-center rounded-full bg-warning-container text-warning">
							<AlertTriangle aria-hidden="true" className="size-5" />
						</div>
						<Dialog.Title className="mt-5 text-lg font-semibold text-foreground">
							{title}
						</Dialog.Title>
						<Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
							{isDeactivate
								? t("users.confirmDeactivate.description", { name: user?.name })
								: t("users.confirmReactivate.description", { name: user?.name })}
						</Dialog.Description>
						<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Dialog.Close
								disabled={isPending}
								render={
									<Button disabled={isPending} type="button" variant="outline" />
								}
							>
								{t("users.actions.cancel")}
							</Dialog.Close>
							<Button
								loading={isPending}
								onClick={onConfirm}
								type="button"
								variant={isDeactivate ? "destructive" : "default"}
							>
								{isDeactivate
									? t("users.actions.deactivate")
									: t("users.actions.reactivate")}
							</Button>
						</div>
					</Dialog.Popup>
				</Dialog.Viewport>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
