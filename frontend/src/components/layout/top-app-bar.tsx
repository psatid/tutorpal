import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Settings } from "lucide-react";

export function TopAppBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header
      className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-card border-b border-outline-variant"
    >
      <h1 className="font-headline font-extrabold text-primary tracking-tight text-xl">
        TutorPal
      </h1>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            navigate({
              to: "/settings",
              search: { returnTo: location.pathname },
            })
          }
          className="size-11 rounded-full hover:bg-muted"
          aria-label="Open settings"
        >
          <Settings className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
