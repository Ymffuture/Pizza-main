import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import af from "./locales/af.json";
import zu from "./locales/zu.json";

// Languages KotaBites currently ships with. Add a new entry here + a
// matching locale file in ./locales to support another language — every
// component using useTranslation() picks it up automatically, no other
// code changes needed.
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English",   nativeLabel: "English",   flag: "🇬🇧" },
  { code: "af", label: "Afrikaans", nativeLabel: "Afrikaans", flag: "🇿🇦" },
  { code: "zu", label: "isiZulu",   nativeLabel: "isiZulu",   flag: "🇿🇦" },
];

i18n
  .use(LanguageDetector) // reads localStorage("kb_lang") / navigator.language
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      af: { translation: af },
      zu: { translation: zu },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    detection: {
      // Check a manually-saved preference first, then fall back to
      // whatever the browser/OS reports.
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "kb_lang",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React already escapes output
    },
    // Missing keys silently fall back to the key itself in dev — flip this
    // on temporarily if you want console warnings while adding new keys.
    debug: false,
  });

export default i18n;
