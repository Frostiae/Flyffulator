import i18n from "i18next";
import HttpApi from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Add names for each locale to
// show the user in our locale
// switcher.
export const supportedLngs = {
  "en-US": "English",
  "de-DE": "Deutsch",
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
}

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    // Config options

    // Fallback locale used when a translation is
    // missing in the active locale. Again, use your
    // preferred locale here.
    fallbackLng: "en-US",

    supportedLngs: Object.keys(supportedLngs),

    //Only use full Locales
    load: 'currentOnly',

    // Enables useful output in the browser’s
    // dev console.
    debug: false,

    // Normally, we want `escapeValue: true` as it
    // ensures that i18next escapes any code in
    // translation messages, safeguarding against
    // XSS (cross-site scripting) attacks. However,
    // React does this escaping itself, so we turn
    // it off in i18next.
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
