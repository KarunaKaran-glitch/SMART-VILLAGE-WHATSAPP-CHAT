// The languages customers can choose (number = position in the language list)
export const LANGUAGES: Record<string, { code: string; label: string }> = {
  '1': { code: 'en', label: 'English' },
  '2': { code: 'hi', label: 'हिन्दी' },
  '3': { code: 'or', label: 'ଓଡ଼ିଆ' },
  '4': { code: 'as', label: 'অসমীয়া' },
};

// "Please choose your language" in each local language (shown under the English line)
export const CHOOSE_LANGUAGE: Record<string, string> = {
  hi: 'कृपया अपनी भाषा चुनें 👇',
  or: 'ଦୟାକରି ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ 👇',
  as: 'অনুগ্ৰহ কৰি আপোনাৰ ভাষা বাছক 👇',
};

export const TEXT = {
  en: {
    emptyCart: 'Please choose at least one product.',
    invalidProduct: 'This product is not available any more.',
  },
  hi: {
    emptyCart: 'कृपया कम से कम एक उत्पाद चुनें।',
    invalidProduct: 'यह उत्पाद अब उपलब्ध नहीं है।',
  },
  or: {
    emptyCart: 'ଦୟାକରି ଅତି କମରେ ଗୋଟିଏ ଉତ୍ପାଦ ବାଛନ୍ତୁ।',
    invalidProduct: 'ଏହି ଉତ୍ପାଦ ଆଉ ଉପଲବ୍ଧ ନାହିଁ।',
  },
  as: {
    emptyCart: 'অনুগ্ৰহ কৰি অন্ততঃ এটা সামগ্ৰী বাছক।',
    invalidProduct: 'এই সামগ্ৰী আৰু উপলব্ধ নহয়।',
  },
};

export function t(language: string) {
  return TEXT[language as keyof typeof TEXT] ?? TEXT.en;
}
