export const ADDRESS_TEXT = {
  en: {
    ask: 'Please send your full delivery address (house/street, area, city, PIN). Or send CANCEL.',
    askChange: (current: string) =>
      `Your saved address:\n${current}\n\nSend your new address, or CANCEL to keep it.`,
    invalid: 'The address looks too short or too long (10 to 200 characters). Please send it again, or CANCEL.',
    saved: 'Address saved. Send ORDER to place your order.',
    cancelled: 'Cancelled. Reply MENU to see products.',
  },
  ta: {
    ask: 'உங்கள் முழு டெலிவரி முகவரியை (வீடு/தெரு, பகுதி, நகரம், PIN) அனுப்பவும். அல்லது CANCEL.',
    askChange: (current: string) =>
      `உங்கள் சேமித்த முகவரி:\n${current}\n\nபுதிய முகவரியை அனுப்பவும், அல்லது அதையே வைத்திருக்க CANCEL.`,
    invalid: 'முகவரி மிகக் குறுகியதாக அல்லது நீளமாக உள்ளது (10 முதல் 200 எழுத்துகள்). மீண்டும் அனுப்பவும், அல்லது CANCEL.',
    saved: 'முகவரி சேமிக்கப்பட்டது. ஆர்டர் செய்ய ORDER என்று அனுப்பவும்.',
    cancelled: 'ரத்து செய்யப்பட்டது. பொருட்களைப் பார்க்க MENU என்று அனுப்பவும்.',
  },
  hi: {
    ask: 'कृपया अपना पूरा डिलीवरी पता (घर/गली, इलाका, शहर, PIN) भेजें। या CANCEL।',
    askChange: (current: string) =>
      `आपका सहेजा हुआ पता:\n${current}\n\nनया पता भेजें, या इसे रखने के लिए CANCEL।`,
    invalid: 'पता बहुत छोटा या बहुत लंबा है (10 से 200 अक्षर)। कृपया फिर से भेजें, या CANCEL।',
    saved: 'पता सहेज लिया गया। ऑर्डर के लिए ORDER भेजें।',
    cancelled: 'रद्द किया गया। उत्पाद देखने के लिए MENU भेजें।',
  },
};

export function ad(language: string) {
  return ADDRESS_TEXT[language as keyof typeof ADDRESS_TEXT] ?? ADDRESS_TEXT.en;
}