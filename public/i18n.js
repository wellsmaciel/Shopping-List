// Interface Language: applies a flat key -> text dictionary to the DOM.
// Elements carry their key in data-i18n (text) or data-i18n-attr="attr:key;attr:key".
const i18n = (() => {
  const STORAGE_KEY = 'language';
  const LANGUAGES = ['en', 'ga'];
  let dictionary = {};
  let current = 'en';

  function readSaved() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return LANGUAGES.includes(saved) ? saved : 'en';
    } catch (error) {
      return 'en';
    }
  }

  function save(language) {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // Storage unavailable: the app still works, the choice just is not remembered.
    }
  }

  function t(key) {
    return dictionary[key] !== undefined ? dictionary[key] : key;
  }

  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
      });
    });
    document.title = t('page.title');
  }

  async function setLanguage(language) {
    const response = await fetch(`/i18n/${language}.json`);
    dictionary = await response.json();
    current = language;
    document.documentElement.lang = language;
    apply();
    save(language);
  }

  async function init() {
    await setLanguage(readSaved()).catch((error) => console.error('Error:', error));
  }

  function toggle() {
    return setLanguage(current === 'en' ? 'ga' : 'en');
  }

  return { t, apply, setLanguage, init, toggle };
})();
