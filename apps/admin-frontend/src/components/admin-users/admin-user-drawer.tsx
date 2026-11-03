import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon as XHugeIcon,
} from "@hugeicons/core-free-icons";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Drawer,
	DrawerBackdrop,
	DrawerClose,
	DrawerDescription,
	DrawerPopup,
	DrawerPortal,
	DrawerTitle,
	DrawerViewport,
} from "@tutorpal/ui/drawer";

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
	const popupRef = useRef<HTMLDivElement>(null);
	const [isDesktop, setIsDesktop] = useState(
		() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
	);

	useEffect(() => {
		const media = window.matchMedia("(min-width: 768px)");
		const update = () => setIsDesktop(media.matches);
		update();
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);

	return (
		<Drawer
			disablePointerDismissal={isPending}
			onOpenChange={(nextOpen) => {
				if (!isPending) onOpenChange(nextOpen);
			}}
			open={open}
			swipeDirection={isDesktop ? "right" : "down"}
		>
			<DrawerPortal>
				<DrawerBackdrop />
				<DrawerViewport>
					<DrawerPopup
						initialFocus={popupRef}
						ref={popupRef}
						showHandle={false}
						className="max-h-[min(86dvh,44rem)] md:w-[min(28rem,100vw)]"
					>
						<div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted md:hidden" />
						<header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 md:px-6 md:pt-6">
							<div className="min-w-0">
								<DrawerTitle className="text-xl font-normal tracking-[-0.02em] text-foreground md:text-2xl">
									{title}
								</DrawerTitle>
								<DrawerDescription className="mt-1 text-sm leading-6 text-muted-foreground">
									{description}
								</DrawerDescription>
							</div>
							<DrawerClose
								aria-label={t("accessibility.closeNamed", { title })}
								className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
								disabled={isPending}
							>
								<HugeiconsIcon icon={XHugeIcon} strokeWidth={2} aria-hidden="true" className="size-5" />
							</DrawerClose>
						</header>
						<div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
							{children}
						</div>
						<footer className="border-t border-border bg-popover px-5 py-4 md:px-6">
							{footer}
						</footer>
					</DrawerPopup>
				</DrawerViewport>
			</DrawerPortal>
		</Drawer>
	);
}
