import { Clock, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Class } from "@/types/class";

interface ClassCardProps {
  classData: Class;
}

export function ClassCard({ classData }: ClassCardProps) {
  const { t } = useTranslation(["classes"]);

  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-headline font-bold text-lg text-on-surface">
          {classData.name}
        </h3>
        <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-semibold">
          {t("classes:status.active")}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {t("classes:students", { count: classData.students.length })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {t("classes:hours", { hours: classData.totalHours })}
        </span>
      </div>
      
      {/* Display enrolled students */}
      {classData.students.length > 0 && (
        <div className="border-t border-outline-variant pt-3">
          <p className="text-xs text-on-surface-variant mb-2 font-medium">
            {t("classes:enrolledStudents")}
          </p>
          <div className="flex flex-wrap gap-2">
            {classData.students.map((student) => (
              <span
                key={student.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary-container text-on-secondary-container"
              >
                {student.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
