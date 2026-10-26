export const ADDRESS_TEXT = {
  en: {
    ask: 'Please send your full delivery address (house/street, area, city, PIN). Or send CANCEL.',
    askChange: (current: string) =>
      `Your saved address:\n${current}\n\nSend your new address, or CANCEL to keep it.`,
    invalid: 'The address looks too short or too long (10 to 200 characters). Please send it again, or CANCEL.',
    saved: 'Address saved. ✅ It is filled in for you on the shop page.',
    cancelled: 'Cancelled. Your address was not changed.',
  },
  hi: {
    ask: 'कृपया अपना पूरा डिलीवरी पता (घर/गली, इलाका, शहर, PIN) भेजें। या CANCEL।',
    askChange: (current: string) =>
      `आपका सहेजा हुआ पता:\n${current}\n\nनया पता भेजें, या इसे रखने के लिए CANCEL।`,
    invalid: 'पता बहुत छोटा या बहुत लंबा है (10 से 200 अक्षर)। कृपया फिर से भेजें, या CANCEL।',
    saved: 'पता सहेज लिया गया। ✅ दुकान के पेज पर यह अपने-आप भरा मिलेगा।',
    cancelled: 'रद्द किया गया। आपका पता नहीं बदला।',
  },
  or: {
    ask: 'ଦୟାକରି ଆପଣଙ୍କ ପୂରା ଡେଲିଭରି ଠିକଣା (ଘର/ରାସ୍ତା, ଅଞ୍ଚଳ, ସହର, PIN) ପଠାନ୍ତୁ। କିମ୍ବା CANCEL।',
    askChange: (current: string) =>
      `ଆପଣଙ୍କ ସେଭ୍ ହୋଇଥିବା ଠିକଣା:\n${current}\n\nନୂଆ ଠିକଣା ପଠାନ୍ତୁ, କିମ୍ବା ଏହାକୁ ରଖିବା ପାଇଁ CANCEL।`,
    invalid: 'ଠିକଣାଟି ବହୁତ ଛୋଟ କିମ୍ବା ବହୁତ ଲମ୍ବା (10 ରୁ 200 ଅକ୍ଷର)। ଦୟାକରି ପୁଣି ପଠାନ୍ତୁ, କିମ୍ବା CANCEL।',
    saved: 'ଠିକଣା ସେଭ୍ ହେଲା। ✅ ଦୋକାନ ପେଜରେ ଏହା ଆପେ ଭରା ହୋଇଥିବ।',
    cancelled: 'ବାତିଲ ହେଲା। ଆପଣଙ୍କ ଠିକଣା ବଦଳିନି।',
  },
  as: {
    ask: 'অনুগ্ৰহ কৰি আপোনাৰ সম্পূৰ্ণ ডেলিভাৰী ঠিকনা (ঘৰ/পথ, অঞ্চল, চহৰ, PIN) পঠিয়াওক। নহয় CANCEL।',
    askChange: (current: string) =>
      `আপোনাৰ সংৰক্ষিত ঠিকনা:\n${current}\n\nনতুন ঠিকনা পঠিয়াওক, নহয় এইটোৱেই ৰাখিবলৈ CANCEL।`,
    invalid: 'ঠিকনাটো বহুত চুটি বা বহুত দীঘল (10 ৰ পৰা 200 আখৰ)। অনুগ্ৰহ কৰি আকৌ পঠিয়াওক, নহয় CANCEL।',
    saved: "ঠিকনা সংৰক্ষণ কৰা হ'ল। ✅ দোকানৰ পেজত ই নিজে নিজে ভৰোৱা থাকিব।",
    cancelled: "বাতিল কৰা হ'ল। আপোনাৰ ঠিকনা সলনি কৰা নহ'ল।",
  },
};

export function ad(language: string) {
  return ADDRESS_TEXT[language as keyof typeof ADDRESS_TEXT] ?? ADDRESS_TEXT.en;
}
