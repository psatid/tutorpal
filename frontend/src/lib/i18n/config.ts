import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import common from "./locales/en/common";
import auth from "./locales/en/auth";
import login from "./locales/en/login";
import dashboard from "./locales/en/dashboard";
import students from "./locales/en/students";
import classes from "./locales/en/classes";
import schedules from "./locales/en/schedules";
import navigation from "./locales/en/navigation";
import settings from "./locales/en/settings";
import courses from "./locales/en/courses";
import thCommon from "./locales/th/common";
import thAuth from "./locales/th/auth";
import thLogin from "./locales/th/login";
import thDashboard from "./locales/th/dashboard";
import thStudents from "./locales/th/students";
import thClasses from "./locales/th/classes";
import thSchedules from "./locales/th/schedules";
import thNavigation from "./locales/th/navigation";
import thSettings from "./locales/th/settings";
import thCourses from "./locales/th/courses";

export const LANGUAGE_PREFERENCE_KEY = "tutorpal-language";
export const supportedLanguages = ["en", "th"] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

export function normalizeLanguage(
  language: string | null | undefined,
): AppLanguage | undefined {
  const baseLanguage = language?.trim().toLowerCase().split(/[-_]/)[0];

  return baseLanguage === "en" || baseLanguage === "th"
    ? baseLanguage
    : undefined;
}

function syncDocumentLanguage(language: string | undefined) {
  if (typeof document === "undefined") return;

  document.documentElement.lang = normalizeLanguage(language) ?? "en";
  document.documentElement.dir = "ltr";
}

const resources = {
  en: {
    common: common as Record<string, unknown>,
    auth: auth as Record<string, unknown>,
    login: login as Record<string, unknown>,
    dashboard: dashboard as Record<string, unknown>,
    students: students as Record<string, unknown>,
    classes: classes as Record<string, unknown>,
    schedules: schedules as Record<string, unknown>,
    navigation: navigation as Record<string, unknown>,
    settings: settings as Record<string, unknown>,
    courses: courses as Record<string, unknown>,
  },
  th: {
    common: thCommon as Record<string, unknown>,
    auth: thAuth as Record<string, unknown>,
    login: thLogin as Record<string, unknown>,
    dashboard: thDashboard as Record<string, unknown>,
    students: thStudents as Record<string, unknown>,
    classes: thClasses as Record<string, unknown>,
    schedules: thSchedules as Record<string, unknown>,
    navigation: thNavigation as Record<string, unknown>,
    settings: thSettings as Record<string, unknown>,
    courses: thCourses as Record<string, unknown>,
  },
};

i18n.on("languageChanged", syncDocumentLanguage);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: supportedLanguages,
    load: "languageOnly",
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_PREFERENCE_KEY,
      caches: [],
      convertDetectedLanguage: (language) =>
        normalizeLanguage(language) ?? language,
    },
    interpolation: {
      escapeValue: false,
    },
    ns: [
      "common",
      "auth",
      "login",
      "dashboard",
      "students",
      "classes",
      "schedules",
      "navigation",
      "settings",
      "courses",
    ],
    defaultNS: "common",
  })
  .then(() => syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language));

export function getAppLanguage(): AppLanguage {
  return normalizeLanguage(i18n.resolvedLanguage ?? i18n.language) ?? "en";
}

export function setAppLanguage(language: AppLanguage) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LANGUAGE_PREFERENCE_KEY, language);
    } catch {
      // The language switch still works when browser storage is unavailable.
    }
  }

  return i18n.changeLanguage(language);
}

export default i18n;
