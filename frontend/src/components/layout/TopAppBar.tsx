import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TopAppBarProps {
  className?: string;
}

export function TopAppBar({ className }: TopAppBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4",
        "glass ambient-shadow",
        className
      )}
    >
      <h1 className="font-headline font-extrabold text-primary tracking-tight text-xl">
        TutorPal
      </h1>
      <Avatar className="w-10 h-10 ring-2 ring-primary/10">
        <AvatarImage
          src="https://ui.shadcn.com/avatars/01.png"
          alt="Tutor Profile"
        />
        <AvatarFallback className="bg-primary-container text-on-primary-container font-headline font-bold">
          TP
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
