import { Link } from "@tanstack/react-router";
import { useLogout } from "@/hooks/mutations/use-logout";
import { useSession } from "@/hooks/use-session";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon as Loader2HugeIcon,
  Logout01Icon as LogOutHugeIcon,
  UserIcon as UserRoundHugeIcon,
} from "@hugeicons/core-free-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "../common/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../common/dropdown-menu";
import { APP_ROUTES } from "@/constants/routes";

type UserSettingProps = {
  children: React.ReactElement;
  isImpersonating: boolean;
  isExitingTutorView: boolean;
  onExitTutorView: () => void;
};

export default function UserSetting({
  children,
  isImpersonating,
  isExitingTutorView,
  onExitTutorView,
}: UserSettingProps) {
  const { t } = useTranslation(["common", "settings"]);
  const { session } = useSession();
  const logout = useLogout();
  const isPending = isImpersonating
    ? isExitingTutorView
    : logout.isPending;

  const handleAccountAction = () => {
    if (isImpersonating) {
      onExitTutorView();
      return;
    }

    logout.mutate();
  };

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
              <AvatarFallback className="bg-[#533AFD] font-semibold text-white">
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
        {!isImpersonating ? (
          <DropdownMenuItem
            className="min-h-11"
            render={<Link to={APP_ROUTES.ACCOUNT_SETTINGS} />}
          >
            <HugeiconsIcon icon={UserRoundHugeIcon} strokeWidth={2} aria-hidden="true" />
            {t("settings:account.title")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          className="min-h-11"
          disabled={isPending}
          onClick={handleAccountAction}
        >
          {isPending ? <HugeiconsIcon icon={Loader2HugeIcon} strokeWidth={2} aria-hidden="true" className="animate-spin" /> : <HugeiconsIcon icon={LogOutHugeIcon} strokeWidth={2} aria-hidden="true" />}
          {isImpersonating
            ? t("settings:exitTutorView")
            : t("settings:logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
