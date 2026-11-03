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
					<DialogPopup className="w-full max-w-md rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-transient-dialog outline-none">
						<div className="flex size-11 items-center justify-center rounded-full bg-warning-container text-warning">
							<HugeiconsIcon icon={AlertTriangleHugeIcon} strokeWidth={2} aria-hidden="true" className="size-5" />
						</div>
						<DialogTitle className="mt-5 text-lg font-semibold text-foreground">
							{title}
						</DialogTitle>
						<DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
							{isDeactivate
								? t("users.confirmDeactivate.description", { name: user?.name })
								: t("users.confirmReactivate.description", { name: user?.name })}
						</DialogDescription>
						<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<DialogClose
								disabled={isPending}
								render={
									<Button disabled={isPending} type="button" variant="outline" />
								}
							>
								{t("users.actions.cancel")}
							</DialogClose>
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
					</DialogPopup>
				</DialogViewport>
			</DialogPortal>
		</Dialog>
	);
}
