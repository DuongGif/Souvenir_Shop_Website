import { useEffect, useState } from "react";
import { aiService } from "../services/aiService";
import { useLanguage } from "../contexts/LanguageContext.jsx";

export function useTranslateText(text) {
  const { language, currentLanguageName, isVietnamese } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!text) {
        if (isMounted) setTranslatedText("");
        return;
      }

      if (isVietnamese) {
        if (isMounted) setTranslatedText(text);
        return;
      }

      try {
        if (isMounted) setLoading(true);

        const res = await aiService.translate(text, currentLanguageName);
        const output = res?.data?.translatedText?.trim();

        if (isMounted) {
          setTranslatedText(output || text);
        }
      } catch {
        if (isMounted) {
          setTranslatedText(text);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [text, language, currentLanguageName, isVietnamese]);

  return { translatedText, loading };
}