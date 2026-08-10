import { ref, computed, type Ref } from "vue";
import { messages, type Locale } from "@/locales";
import localeAPI from "@/services/localeAPI";

type KeyPath = string;

const STORAGE_KEY = "rtrs_locale";

const supportedLocales: Locale[] = ["en", "tw", "gaa"];
const localeNames: Record<Locale, string> = {
  en: "English",
  tw: "Twi",
  gaa: "Ga",
};

const initLocale = (): Locale => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && supportedLocales.includes(stored)) return stored;
    const browser = navigator.language.split("-")[0] as Locale;
    if (supportedLocales.includes(browser)) return browser;
  }
  return "en";
};

const currentLocale: Ref<Locale> = ref<Locale>(initLocale());

const createI18nInstance = () => {
  const t = (key: KeyPath, fallback = "") => {
    const keys = key.split(".");
    let value: any = messages[currentLocale.value as Locale];
    for (const k of keys) {
      if (
        value &&
        typeof value === "object" &&
        k in (value as Record<string, any>)
      ) {
        value = (value as Record<string, any>)[k];
      } else {
        return fallback || key;
      }
    }
    if (typeof value === "string") {
      return value;
    }
    return fallback || key;
  };

  const locale = computed(() => currentLocale.value);
  const localeName = computed(() => localeNames[currentLocale.value as Locale]);
  const availableLocales = computed(() =>
    supportedLocales.map((l) => ({
      code: l,
      name: localeNames[l],
    }))
  );

  const setLocale = async (next: Locale) => {
    if (supportedLocales.includes(next)) {
      currentLocale.value = next;
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute(
        "lang",
        next === "tw" ? "tw" : next === "gaa" ? "gaa" : "en"
      );
      try {
        await localeAPI.updateLocale(next);
      } catch {
        // ignore sync failure
      }
    }
  };

  return {
    t,
    locale,
    localeName,
    availableLocales,
    setLocale,
    supportedLocales,
  };
};

let sharedInstance: ReturnType<typeof createI18nInstance> | null = null;

export const useI18n = () => {
  if (!sharedInstance) {
    sharedInstance = createI18nInstance();
  }
  return sharedInstance;
};

export const useGlobalI18n = () => {
  return useI18n();
};

export type UseI18nReturn = ReturnType<typeof createI18nInstance>;
