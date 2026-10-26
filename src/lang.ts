import { AsyncLocalStorage } from 'async_hooks';

// The language of the person a message is being written for.
// handleWebhook sets it to the sender's language; a message to someone else
// (a notice to a seller or an admin) is built inside inLang(their language, ...).
// It also holds the shop (seller) the sender came from through a shop link, so the customer's
// screens show that shop. A message built for someone else (inLang) has no shop.
const store = new AsyncLocalStorage<{ lang: string; shop?: string }>();

export function currentLang(): string {
  return store.getStore()?.lang ?? 'en';
}

// The sender's shop name for the rest of the current webhook call
export function setShop(shop: string | undefined): void {
  const s = store.getStore();
  if (s) s.shop = shop;
}

export function currentShop(): string | undefined {
  return store.getStore()?.shop;
}

// Use this language for the rest of the current webhook call
export function setLang(lang: string): void {
  const s = store.getStore();
  if (s) s.lang = lang;
  else store.enterWith({ lang });
}

// Build something (usually a reply) in another person's language
export function inLang<T>(lang: string, build: () => T): T {
  return store.run({ lang }, build);
}

// Makes a text table that answers in the current language, falling back to English.
// Code keeps writing SELLER_TEXT.askName, and gets the right language automatically.
export function byLang<T extends object>(tables: { en: T } & Record<string, T>): T {
  return new Proxy({} as T, {
    get: (_target, key) => (tables[currentLang()] ?? tables.en)[key as keyof T],
  });
}
