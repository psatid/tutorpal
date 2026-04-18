import { Trash2, Clock, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import type { Class } from "@/types/class";

interface ClassCardProps {
  classData: Class;
  onView: () => void;
  onDelete: () => void;
}

export function ClassCard({ classData, onView, onDelete }: ClassCardProps) {
  const { t } = useTranslation(["classes"]);

  const initials = classData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-container-lowest hover:bg-surface-container transition-colors text-left group"
    >
      <Avatar size="lg">
        <AvatarFallback className="bg-primary-container text-on-primary-container font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-on-surface truncate">{classData.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-sm text-on-surface-variant">
            <Users className="w-3 h-3" />
            {t("classes:students", { count: classData.students.length })}
          </span>
          <span className="flex items-center gap-1 text-sm text-on-surface-variant">
            <Clock className="w-3 h-3" />
            {t("classes:hours", { hours: classData.totalHours })}
          </span>
        </div>
      </div>

      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onDelete();
          }
        }}
        className="p-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
        aria-label={t("classes:delete.confirmButton")}
      >
        <Trash2 className="w-4 h-4" />
      </span>
    </button>
  );
}
