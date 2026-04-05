import { GraduationCap, Clock, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ClassesScreen() {
  const { t } = useTranslation(["classes"]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
        <GraduationCap className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-tight mb-2">
        {t("classes:title")}
      </h2>
      <p className="font-body text-on-surface-variant text-lg text-center max-w-xs">
        {t("classes:description")}
      </p>

      <div className="mt-12 w-full max-w-sm space-y-4">
        <div className="bg-surface-container-lowest p-5 rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-headline font-bold text-lg text-on-surface">
              Advanced Calculus
            </h3>
            <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-semibold">
              {t("classes:status.active")}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {t("classes:students", { count: 12 })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {t("classes:schedule", { days: "Mon, Wed, Fri" })}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-headline font-bold text-lg text-on-surface">
              Modern Literature
            </h3>
            <span className="bg-secondary text-on-secondary px-3 py-1 rounded-full text-xs font-semibold">
              {t("classes:status.active")}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {t("classes:students", { count: 8 })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {t("classes:schedule", { days: "Tue, Thu" })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
