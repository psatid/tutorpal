import {
  AudioWaveform,
  BadgeCheck,
  Bell,
  Command,
  CreditCard,
  GalleryVerticalEnd,
  Loader2,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { useSession } from "@/hooks/use-session";
import { useLogout } from "@/hooks/mutations/use-logout";

export default function UserSetting({
  children,
}: {
  children: React.ReactElement;
}) {
  const { session } = useSession();
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={children} />
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        positionerClassName="z-[1000]"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <div
          role="presentation"
          className="p-0 font-normal text-xs text-muted-foreground"
        >
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/unknow.png" alt="Unknown" />
              <AvatarFallback>
                {session?.user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {session?.user?.name}
              </span>
              <span className="truncate text-xs">{session?.user?.email}</span>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout.mutate()}>
          {logout.isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
