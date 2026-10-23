import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon as Trash2HugeIcon,
  CallIcon as PhoneHugeIcon,
  ViewIcon as EyeHugeIcon,
  MoreVerticalIcon as MoreVerticalHugeIcon,
  Link02Icon as Link2HugeIcon,
  CheckmarkCircle02Icon as CheckCircle2HugeIcon,
  Message01Icon as MessageSquareHugeIcon,
  Alert01Icon as TriangleAlertHugeIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@tutorpal/ui/avatar";
import { Badge } from "@tutorpal/ui/badge";
import { InfoCard } from "@tutorpal/ui/info-card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@tutorpal/ui/dropdown-menu";
import { Student } from "@/models/student";
import { getNameTone, nameToneAvatarClasses } from "@/lib/name-tone";

interface StudentCardProps {
  student: Student;
  onView: () => void;
  onDelete: () => void;
  onLinkLine: () => void;
  onSendTestMessage: () => void;
}

export function StudentCard({ student, onView, onDelete, onLinkLine, onSendTestMessage }: StudentCardProps) {
  const { t } = useTranslation(["students"]);
  const data = student.getListItemData();
  const isLineLinked = data.isLineLinked;
  const needsLineRelink = data.needsLineRelink;

  return (
    <InfoCard onClick={onView}>
      <Avatar size="lg">
        <AvatarFallback className={`${nameToneAvatarClasses[getNameTone(data.name)]} font-semibold`}>
          {data.initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-on-surface truncate">{data.name}</p>
          <Badge className="shrink-0" variant="info">
            {t("students:grade", { grade: data.grade })}
          </Badge>
          {isLineLinked && (
            <Badge variant="success" className="shrink-0 gap-1">
              <HugeiconsIcon icon={CheckCircle2HugeIcon} strokeWidth={2} aria-hidden="true" className="w-3 h-3" />
              LINE
            </Badge>
          )}
          {needsLineRelink && (
            <Badge variant="warning" className="shrink-0 gap-1">
              <HugeiconsIcon icon={TriangleAlertHugeIcon} strokeWidth={2} aria-hidden="true" className="w-3 h-3" />
              {t("students:line.needsRelink")}
            </Badge>
          )}
        </div>
        {data.phoneNumber && (
          <span className="flex items-center gap-1 text-sm text-on-surface-variant mt-0.5">
            <HugeiconsIcon icon={PhoneHugeIcon} strokeWidth={2} aria-hidden="true" className="w-3 h-3" />
            {data.phoneNumber}
          </span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
          <HugeiconsIcon icon={MoreVerticalHugeIcon} strokeWidth={2} aria-hidden="true" className="w-4 h-4 text-on-surface-variant" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onView}>
            <HugeiconsIcon icon={EyeHugeIcon} strokeWidth={2} aria-hidden="true" className="w-4 h-4" />
            {t("students:view")}
          </DropdownMenuItem>
          {!isLineLinked && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLinkLine(); }}>
              <HugeiconsIcon icon={Link2HugeIcon} strokeWidth={2} aria-hidden="true" className="w-4 h-4" />
              {t(needsLineRelink ? "students:line.relinkLabel" : "students:line.linkLabel")}
            </DropdownMenuItem>
          )}
          {isLineLinked && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSendTestMessage(); }}>
              <HugeiconsIcon icon={MessageSquareHugeIcon} strokeWidth={2} aria-hidden="true" className="w-4 h-4" />
              {t("students:line.testMessage")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <HugeiconsIcon icon={Trash2HugeIcon} strokeWidth={2} aria-hidden="true" className="w-4 h-4" />
            {t("students:delete.confirmButton")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </InfoCard>
  );
}
