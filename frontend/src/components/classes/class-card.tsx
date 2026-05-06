import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Class } from "@/types/class";
import { Clock, Eye, MoreVertical, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ClassCardProps {
  classData: Class;
  onView: () => void;
  onDelete: () => void;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export function ClassCard({ classData, onView, onDelete }: ClassCardProps) {
  const { t } = useTranslation(["classes"]);

  const displayedStudents = classData.students.slice(0, 3);
  const remainingStudents = classData.students.length - 3;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView();
        }
      }}
      className="w-full flex items-start gap-4 p-4 rounded-xl bg-card hover:bg-surface-container transition-colors text-left group border border-outline-variant cursor-pointer"
    >
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-1">
          <p className="font-medium text-lg text-on-surface truncate">
            {classData.name}
          </p>
          <Badge variant="outline" className="shrink-0">
            <Clock />
            {classData.remainingHours !== undefined
              ? t("classes:hoursWithRemaining", {
                  total: classData.totalHours,
                  remaining: classData.remainingHours.toFixed(0),
                })
              : t("classes:hours", { hours: classData.totalHours })}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <AvatarGroup className="shrink-0">
            {displayedStudents.map((student) => (
              <Avatar key={student.id} size="sm">
                <AvatarFallback className="bg-accent text-on-primary-container font-semibold">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {remainingStudents > 0 && (
              <AvatarGroupCount>+{remainingStudents}</AvatarGroupCount>
            )}
          </AvatarGroup>
          <span className="text-sm text-on-surface-variant">
            {t("classes:students", { count: classData.students.length })}
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onView}>
            <Eye className="w-4 h-4" />
            {t("classes:view")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
            {t("classes:delete.confirmButton")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
