import { Trash2, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import type { GetV1Students200Item } from "@/api/generated/models/getV1Students200Item";

interface StudentCardProps {
  student: GetV1Students200Item;
  onView: () => void;
  onDelete: () => void;
}

export function StudentCard({ student, onView, onDelete }: StudentCardProps) {
  const { t } = useTranslation(["students"]);

  const initials = student.name
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
        <p className="font-medium text-on-surface truncate">{student.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-sm text-on-surface-variant">
            {t("students:grade", { grade: student.grade })}
          </span>
          {student.phoneNumber && (
            <span className="flex items-center gap-1 text-sm text-on-surface-variant">
              <Phone className="w-3 h-3" />
              {student.phoneNumber}
            </span>
          )}
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
        aria-label={t("students:delete.confirmButton")}
      >
        <Trash2 className="w-4 h-4" />
      </span>
    </button>
  );
}
