import { Calendar, Clock, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SchedulesScreen() {
  const { t } = useTranslation(["schedules"]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
        <Calendar className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-tight mb-2">
        {t("schedules:title")}
      </h2>
      <p className="font-body text-on-surface-variant text-lg text-center max-w-xs">
        {t("schedules:description")}
      </p>

      <div className="mt-12 w-full max-w-sm">
        <h3 className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-4">
          {t("schedules:dateLabel", { date: "March 29" })}
        </h3>

        <div className="space-y-3">
          <div className="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-primary">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-headline font-bold text-on-surface">
                  Advanced Calculus
                </h4>
                <p className="font-body text-sm text-primary mt-1">
                  Julian Thorne
                </p>
              </div>
              <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded text-xs font-semibold">
                10:00 AM
              </span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t("schedules:duration", { minutes: 60 })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {t("schedules:location", { room: "302" })}
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-secondary">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-headline font-bold text-on-surface">
                  Modern Literature
                </h4>
                <p className="font-body text-sm text-primary mt-1">
                  Elena Rossi
                </p>
              </div>
              <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-xs font-semibold">
                2:00 PM
              </span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t("schedules:duration", { minutes: 90 })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {t("schedules:location", { room: "105" })}
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl border-l-4 border-tertiary opacity-60">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-headline font-bold text-on-surface">
                  Quantum Physics
                </h4>
                <p className="font-body text-sm text-primary mt-1">Marcus Kane</p>
              </div>
              <span className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded text-xs font-semibold">
                4:30 PM
              </span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t("schedules:duration", { minutes: 60 })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {t("schedules:online")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
