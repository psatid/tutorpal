import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const infoCardVariants = cva(
  "w-full flex items-center gap-4 border-b border-border bg-card px-4 py-4 text-left",
  {
    variants: {
      interactive: {
        true: "cursor-pointer group hover:bg-[#f6f9fc] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35",
      },
    },
  }
);

interface InfoCardProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function InfoCard({ children, onClick }: InfoCardProps) {
  const isInteractive = !!onClick;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={cn(infoCardVariants({ interactive: isInteractive }))}
    >
      {children}
    </div>
  );
}
