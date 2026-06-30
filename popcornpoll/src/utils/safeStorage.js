export const safeJSONParse = (key, fallback, storage = localStorage) => {
  try {
    const item = storage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (error) {
    console.warn(`[SafeStorage] Error parsing key "${key}". Using fallback.`, error);
    return fallback;
  }
};

export const safeJSONSet = (key, value, storage = localStorage) => {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[SafeStorage] Error setting key "${key}".`, error);
  }
};
