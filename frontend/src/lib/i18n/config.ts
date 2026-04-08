import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import common from "./locales/en/common";
import login from "./locales/en/login";
import dashboard from "./locales/en/dashboard";
import students from "./locales/en/students";
import classes from "./locales/en/classes";
import schedules from "./locales/en/schedules";
import navigation from "./locales/en/navigation";

const resources = {
  en: {
    common: common as Record<string, unknown>,
    login: login as Record<string, unknown>,
    dashboard: dashboard as Record<string, unknown>,
    students: students as Record<string, unknown>,
    classes: classes as Record<string, unknown>,
    schedules: schedules as Record<string, unknown>,
    navigation: navigation as Record<string, unknown>,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    ns: [
      "common",
      "login",
      "dashboard",
      "students",
      "classes",
      "schedules",
      "navigation",
    ],
    defaultNS: "common",
  });

export default i18n;
