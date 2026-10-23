import { Avatar, AvatarFallback } from "@tutorpal/ui/avatar";
import { Badge } from "@tutorpal/ui/badge";
import { Button } from "@tutorpal/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tutorpal/ui/dropdown-menu";
import { Student } from "@/models/student";
import { getNameTone, nameToneAvatarClasses } from "@/lib/name-tone";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon as CheckCircle2HugeIcon,
  ViewIcon as EyeHugeIcon,
  Link02Icon as Link2HugeIcon,
  Message01Icon as MessageSquareHugeIcon,
  MoreVerticalIcon as MoreVerticalHugeIcon,
  CallIcon as PhoneHugeIcon,
  Delete02Icon as Trash2HugeIcon,
  Alert01Icon as TriangleAlertHugeIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";

interface StudentRowProps {
  student: Student;
  onView: () => void;
  onDelete: () => void;
  onLinkLine: () => void;
  onSendTestMessage: () => void;
  lineConnectionAvailability: "configured" | "checking" | "unavailable";
}

export function StudentRow({
  student,
  onView,
  onDelete,
  onLinkLine,
  onSendTestMessage,
  lineConnectionAvailability,
}: StudentRowProps) {
  const { t } = useTranslation(["students"]);
  const data = student.getListItemData();
  const linked = data.isLineLinked;
  const needsRelink = data.needsLineRelink;

  return (
    <li className="group scroll-mt-28 md:scroll-mt-32">
      <div className="flex min-h-20 items-center rounded-xl border border-border gap-3 bg-card px-4 py-4 transition-colors motion-reduce:transition-none hover:bg-surface focus-within:bg-surface">
        <button
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35"
          onClick={onView}
          type="button"
        >
          <Avatar size="lg">
            <AvatarFallback className={`${nameToneAvatarClasses[getNameTone(data.name)]} font-semibold`}>
              {data.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-foreground">
                {data.name}
              </p>
              <Badge variant="info">
                {t("students:grade", { grade: data.grade })}
              </Badge>
              {linked ? (
                <Badge variant="success">
                  <HugeiconsIcon icon={CheckCircle2HugeIcon} strokeWidth={2} aria-hidden="true" />
                  LINE
                </Badge>
              ) : null}
              {needsRelink ? (
                <Badge variant="warning">
                  <HugeiconsIcon icon={TriangleAlertHugeIcon} strokeWidth={2} aria-hidden="true" />
                  {t("students:line.needsRelink")}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <HugeiconsIcon icon={PhoneHugeIcon} strokeWidth={2} aria-hidden="true" className="size-4" />
              {data.phoneNumber ?? t("students:noPhone")}
            </p>
          </div>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={t("students:actionsFor", { name: data.name })}
                size="icon"
                variant="ghost"
              />
            }
          >
            <HugeiconsIcon icon={MoreVerticalHugeIcon} strokeWidth={2} aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onView}>
                <HugeiconsIcon icon={EyeHugeIcon} strokeWidth={2} aria-hidden="true" />
                {t("students:view")}
              </DropdownMenuItem>
              {!linked ? (
                <DropdownMenuItem
                  disabled={lineConnectionAvailability !== "configured"}
                  onClick={
                    lineConnectionAvailability === "configured"
                      ? onLinkLine
                      : undefined
                  }
                >
                  <HugeiconsIcon icon={Link2HugeIcon} strokeWidth={2} aria-hidden="true" />
                  {t(
                    needsRelink
                      ? "students:line.relinkLabel"
                      : "students:line.linkLabel",
                  )}
                </DropdownMenuItem>
              ) : null}
              {linked ? (
                <DropdownMenuItem onClick={onSendTestMessage}>
                  <HugeiconsIcon icon={MessageSquareHugeIcon} strokeWidth={2} aria-hidden="true" />
                  {t("students:line.testMessage")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onDelete} variant="destructive">
                <HugeiconsIcon icon={Trash2HugeIcon} strokeWidth={2} aria-hidden="true" />
                {t("students:delete.confirmButton")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
