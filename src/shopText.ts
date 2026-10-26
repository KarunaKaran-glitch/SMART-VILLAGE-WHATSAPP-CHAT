import { byLang } from './lang';

// Seller's own shop link and shop state, in every language (see lang.ts).
// The state decides the second language customers are offered next to English.
const en = {
  rowLink: 'My shop link',
  askState:
    'Which state is your shop in? Your customers can then choose English or the language of your state. Tap "Choose state".',
  btnChooseState: 'Choose state',
  btnChangeState: 'Change state',
  stateOdisha: 'Odisha',
  stateAssam: 'Assam',
  stateHindi: 'Hindi-speaking state',
  stateHindiDesc: 'UP, Bihar, MP, Rajasthan, Delhi…',
  stateOther: 'Other state',
  stateOtherDesc: 'Customers see English only',
  withEnglish: (label: string) => `English + ${label}`,
  stateSaved: (choice: string) => `Saved. Your customers can choose: ${choice}.`,
  link: (shop: string, code: string, url: string) =>
    `Your shop link for ${shop}:\n${url}\n\n` +
    'Share this link with your customers (WhatsApp, SMS, a printed card). ' +
    'When they open it and send the message, they see only your products.\n\n' +
    `Shop code: ${code}. Customers can also send "Hi ${code}" to this number.`,
  linkNoUrl: (shop: string, code: string) =>
    `Customers send "Hi ${code}" to this WhatsApp number to open ${shop}. ` +
    '(The bot number is not set yet, so the full link cannot be made.)',
};

const hi: typeof en = {
  rowLink: 'मेरी दुकान का लिंक',
  askState:
    'आपकी दुकान किस राज्य में है? फिर आपके ग्राहक अंग्रेज़ी या आपके राज्य की भाषा चुन सकेंगे। "राज्य चुनें" दबाएँ।',
  btnChooseState: 'राज्य चुनें',
  btnChangeState: 'राज्य बदलें',
  stateOdisha: 'ओडिशा',
  stateAssam: 'असम',
  stateHindi: 'हिन्दी भाषी राज्य',
  stateHindiDesc: 'यूपी, बिहार, एमपी, राजस्थान, दिल्ली…',
  stateOther: 'अन्य राज्य',
  stateOtherDesc: 'ग्राहकों को केवल अंग्रेज़ी दिखेगी',
  withEnglish: (label: string) => `अंग्रेज़ी + ${label}`,
  stateSaved: (choice: string) => `सेव हो गया। आपके ग्राहक चुन सकेंगे: ${choice}।`,
  link: (shop: string, code: string, url: string) =>
    `${shop} के लिए आपकी दुकान का लिंक:\n${url}\n\n` +
    'यह लिंक अपने ग्राहकों को भेजें (WhatsApp, SMS, छपा कार्ड)। ' +
    'लिंक खोलकर संदेश भेजने पर उन्हें केवल आपके उत्पाद दिखेंगे।\n\n' +
    `दुकान कोड: ${code}। ग्राहक इस नंबर पर "Hi ${code}" भी भेज सकते हैं।`,
  linkNoUrl: (shop: string, code: string) =>
    `${shop} खोलने के लिए ग्राहक इस WhatsApp नंबर पर "Hi ${code}" भेजें। ` +
    '(बॉट नंबर अभी सेट नहीं है, इसलिए पूरा लिंक नहीं बन सका।)',
};

const or: typeof en = {
  rowLink: 'ମୋ ଦୋକାନ ଲିଙ୍କ',
  askState:
    'ଆପଣଙ୍କ ଦୋକାନ କେଉଁ ରାଜ୍ୟରେ ଅଛି? ତା\'ପରେ ଆପଣଙ୍କ ଗ୍ରାହକମାନେ ଇଂରାଜୀ କିମ୍ବା ଆପଣଙ୍କ ରାଜ୍ୟର ଭାଷା ବାଛିପାରିବେ। "ରାଜ୍ୟ ବାଛନ୍ତୁ" ଦବାନ୍ତୁ।',
  btnChooseState: 'ରାଜ୍ୟ ବାଛନ୍ତୁ',
  btnChangeState: 'ରାଜ୍ୟ ବଦଳାନ୍ତୁ',
  stateOdisha: 'ଓଡ଼ିଶା',
  stateAssam: 'ଆସାମ',
  stateHindi: 'ହିନ୍ଦୀ ଭାଷୀ ରାଜ୍ୟ',
  stateHindiDesc: 'UP, ବିହାର, MP, ରାଜସ୍ଥାନ, ଦିଲ୍ଲୀ…',
  stateOther: 'ଅନ୍ୟ ରାଜ୍ୟ',
  stateOtherDesc: 'ଗ୍ରାହକମାନେ କେବଳ ଇଂରାଜୀ ଦେଖିବେ',
  withEnglish: (label: string) => `ଇଂରାଜୀ + ${label}`,
  stateSaved: (choice: string) => `ସେଭ୍ ହେଲା। ଆପଣଙ୍କ ଗ୍ରାହକମାନେ ବାଛିପାରିବେ: ${choice}।`,
  link: (shop: string, code: string, url: string) =>
    `${shop} ପାଇଁ ଆପଣଙ୍କ ଦୋକାନ ଲିଙ୍କ:\n${url}\n\n` +
    'ଏହି ଲିଙ୍କ ଆପଣଙ୍କ ଗ୍ରାହକଙ୍କୁ ପଠାନ୍ତୁ (WhatsApp, SMS, ଛପା କାର୍ଡ)। ' +
    'ସେମାନେ ଲିଙ୍କ ଖୋଲି ମେସେଜ୍ ପଠାଇଲେ କେବଳ ଆପଣଙ୍କ ଉତ୍ପାଦ ଦେଖିବେ।\n\n' +
    `ଦୋକାନ କୋଡ୍: ${code}। ଗ୍ରାହକମାନେ ଏହି ନମ୍ବରକୁ "Hi ${code}" ମଧ୍ୟ ପଠାଇପାରିବେ।`,
  linkNoUrl: (shop: string, code: string) =>
    `${shop} ଖୋଲିବା ପାଇଁ ଗ୍ରାହକମାନେ ଏହି WhatsApp ନମ୍ବରକୁ "Hi ${code}" ପଠାନ୍ତୁ। ` +
    '(ବଟ୍ ନମ୍ବର ଏପର୍ଯ୍ୟନ୍ତ ସେଟ୍ ହୋଇନାହିଁ, ତେଣୁ ପୂରା ଲିଙ୍କ ତିଆରି ହୋଇପାରିଲା ନାହିଁ।)',
};

const as: typeof en = {
  rowLink: 'মোৰ দোকানৰ লিংক',
  askState:
    'আপোনাৰ দোকান কোন ৰাজ্যত? তাৰ পিছত আপোনাৰ গ্ৰাহকে ইংৰাজী বা আপোনাৰ ৰাজ্যৰ ভাষা বাছিব পাৰিব। "ৰাজ্য বাছক" টিপক।',
  btnChooseState: 'ৰাজ্য বাছক',
  btnChangeState: 'ৰাজ্য সলনি কৰক',
  stateOdisha: 'ওড়িশা',
  stateAssam: 'অসম',
  stateHindi: 'হিন্দীভাষী ৰাজ্য',
  stateHindiDesc: 'UP, বিহাৰ, MP, ৰাজস্থান, দিল্লী…',
  stateOther: 'অন্য ৰাজ্য',
  stateOtherDesc: 'গ্ৰাহকে কেৱল ইংৰাজী দেখিব',
  withEnglish: (label: string) => `ইংৰাজী + ${label}`,
  stateSaved: (choice: string) => `ছেভ হ'ল। আপোনাৰ গ্ৰাহকে বাছিব পাৰিব: ${choice}।`,
  link: (shop: string, code: string, url: string) =>
    `${shop}ৰ বাবে আপোনাৰ দোকানৰ লিংক:\n${url}\n\n` +
    'এই লিংক আপোনাৰ গ্ৰাহকক পঠিয়াওক (WhatsApp, SMS, ছপা কাৰ্ড)। ' +
    'লিংক খুলি মেছেজ পঠালে তেওঁলোকে কেৱল আপোনাৰ সামগ্ৰী দেখিব।\n\n' +
    `দোকানৰ ক'ড: ${code}। গ্ৰাহকে এই নম্বৰলৈ "Hi ${code}" পঠিয়াবও পাৰে।`,
  linkNoUrl: (shop: string, code: string) =>
    `${shop} খুলিবলৈ গ্ৰাহকে এই WhatsApp নম্বৰলৈ "Hi ${code}" পঠিয়াওক। ` +
    "(বটৰ নম্বৰ এতিয়াও ছেট কৰা নাই, সেয়েহে সম্পূৰ্ণ লিংক বনাব পৰা নগ'ল।)",
};

export const SHOP_TEXT = byLang({ en, hi, or, as });
