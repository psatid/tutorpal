import type { Ref } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon as PlusHugeIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@tutorpal/ui/button";
import { ContentReveal } from "@tutorpal/ui/animate-ui/components/base/content-reveal";
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
  return createPortal(
    <ContentReveal
      className={cn(
        "fixed right-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 size-14 sm:hidden",
        className,
      )}
    >
      <Button
        aria-haspopup="dialog"
        aria-label={label}
        className="size-full rounded-full p-0"
        onClick={onClick}
        ref={triggerRef}
        type="button"
      >
        <HugeiconsIcon icon={PlusHugeIcon} strokeWidth={2} aria-hidden="true" className="size-5" />
        <span className="sr-only">{label}</span>
      </Button>
    </ContentReveal>,
    document.body,
  );
}
