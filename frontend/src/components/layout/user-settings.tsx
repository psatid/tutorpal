import { useLogout } from "@/hooks/mutations/use-logout";
import { useSession } from "@/hooks/use-session";
import { getAppLanguage, setAppLanguage } from "@/lib/i18n/config";
import { Languages, Loader2, LogOut } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function UserSetting({
  children,
}: {
  children: React.ReactElement;
}) {
  const { t } = useTranslation(["common", "settings"]);
  const { session } = useSession();
  const logout = useLogout();
  const currentLanguage = getAppLanguage();

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
              <AvatarImage src="/unknow.png" alt={t("common:profile.avatarAlt")} />
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
              <span className="truncate text-xs">
                {session?.user?.email ?? t("common:profile.unknownEmail")}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages aria-hidden="true" />
            {t("settings:language")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              onValueChange={(language) => {
                void setAppLanguage(language as "en" | "th");
              }}
              value={currentLanguage}
            >
              <DropdownMenuRadioItem closeOnClick lang="en" value="en">
                English
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem closeOnClick lang="th" value="th">
                ไทย
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout.mutate()}>
          {logout.isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
          {t("settings:logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
