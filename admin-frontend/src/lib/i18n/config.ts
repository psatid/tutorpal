import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import common from "./locales/en/common";
import auth from "./locales/en/auth";
import admin from "./locales/en/admin";
import navigation from "./locales/en/navigation";
import settings from "./locales/en/settings";
import thCommon from "./locales/th/common";
import thAuth from "./locales/th/auth";
import thAdmin from "./locales/th/admin";
import thNavigation from "./locales/th/navigation";
import thSettings from "./locales/th/settings";

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
    admin: admin as Record<string, unknown>,
    navigation: navigation as Record<string, unknown>,
    settings: settings as Record<string, unknown>,
  },
  th: {
    common: thCommon as Record<string, unknown>,
    auth: thAuth as Record<string, unknown>,
    admin: thAdmin as Record<string, unknown>,
    navigation: thNavigation as Record<string, unknown>,
    settings: thSettings as Record<string, unknown>,
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
      "admin",
      "navigation",
      "settings",
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
