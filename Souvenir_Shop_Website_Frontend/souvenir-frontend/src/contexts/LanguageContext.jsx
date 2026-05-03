import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LANGUAGE_STORAGE_KEY = "app_language";

const languageMap = {
  vi: "Vietnamese",
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
};

const languageOptions = [
  { value: "vi", label: "VI - Tiếng Việt" },
  { value: "en", label: "EN - English" },
  { value: "ja", label: "JA - 日本語" },
  { value: "ko", label: "KO - 한국어" },
  { value: "zh", label: "ZH - 中文" },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || "vi";
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  const currentLanguageName = useMemo(() => {
    return languageMap[language] || "Vietnamese";
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      currentLanguageName,
      languageMap,
      languageOptions,
      isVietnamese: language === "vi",
    }),
    [language, currentLanguageName]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}