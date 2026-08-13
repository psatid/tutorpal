import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type AdminUserDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	isPending: boolean;
	children: ReactNode;
	footer: ReactNode;
};

export function AdminUserDrawer({
	open,
	onOpenChange,
	title,
	description,
	isPending,
	children,
	footer,
}: AdminUserDrawerProps) {
	const { t } = useTranslation("common");

	return (
		<Drawer.Root
			disablePointerDismissal={isPending}
			onOpenChange={(nextOpen) => {
				if (!isPending) onOpenChange(nextOpen);
			}}
			open={open}
			swipeDirection="down"
		>
			<Drawer.Portal>
				<Drawer.Backdrop
					className="fixed inset-0 z-50 bg-overlay-navy/45 duration-150 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0"
				/>
				<Drawer.Viewport className="fixed inset-0 z-60 flex items-end justify-center md:items-stretch md:justify-end">
					<Drawer.Popup
						className={cn(
							"fixed inset-x-0 bottom-0 flex max-h-[min(86dvh,44rem)] flex-col rounded-t-xl border border-border bg-popover text-popover-foreground shadow-transient-dialog outline-none duration-200 data-[swipe-direction=down]:data-closed:translate-y-full data-[swipe-direction=down]:data-open:animate-in md:inset-y-0 md:right-0 md:left-auto md:w-[min(28rem,100vw)] md:max-h-none md:rounded-none md:border-y-0 md:border-r-0",
						)}
					>
						<div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted md:hidden" />
						<header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 md:px-6 md:pt-6">
							<div className="min-w-0">
								<Drawer.Title className="text-xl font-normal tracking-[-0.02em] text-foreground md:text-2xl">
									{title}
								</Drawer.Title>
								<Drawer.Description className="mt-1 text-sm leading-6 text-muted-foreground">
									{description}
								</Drawer.Description>
							</div>
							<Drawer.Close
								aria-label={t("accessibility.closeNamed", { title })}
								className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
								disabled={isPending}
							>
								<X aria-hidden="true" className="size-5" />
							</Drawer.Close>
						</header>
						<div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
							{children}
						</div>
						<footer className="border-t border-border bg-popover px-5 py-4 md:px-6">
							{footer}
						</footer>
					</Drawer.Popup>
				</Drawer.Viewport>
			</Drawer.Portal>
		</Drawer.Root>
	);
}
