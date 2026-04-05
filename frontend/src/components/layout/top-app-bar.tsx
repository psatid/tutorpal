import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { LogOut } from "lucide-react";

interface TopAppBarProps {
  className?: string;
}

export function TopAppBar({ className }: TopAppBarProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const getUserInitials = () => {
    if (!user) return "TP";
    const name = user.name;
    if (!name) return "TP";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 ring-2 ring-primary/10">
          <AvatarImage src={user?.image ?? undefined} alt="Tutor Profile" />
          <AvatarFallback className="bg-primary-container text-on-primary-container font-headline font-bold">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-primary hover:bg-primary/10"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
