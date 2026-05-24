import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 한국어 중심으로 최소화 (다른 언어는 나중에 추가)
const resources = {
  ko: {
    translation: {
      welcome: "환영합니다",
      // 필요한 키만 점진적으로 추가
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ko",
    fallbackLng: "ko",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

// i18n이 준비되었음을 알리는 Promise
export const i18nReady = new Promise<void>((resolve) => {
  i18n.on('initialized', () => resolve());
});