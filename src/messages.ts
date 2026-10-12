export const LANGUAGES: Record<string, { code: string; label: string }> = {
  '1': { code: 'en', label: 'English' },
  '2': { code: 'ta', label: 'தமிழ்' },
  '3': { code: 'hi', label: 'हिन्दी' },
  '4': { code: 'te', label: 'తెలుగు' },
  '5': { code: 'ml', label: 'മലയാളം' },
};

export function languageMenu(): string {
  const lines = Object.entries(LANGUAGES).map(
    ([num, l]) => `${num}. ${l.label}`
  );
  return `Welcome! Please choose your language:\n${lines.join('\n')}`;
}

export const WELCOME: Record<string, string> = {
  en: 'Language set to English. Reply MENU to see products.',
  ta: 'மொழி தமிழாக அமைக்கப்பட்டது. பொருட்களைப் பார்க்க MENU என்று அனுப்பவும்.',
  hi: 'भाषा हिन्दी सेट हो गई। उत्पाद देखने के लिए MENU भेजें।',
  te: 'భాష తెలుగుకు సెట్ చేయబడింది. ఉత్పత్తులు చూడటానికి MENU పంపండి.',
  ml: 'ഭാഷ മലയാളത്തിലേക്ക് സജ്ജമാക്കി. ഉൽപ്പന്നങ്ങൾ കാണാൻ MENU അയയ്ക്കുക.',
};