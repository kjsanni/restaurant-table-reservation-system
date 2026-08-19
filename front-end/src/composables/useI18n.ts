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

const isDev = import.meta.env.DEV;

const warnMissing = (key: string, locale: Locale) => {
  if (isDev) {
    console.warn(`[i18n] Missing translation: ${key} (locale: ${locale})`);
  }
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

const resolveValue = (root: any, keys: string[]): any => {
  let value: any = root;
  for (const k of keys) {
    if (
      value &&
      typeof value === "object" &&
      k in (value as Record<string, any>)
    ) {
      value = (value as Record<string, any>)[k];
    } else {
      return undefined;
    }
  }
  return value;
};

const interpolate = (value: string, params?: Record<string, any>): string => {
  if (!params || typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      return String(params[key]);
    }
    return `{${key}}`;
  });
};

const createI18nInstance = () => {
  const t = (
    key: KeyPath,
    fallback = "",
    params?: Record<string, any>
  ): string => {
    const keys = key.split(".");
    const locale = currentLocale.value as Locale;
    let value = resolveValue(messages[locale], keys);

    if (value === undefined && locale !== "en") {
      value = resolveValue(messages.en, keys);
    }

    if (value === undefined) {
      warnMissing(key, locale);
      return fallback || key;
    }

    if (typeof value === "string") {
      return interpolate(value, params);
    }

    warnMissing(key, locale);
    return fallback || key;
  };

  const te = (
    key: KeyPath,
    count: number,
    fallback = "",
    params?: Record<string, any>
  ): string => {
    const locale = currentLocale.value as Locale;
    const keys = key.split(".");
    let pluralKey = `${keys[keys.length - 1]}_plural`;
    if (count !== 1) pluralKey = `${keys[keys.length - 1]}_other`;

    const pluralKeys = [...keys.slice(0, -1), pluralKey];
    let value = resolveValue(messages[locale], pluralKeys);

    if (value === undefined && locale !== "en") {
      value = resolveValue(messages.en, pluralKeys);
    }

    if (value === undefined) {
      value = t(key, fallback, params);
    }

    if (typeof value === "string") {
      return interpolate(value, { ...params, count });
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
    te,
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
