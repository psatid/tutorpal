import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const infoCardVariants = cva(
  "w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-outline-variant text-left",
  {
    variants: {
      interactive: {
        true: "cursor-pointer group hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
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
