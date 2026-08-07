import type { Ref } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkspaceFabProps {
	label: string;
	onClick: () => void;
	triggerRef?: Ref<HTMLButtonElement>;
	className?: string;
}

export function WorkspaceFab({
	label,
	onClick,
	triggerRef,
	className,
}: WorkspaceFabProps) {
	return (
		<Button
			aria-haspopup="dialog"
			aria-label={label}
			className={cn(
				"fixed right-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 size-14 rounded-full p-0 sm:hidden",
				className,
			)}
			onClick={onClick}
			ref={triggerRef}
			type="button"
		>
			<Plus aria-hidden="true" className="size-5" />
			<span className="sr-only">{label}</span>
		</Button>
	);
}
