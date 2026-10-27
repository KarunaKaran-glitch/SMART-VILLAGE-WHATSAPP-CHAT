import { dt } from './dashText';
import { APP_STYLE, ICON, escapeHtml, rupees, scriptJson, svg } from './pageKit';
import { wt } from './webText';

// The customer's pages, in the same app look as the dashboards:
// - the shop page (opened from the [Click here] button): the seller's products as a photo grid
//   with ADD / − + , the delivery address and a cart bar with the total and [Continue];
// - the payment page of one order: amount, the seller's QR, UPI ID (Copy), [Pay with UPI app],
//   "I have paid" with the transaction number; afterwards the order's progress with a picture.
// Plain HTML with a little JavaScript, made for phone screens (WhatsApp's in-app browser).

export type ShopPageProduct = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  maxQty: number; // 0 = sold out
};

const head = (language: string, title: string, style: string) =>
  `<!doctype html><html lang="${escapeHtml(language)}"><head><meta charset="utf-8">` +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<meta name="theme-color" content="#1f3c88">' +
  `<title>${escapeHtml(title)}</title><style>${APP_STYLE}${style}</style></head><body>`;

const appbar = (shopName: string, sub: string) =>
  '<header class="appbar">' +
  `<div class="avatar">${escapeHtml(Array.from(shopName.trim() || '?')[0].toUpperCase())}</div>` +
  `<div class="who"><b>${escapeHtml(shopName)}</b><span>${escapeHtml(sub)}</span></div>` +
  '</header>';

// A short page for old or wrong links
// The page also has a big [Back to WhatsApp] button and, for an old shop link, the steps to shop
// again ("Send Hi 2494" → Shop now). It is in English: an old link does not say who is visiting.
export function simplePage(
  title: string,
  message: string,
  back?: { whatsAppLink: string; shopCode?: string }
): string {
  const steps = back?.shopCode
    ? '<ol class="again">' +
      '<li><i>1</i><span>Go back to WhatsApp</span></li>' +
      `<li><i>2</i><span>Send <b>Hi ${escapeHtml(back.shopCode)}</b></span></li>` +
      '<li><i>3</i><span>Tap <b>Shop now</b> to see the products again</span></li></ol>'
    : '';
  return (
    head('en', title, CUSTOMER_STYLE) +
    '<div class="gonehero"><div class="goneicon">' +
    `${svg(ICON.clock, 44)}</div></div>` +
    '<main class="gone"><div class="card gonecard">' +
    `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>${steps}` +
    (back
      ? `<a class="btn whatsapp block big" href="${escapeHtml(back.whatsAppLink)}">${svg(ICON.chat, 22)} Back to WhatsApp</a>`
      : '') +
    '</div></main></body></html>'
  );
}

export function renderShopPage(data: {
  language: string;
  shopName: string;
  token: string;
  address: string;
  products: ShopPageProduct[];
  canOrder: boolean; // false while the seller has no UPI ID: products are shown, ordering is not
}): string {
  const W = wt(data.language);
  const ordering = data.canOrder && data.products.length > 0;

  const cards = data.products
    .map((p) => {
      const soldOut = p.maxQty <= 0;
      return (
        `<article class="pcard${soldOut ? ' out' : ''}">` +
        `<div class="pimg" data-open="${p.id}">` +
        (p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy">` : '') +
        (soldOut ? `<span class="badge rejected">${escapeHtml(W.soldOut)}</span>` : '') +
        '</div><div class="pbody">' +
        `<p class="pname" data-open="${p.id}">${escapeHtml(p.name)}</p>` +
        (p.description ? `<p class="pdesc">${escapeHtml(p.description)}</p>` : '') +
        `<p class="pprice">₹${rupees(p.price)}</p>` +
        (data.canOrder && !soldOut ? `<div class="qty" data-id="${p.id}"></div>` : '') +
        '</div></article>'
      );
    })
    .join('');

  // Only what the script needs: prices and limits for the - / + buttons, the details view and the texts
  const script = `
const ORDERING = ${ordering};
const PRODUCTS = ${scriptJson(
    data.products.map((p) => ({
      id: p.id,
      price: p.price,
      max: data.canOrder ? p.maxQty : 0,
      name: p.name,
      desc: p.description || '',
      img: p.imageUrl,
    })),
  )};
const T = ${scriptJson({
    add: W.add,
    soldOut: W.soldOut,
    pickOne: W.pickOne,
    addressInvalid: W.addressInvalid,
    sending: W.sending,
    failed: W.failed,
    expired: W.expired,
    continue: W.continue,
    placeOrder: W.placeOrder,
    onlyAvailable: W.onlyAvailable(999),
  })};
const ITEMS_TEXT = ${scriptJson(W.items(999))};
const fmt = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
const byId = (id) => PRODUCTS.find((x) => x.id === id);

// The chosen quantities, kept for this link while the page is open (a reload keeps them)
const SAVE_KEY = 'cart:' + location.pathname + location.search;
const qty = {};
try {
  const saved = JSON.parse(sessionStorage.getItem(SAVE_KEY) || '{}');
  for (const p of PRODUCTS) { const n = Number(saved[p.id]) || 0; if (n > 0 && p.max > 0) qty[p.id] = Math.min(n, p.max); }
} catch (e) {}
function save() { try { sessionStorage.setItem(SAVE_KEY, JSON.stringify(qty)); } catch (e) {} }

// ADD, or − n + ; drawn in the product card and in the details view alike
// At the stock limit the + looks faded, and tapping it says how many there are
function draw(id) {
  const n = qty[id] || 0;
  const full = n >= byId(id).max;
  document.querySelectorAll('.qty[data-id="' + id + '"]').forEach((box) => {
    box.innerHTML = n === 0
      ? '<button type="button" class="addbtn">' + T.add + ' +</button>'
      : '<div class="stepper"><button type="button" data-d="-1" aria-label="-">−</button><span>' + n +
        '</span><button type="button" data-d="1" aria-label="+"' + (full ? ' class="full"' : '') + '>+</button></div>';
  });
}
let toastTimer;
function toast(text) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast gone'; document.body.appendChild(t); }
  t.textContent = text;
  t.classList.remove('gone');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('gone'), 2200);
}

function update() {
  if (!ORDERING) return;
  let count = 0, total = 0;
  for (const p of PRODUCTS) { const n = qty[p.id] || 0; count += n; total += n * p.price; }
  document.getElementById('count').textContent = ITEMS_TEXT.replace('999', count);
  document.getElementById('total').textContent = '₹' + fmt(total);
  document.querySelector('.cartbar').classList.toggle('empty', count === 0);
  document.getElementById('msg').textContent = '';
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('.qty button');
  if (!b) return;
  const id = Number(b.closest('.qty').dataset.id);
  const p = byId(id);
  const d = b.classList.contains('addbtn') ? 1 : Number(b.dataset.d);
  if (d > 0 && (qty[id] || 0) >= p.max) { toast(T.onlyAvailable.replace('999', p.max)); return; }
  qty[id] =Math.max(0, Math.min(p.max, (qty[id] || 0) + d));
  if (!qty[id]) delete qty[id];
  save();
  draw(id);
  update();
  if (ORDERING && !review.hidden) fillReview();
});

// The details view: a big photo, the full description, the price and ADD / − + .
// It opens as a page step, so the phone's Back button closes it.
const sheet = document.getElementById('sheet');
function showSheet(id) {
  const p = byId(id);
  if (!p) return;
  const img = document.getElementById('simg');
  img.hidden = !p.img;
  if (p.img) img.src = p.img;
  document.getElementById('sname').textContent = p.name;
  document.getElementById('sprice').textContent = '₹' + fmt(p.price);
  const left = document.getElementById('sleft');
  const out = ORDERING && p.max <= 0;
  left.textContent = out ? T.soldOut : '';
  left.hidden = !left.textContent;
  document.getElementById('sdesc').textContent = p.desc;
  const box = document.getElementById('sqty');
  box.dataset.id = p.max > 0 ? id : '';
  box.innerHTML = '';
  if (p.max > 0) draw(id);
  sheet.hidden = false;
  document.body.classList.add('locked');
}
// "Review your order": every chosen product (− n + still works), free delivery, the total and
// the address with Change; the order is sent only with [Place order]
const review = document.getElementById('review');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function fillReview() {
  let count = 0, total = 0;
  const rows = PRODUCTS.filter((p) => qty[p.id] > 0).map((p) => {
    const n = qty[p.id]; count += n; total += n * p.price;
    return '<li>' + (p.img ? '<img src="' + esc(p.img) + '" alt="">' : '<span class="noimg"></span>') +
      '<div><p>' + esc(p.name) + '</p><b>₹' + fmt(n * p.price) + '</b></div>' +
      '<div class="qty small" data-id="' + p.id + '"></div></li>';
  });
  if (count === 0) { history.back(); return; }
  document.getElementById('ritems').innerHTML = rows.join('');
  PRODUCTS.forEach((p) => { if (qty[p.id] > 0) draw(p.id); });
  document.getElementById('rtotal').textContent = '₹' + fmt(total);
  document.getElementById('rtotal2').textContent = '₹' + fmt(total);
  document.getElementById('rcount').textContent = ITEMS_TEXT.replace('999', count);
  document.getElementById('raddr').textContent = document.getElementById('address').value.trim();
  document.getElementById('rmsg').textContent = '';
}
function showReview() {
  if (!ORDERING) return;
  sheet.hidden = true;
  fillReview();
  review.hidden = false;
  document.body.classList.add('locked', 'reviewing');
}
function hideSheet() {
  sheet.hidden = true;
  if (review) review.hidden = true;
  document.body.classList.remove('locked', 'reviewing');
}
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]');
  if (o) {
    history.pushState({ p: o.dataset.open }, '', '#p' + o.dataset.open);
    showSheet(Number(o.dataset.open));
  } else if (e.target.closest('[data-close]') && (!sheet.hidden || (review && !review.hidden))) {
    history.back();
  }
});
addEventListener('popstate', () => {
  const m = /^#p(\\d+)$/.exec(location.hash);
  if (m) showSheet(Number(m[1]));
  else if (location.hash === '#review') showReview();
  else hideSheet();
});
PRODUCTS.forEach((p) => { if (p.max > 0) draw(p.id); });
// After a reload the details view (or the review) stays open
const opened = /^#p(\\d+)$/.exec(location.hash);
if (opened) showSheet(Number(opened[1]));
if (ORDERING) {
const go = document.getElementById('go');
const msg = document.getElementById('msg');
const addressBox = document.getElementById('address');
// [Continue]: check the products and the address, then show the review
go.addEventListener('click', () => {
  const count = PRODUCTS.reduce((n, p) => n + (qty[p.id] || 0), 0);
  const address = addressBox.value.trim();
  if (count === 0) { msg.textContent = T.pickOne; return; }
  if (address.length < 10 || address.length > 200) {
    msg.textContent = T.addressInvalid;
    if (!sheet.hidden) history.back();
    addressBox.scrollIntoView({ block: 'center' });
    addressBox.focus();
    return;
  }
  if (!sheet.hidden) history.replaceState(null, '', '#review');
  else history.pushState(null, '', '#review');
  showReview();
});
if (location.hash === '#review') {
  const count = PRODUCTS.reduce((n, p) => n + (qty[p.id] || 0), 0);
  if (count > 0 && addressBox.value.trim().length >= 10) showReview();
  else history.replaceState(null, '', location.pathname + location.search);
}
// Change: back to the page, at the address
document.getElementById('rchange').addEventListener('click', () => {
  history.back();
  setTimeout(() => { addressBox.scrollIntoView({ block: 'center' }); addressBox.focus(); }, 300);
});
// [Place order]: the order is made, then on to its payment page
const place = document.getElementById('place');
const placeText = document.getElementById('placetext');
const rmsg = document.getElementById('rmsg');
place.addEventListener('click', async () => {
  const items = PRODUCTS.filter((p) => qty[p.id] > 0).map((p) => ({ id: p.id, qty: qty[p.id] }));
  const address = addressBox.value.trim();
  place.disabled = true;
  placeText.textContent = T.sending;
  try {
    const res = await fetch(location.pathname + '/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: ${scriptJson(data.token)}, items, address }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) {
      // On to the payment page of the new order (same secret); the cart starts empty next time
      try { sessionStorage.removeItem(SAVE_KEY); } catch (e) {}
      location.href = location.pathname + '/order/' + out.orderId + location.search;
      return;
    }
    rmsg.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
  } catch (e) {
    rmsg.textContent = T.failed;
  }
  place.disabled = false;
  placeText.textContent = T.placeOrder + ' ›';
});
}
update();
`;

  const sheet =
    '<div class="sheet" id="sheet" hidden><div class="sheetbg" data-close></div><div class="sheetbox">' +
    '<button type="button" class="sheetx" data-close aria-label="Close">×</button>' +
    '<div class="sheetimg"><img id="simg" alt=""></div><div class="sheetbody">' +
    '<p class="sname" id="sname"></p><p class="sprice" id="sprice"></p><p class="sleft" id="sleft"></p>' +
    `<p class="sdesc" id="sdesc"></p><div class="qty" id="sqty"></div></div></div></div>`;

  const review =
    '<div class="sheet" id="review" hidden><div class="sheetbg" data-close></div><div class="sheetbox reviewbox">' +
    '<button type="button" class="sheetx" data-close aria-label="Close">×</button>' +
    `<div class="sheetbody"><h2 class="rtitle">${escapeHtml(W.yourOrder)}</h2>` +
    '<ul class="items" id="ritems"></ul>' +
    `<div class="deliv"><span>${svg(ICON.truck, 16)} ${escapeHtml(W.freeDelivery)}</span><b>₹0</b></div>` +
    `<div class="total"><span>${escapeHtml(W.amount)}</span><b id="rtotal"></b></div>` +
    `<div class="raddr"><i>${svg(ICON.pin, 20)}</i><div><b>${escapeHtml(W.address)}</b><p id="raddr"></p></div>` +
    `<button type="button" class="btn outline small" id="rchange">${escapeHtml(W.change)}</button></div></div>` +
    '<div class="rfoot"><p class="msg" id="rmsg"></p><button type="button" class="cartrow" id="place">' +
    '<span class="sum"><span id="rcount"></span><b id="rtotal2"></b></span>' +
    `<span class="gotext" id="placetext">${escapeHtml(W.placeOrder)} ›</span></button></div></div></div>`;

  const body = !data.products.length
    ? `<div class="card empty">${escapeHtml(W.noProducts)}</div>`
    : (data.canOrder ? '' : `<div class="warnbar warnbox">⚠️ ${escapeHtml(W.notReady)}</div>`) +
      `<h3 class="sec">${escapeHtml(W.chooseProducts)} <span class="count">${data.products.length}</span></h3>` +
      `<div class="grid">${cards}</div>` +
      (data.canOrder
        ? '<div class="card addr">' +
          `<label class="addrhead" for="address"><i>${svg(ICON.pin, 20)}</i><b>${escapeHtml(W.address)}</b></label>` +
          `<textarea id="address" maxlength="200" placeholder="${escapeHtml(W.addressHint)}">${escapeHtml(data.address)}</textarea></div>`
        : '');

  // The shop's banner: round logo, name, "Handmade by ..." and three trust labels
  const hero =
    '<header class="shophero"><div class="shopid">' +
    `<div class="bigav">${escapeHtml(Array.from(data.shopName.trim() || '?')[0].toUpperCase())}</div>` +
    `<div><h1>${escapeHtml(data.shopName)}</h1><p>${escapeHtml(W.handmadeBy(data.shopName))}</p></div></div>` +
    '<div class="trust">' +
    `<span>${svg(ICON.truck, 16)} ${escapeHtml(W.freeDelivery)}</span>` +
    `<span>${svg(ICON.wallet, 16)} ${escapeHtml(W.payByUpi)}</span>` +
    `<span>${svg(ICON.heart, 16)} ${escapeHtml(W.handmade)}</span>` +
    '</div></header>';

  return (
    head(data.language, data.shopName, CUSTOMER_STYLE) +
    hero +
    `<main class="shop">${body}</main>` +
    (ordering
      ? '<div class="cartbar empty"><p class="msg" id="msg"></p>' +
        '<button type="button" class="cartrow" id="go">' +
        `<span class="sum"><span id="count"></span><b id="total">₹0</b></span>` +
        `<span class="gotext" id="gotext">${escapeHtml(W.continue)} ›</span></button></div>`
      : '') +
    (data.products.length ? `${sheet}${ordering ? review : ''}<script>${script}</script>` : '') +
    '</body></html>'
  );
}

// The thank-you page: the customer's old link after their order was delivered (the shop visit is
// closed). First a tick that draws itself, falling confetti and "Thank you for choosing <shop>!"
// with the delivery date; a few seconds later the card that says the visit is closed slides up,
// with the steps to shop again and [Back to WhatsApp].
export function renderThanksPage(data: {
  language: string;
  shopName: string;
  shopCode: string;
  orderId: number;
  deliveredOn: string | null; // "27 October 2026", in the customer's language
  whatsAppLink: string;
}): string {
  const W = wt(data.language);
  const hi = `<b>Hi ${escapeHtml(data.shopCode)}</b>`;
  const script = `
// Confetti: small coloured pieces falling at random places and speeds
const box = document.getElementById('confetti');
const colours = ['#fb641b', '#22c55e', '#2f5fd0', '#facc15', '#ec4899', '#a78bfa'];
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colours[i % colours.length];
    c.style.animationDelay = (0.4 + Math.random() * 1.6).toFixed(2) + 's';
    c.style.animationDuration = (2.4 + Math.random() * 1.8).toFixed(2) + 's';
    c.style.setProperty('--x', (Math.random() * 160 - 80).toFixed(0) + 'px');
    c.style.setProperty('--r', (Math.random() * 720 - 360).toFixed(0) + 'deg');
    if (i % 3 === 0) c.style.borderRadius = '50%';
    box.appendChild(c);
  }
}
`;
  return (
    head(data.language, W.thanksTitle(data.shopName), CUSTOMER_STYLE + THANKS_STYLE) +
    '<div id="confetti" aria-hidden="true"></div>' +
    '<div class="thero"><svg class="tick" viewBox="0 0 120 120" aria-hidden="true">' +
    '<circle class="ring" cx="60" cy="60" r="52"/><path class="mark" d="M36 62l16 16 32-34"/></svg></div>' +
    '<main class="thanks"><div class="card tcard">' +
    `<h1 class="t1">${escapeHtml(W.thanksTitle(data.shopName))}</h1>` +
    `<p class="t2">${escapeHtml(data.deliveredOn ? W.deliveredOn(data.orderId, data.deliveredOn) : W.deliveredNoDate(data.orderId))}</p>` +
    `<p class="t3">${escapeHtml(W.hopeYouLove)}</p></div>` +
    '<div class="card gonecard later">' +
    `<h2>${escapeHtml(W.visitClosed)}</h2><p>${escapeHtml(W.shopAgain)}</p>` +
    '<ol class="again">' +
    `<li><i>1</i><span>${escapeHtml(W.stepGoBack)}</span></li>` +
    `<li><i>2</i><span>${escapeHtml(W.stepSend('\u0000')).replace('\u0000', hi)}</span></li>` +
    `<li><i>3</i><span>${escapeHtml(W.stepShopNow)}</span></li></ol>` +
    `<a class="btn whatsapp block big" href="${escapeHtml(data.whatsAppLink)}">${svg(ICON.chat, 22)} ${escapeHtml(W.backToWhatsApp)}</a>` +
    '</div></main>' +
    `<script>${script}</script></body></html>`
  );
}

const THANKS_STYLE = `
.thero{background:linear-gradient(160deg,#22a35a,#15803d 70%);height:170px;border-radius:0 0 30px 30px;display:flex;justify-content:center;align-items:flex-end}
.tick{width:112px;height:112px;margin-bottom:-56px;background:#fff;border-radius:50%;box-shadow:0 10px 28px rgba(21,128,61,.35);animation:pop .5s cubic-bezier(.2,1.4,.4,1) both}
.tick .ring{fill:none;stroke:#22c55e;stroke-width:7;stroke-dasharray:330;stroke-dashoffset:330;animation:draw .7s .3s ease-out forwards}
.tick .mark{fill:none;stroke:#16a34a;stroke-width:9;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:80;stroke-dashoffset:80;animation:draw .45s .95s ease-out forwards}
main.thanks{padding-top:70px}
.tcard{text-align:center;padding:22px 18px}
.t1{margin:0;font-size:1.45rem;line-height:1.25;color:var(--ink)}
.t2{margin:10px 0 0;font-weight:600;color:var(--ok)}
.t3{margin:8px 0 0;color:var(--muted)}
.t1,.t2,.t3{opacity:0;animation:rise .5s ease-out forwards}
.t1{animation-delay:1.2s}.t2{animation-delay:1.6s}.t3{animation-delay:2s}
.later{opacity:0;animation:rise .6s 3.5s ease-out forwards}
#confetti{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:20}
#confetti i{position:absolute;top:-20px;width:9px;height:14px;border-radius:2px;opacity:0;animation:fall linear forwards}
@keyframes pop{from{transform:scale(.3);opacity:0}}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes fall{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:.9;transform:translate(var(--x),105vh) rotate(var(--r))}}
@media (prefers-reduced-motion:reduce){.tick,.tick .ring,.tick .mark,.t1,.t2,.t3,.later{animation:none;opacity:1;stroke-dashoffset:0}}
`;

// The payment page of one order: the seller's QR code, UPI ID (Copy), [Pay with UPI app] and
// "I have paid" with the transaction number. After that it shows the order's progress.
export type PayPageState = 'pay' | 'waiting' | 'received' | 'cancelled';

export function renderPayPage(data: {
  language: string;
  shopName: string;
  token: string;
  orderId: number;
  total: number;
  lines: { name: string; qty: number; amount: number; imageUrl: string | null }[];
  state: PayPageState;
  orderStatus: string; // PENDING, PAID, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
  qrSrc: string | null; // the seller's QR photo, or one made with the amount filled in
  qrFromSeller: boolean;
  upiId: string | null;
  upiLink: string | null;
  whatsAppLink: string | null;
}): string {
  const W = wt(data.language);
  const D = dt(data.language);
  const total = rupees(data.total);

  const summary =
    `<h3 class="sec">${escapeHtml(W.yourOrder)}</h3><div class="card">` +
    `<ul class="items">${data.lines
      .map(
        (l) =>
          '<li>' +
          (l.imageUrl ? `<img src="${escapeHtml(l.imageUrl)}" alt="" loading="lazy">` : '<span class="noimg"></span>') +
          `<div><p>${escapeHtml(l.name)}</p><span>× ${l.qty}</span></div><b>₹${rupees(l.amount)}</b></li>`
      )
      .join('')}</ul>` +
    `<div class="deliv"><span>${svg(ICON.truck, 16)} ${escapeHtml(W.freeDelivery)}</span><b>₹0</b></div>` +
    `<div class="total"><span>${escapeHtml(W.amount)}</span><b>₹${total}</b></div></div>`;
  const step = (n: number, text: string) => `<h3 class="sec step"><i>${n}</i>${escapeHtml(text)}</h3>`;

  let body: string;
  let script = '';
  if (data.state === 'pay') {
    body =
      `<div class="card amountcard"><span>${escapeHtml(W.amount)}</span><b>₹${total}</b>` +
      `<p>${escapeHtml(W.payDirect(data.shopName))}</p></div>` +
      step(1, W.payByUpi) +
      (data.qrSrc
        ? `<div class="card qrcard"><p class="hint">${escapeHtml(W.scanQr)}</p>` +
          `<img class="qr" src="${escapeHtml(data.qrSrc)}" alt="UPI QR">` +
          `<p class="hint">${escapeHtml(data.qrFromSeller ? W.qrSellerNote(total, data.orderId) : W.qrAutoNote(data.orderId))}</p></div>`
        : '') +
      '<div class="card">' +
      (data.upiId
        ? `<div class="upirow"><div><span>${escapeHtml(W.upiId)}</span><b id="upi">${escapeHtml(data.upiId)}</b></div>` +
          `<button type="button" class="btn outline small" id="copy">${escapeHtml(W.copy)}</button></div>`
        : '') +
      (data.upiLink
        ? `<a class="btn primary block" href="${escapeHtml(data.upiLink)}">${escapeHtml(W.payApp)}</a>` +
          `<p class="hint">${escapeHtml(W.payAppNote)}</p>`
        : '') +
      '</div>' +
      step(2, W.afterPay) +
      '<div class="card form">' +
      `<label for="ref">${escapeHtml(W.refLabel)}</label>` +
      '<input id="ref" inputmode="text" autocomplete="off" maxlength="24" placeholder="123456789012">' +
      `<p class="hint">${escapeHtml(W.refHint)}</p>` +
      '<p class="msg" id="msg"></p>' +
      `<button type="button" class="btn approve block" id="paid">✓ ${escapeHtml(W.paid)}</button></div>` +
      summary;
    script = `
const T = ${scriptJson({ copied: W.copied, copy: W.copy, refInvalid: W.refInvalid, failed: W.failed, expired: W.expired })};
const copy = document.getElementById('copy');
if (copy) copy.addEventListener('click', async () => {
  const text = document.getElementById('upi').textContent;
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const r = document.createRange(); r.selectNodeContents(document.getElementById('upi'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy');
  }
  copy.textContent = T.copied;
  setTimeout(() => { copy.textContent = T.copy; }, 2000);
});
const btn = document.getElementById('paid');
const msg = document.getElementById('msg');
btn.addEventListener('click', async () => {
  const ref = document.getElementById('ref').value.replace(/\\s+/g, '').toUpperCase();
  if (ref && !/^[A-Z0-9]{8,24}$/.test(ref)) { msg.textContent = T.refInvalid; return; }
  btn.disabled = true;
  try {
    const res = await fetch(location.pathname + '/paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: ${scriptJson(data.token)}, ref }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) { location.reload(); return; }
    msg.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
  } catch (e) {
    msg.textContent = T.failed;
  }
  btn.disabled = false;
});
`;
  } else {
    // Where the order is now: a picture, a title, a line of text and the progress tracker
    const s = data.orderStatus;
    const view =
      data.state === 'cancelled'
        ? { pic: null, icon: '✖️', title: W.cancelledTitle, text: W.cancelled, at: -1 }
        : data.state === 'waiting'
          ? { pic: null, icon: '⏳', title: W.waitingTitle, text: W.waiting(data.shopName), at: 1 }
          : s === 'DELIVERED'
            ? { pic: '/assets/status/order-delivered.jpg', icon: '', title: W.deliveredTitle, text: W.deliveredText(data.shopName), at: 4 }
            : s === 'SHIPPED'
              ? { pic: '/assets/status/order-shipped.png', icon: '', title: W.shippedTitle, text: W.shippedText(data.shopName), at: 3 }
              : s === 'CONFIRMED'
                ? { pic: '/assets/status/order-confirmed.jpg', icon: '', title: W.confirmedTitle, text: W.confirmedText(data.shopName), at: 2 }
                : { pic: '/assets/status/payment-received.jpg', icon: '', title: W.receivedTitle, text: W.received(data.shopName), at: 1.5 };
    const steps = [D.stepOrdered, D.stPaid, D.stConfirmed, D.stShipped, D.stDelivered];
    const tracker =
      view.at < 0
        ? ''
        : '<ol class="track">' +
          steps
            .map((label, i) => {
              const cls = i < view.at ? 'done' : i === Math.ceil(view.at) ? 'now' : '';
              return `<li class="${cls}"><span></span>${escapeHtml(label)}</li>`;
            })
            .join('') +
          '</ol>';
    body =
      '<div class="card statuscard">' +
      (view.pic ? `<img class="statuspic" src="${view.pic}" alt="">` : `<div class="bigicon">${view.icon}</div>`) +
      `<h2>${escapeHtml(view.title)}</h2><p>${escapeHtml(view.text)}</p>` +
      (tracker ? `<h3 class="sec left">${escapeHtml(W.trackTitle)}</h3>${tracker}` : '') +
      (data.whatsAppLink
        ? `<a class="btn whatsapp block" href="${escapeHtml(data.whatsAppLink)}">${escapeHtml(W.backToWhatsApp)}</a>`
        : '') +
      '</div>' +
      summary;
  }

  return (
    head(data.language, W.payTitle(data.orderId), CUSTOMER_STYLE) +
    appbar(data.shopName, `#${data.orderId} · ₹${total}`) +
    `<main>${body}</main>` +
    (script ? `<script>${script}</script>` : '') +
    '</body></html>'
  );
}

const CUSTOMER_STYLE = `
main{padding-bottom:40px}
main.shop{padding-bottom:150px}
.shophero{position:relative;overflow:hidden;background:linear-gradient(160deg,var(--brand2) 0%,var(--brand) 75%);color:#fff;padding:22px 18px 18px;border-radius:0 0 26px 26px;box-shadow:0 6px 18px rgba(31,60,136,.25)}
.shophero::before{content:"";position:absolute;right:-60px;top:-70px;width:210px;height:210px;border-radius:50%;background:rgba(255,255,255,.08)}
.shophero::after{content:"";position:absolute;left:-40px;bottom:-80px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.05)}
.shopid{position:relative;z-index:1;display:flex;align-items:center;gap:14px;max-width:640px;margin:0 auto}
.bigav{width:62px;height:62px;border-radius:50%;background:#ffd34d;color:var(--brand);display:grid;place-items:center;font-weight:900;font-size:1.8rem;flex:none;border:3px solid rgba(255,255,255,.85);box-shadow:0 4px 12px rgba(0,0,0,.2)}
.shopid h1{margin:0;font-size:1.4rem;line-height:1.2;letter-spacing:-.01em}
.shopid p{margin:3px 0 0;opacity:.85;font-size:.88rem}
.trust{position:relative;z-index:1;display:flex;gap:8px;flex-wrap:wrap;max-width:640px;margin:16px auto 0}
.trust span{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:5px 11px;font-size:.78rem;font-weight:600}
.count{background:var(--bluebg);color:var(--brand2);border-radius:999px;padding:1px 9px;font-size:.8rem;margin-left:4px}
.warnbox{margin-top:4px}
.sec svg{vertical-align:-3px}
.sec.left{text-align:left;margin:16px 0 0}
.pcard.out{opacity:.6}
.pdesc{margin:2px 0 0;color:var(--muted);font-size:.8rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.qty{margin-top:8px}
.pcard{box-shadow:0 2px 12px rgba(16,24,40,.08);transition:transform .15s}
.pcard:active{transform:scale(.98)}
.pprice{color:var(--ink);font-size:1.12rem}
.addbtn{width:100%;border:0;background:#fff3eb;color:var(--accent2);border-radius:10px;padding:9px 0;font:inherit;font-weight:800;letter-spacing:.04em;box-shadow:inset 0 0 0 1.5px #ffd2b8}
.stepper{display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#ff8a3d,var(--accent2));border-radius:10px;overflow:hidden;box-shadow:0 3px 10px rgba(240,90,14,.3)}
.stepper button{border:0;background:transparent;color:#fff;width:40px;height:37px;font-size:1.3rem;font-weight:700}
.stepper span{color:#fff;font-weight:800;min-width:30px;text-align:center}
.stepper button.full{opacity:.4}
#toast{top:auto;bottom:calc(96px + env(safe-area-inset-bottom));z-index:30;white-space:nowrap}
.addr{margin-top:16px}
.addrhead{display:flex;align-items:center;gap:10px;margin:0 0 10px;font-size:1rem}
.addrhead i{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:var(--bluebg);color:var(--brand2);flex:none}
.cartbar{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:6;max-width:616px;margin:0 auto;transition:transform .3s cubic-bezier(.2,.9,.3,1.2),opacity .2s}
.cartbar.empty{transform:translateY(140%);opacity:0;pointer-events:none}
.cartbar .msg{background:#fff;border-radius:12px;padding:8px 12px;margin:0 0 8px;box-shadow:0 4px 14px rgba(0,0,0,.15)}
.cartrow{width:100%;display:flex;align-items:center;gap:12px;border:0;border-radius:16px;padding:12px 16px;font:inherit;color:#fff;text-align:left;cursor:pointer;background:linear-gradient(135deg,#22a35a,#15803d);box-shadow:0 10px 24px rgba(21,128,61,.4)}
.cartrow:disabled{opacity:.8}
.cartrow .sum{flex:1;display:flex;flex-direction:column}
.cartrow .sum span{font-size:.78rem;opacity:.9;font-weight:600}
.cartrow .sum b{font-size:1.2rem}
.gotext{font-weight:800;font-size:1.05rem;white-space:nowrap}
.deliv{display:flex;justify-content:space-between;align-items:center;padding:8px 0 0;color:var(--ok);font-size:.88rem;font-weight:600}
.deliv span{display:flex;align-items:center;gap:6px}
.step{display:flex;align-items:center;gap:8px}
.step i{font-style:normal;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--brand2);color:#fff;font-size:.8rem}
[data-open]{cursor:pointer}
body.locked{overflow:hidden}
.sheet{position:fixed;inset:0;z-index:5;display:flex;align-items:flex-end;justify-content:center}
.sheet[hidden]{display:none}
.sheetbg{position:absolute;inset:0;background:rgba(15,23,42,.55)}
.sheetbox{position:relative;background:#fff;width:100%;max-width:640px;max-height:94vh;overflow:auto;border-radius:18px 18px 0 0;padding-bottom:110px;animation:sheetup .22s ease-out}
@keyframes sheetup{from{transform:translateY(60px)}}
.sheetx{position:sticky;top:10px;float:right;margin:10px 10px -46px 0;z-index:2;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.95);font-size:1.5rem;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,.25)}
.sheetimg{background:#eef2f7;border-radius:18px 18px 0 0;overflow:hidden}
.sheetimg img{display:block;width:100%;max-height:62vh;object-fit:contain}
.sheetimg img[hidden]{display:none}
.sheetbody{padding:14px 16px}
.sname{margin:0;font-weight:700;font-size:1.1rem}
.sprice{margin:6px 0 0;font-weight:800;font-size:1.45rem}
.sleft{margin:4px 0 0;color:var(--accent2);font-weight:700;font-size:.85rem}
.sleft[hidden]{display:none}
.sdesc{margin:10px 0 0;color:#374151;white-space:pre-line;line-height:1.5}
.sdesc:empty{display:none}
.sheet .qty{margin-top:16px}
.sheet .addbtn{padding:12px 0;font-size:1rem}
.sheet .stepper button{height:46px;width:56px}
.reviewbox{padding-bottom:0;display:flex;flex-direction:column}
.reviewbox .sheetx{align-self:flex-end;flex:none}
.rtitle{margin:4px 0 10px;font-size:1.2rem}
.reviewbox .items li>div:nth-child(2){display:flex;flex-direction:column;gap:2px}
.reviewbox .items b{font-size:.95rem}
.qty.small{margin:0;flex:none;width:104px}
.qty.small .stepper button{width:32px;height:32px;font-size:1.1rem}
.raddr{display:flex;align-items:flex-start;gap:10px;margin-top:12px;padding:12px;background:#f8fafc;border-radius:12px}
.raddr i{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:var(--bluebg);color:var(--brand2);flex:none}
.raddr div{flex:1;min-width:0}
.raddr p{margin:2px 0 0;color:var(--muted);font-size:.88rem;overflow-wrap:anywhere}
.rfoot{position:sticky;bottom:0;background:#fff;padding:10px 14px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--line);margin-top:auto}
.rfoot .msg{margin:0 0 8px}
body.reviewing .cartbar{display:none}
.amountcard{text-align:center;background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff}
.amountcard span{opacity:.85;font-size:.9rem}
.amountcard b{display:block;font-size:2.2rem;margin:4px 0}
.amountcard p{margin:0;font-size:.85rem;opacity:.9}
.qrcard{text-align:center}
.qr{display:block;width:230px;max-width:100%;margin:10px auto;border-radius:12px;border:1px solid var(--line);background:#fff}
.upirow{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:10px 12px}
.upirow div{display:flex;flex-direction:column;min-width:0}
.upirow span{color:var(--muted);font-size:.8rem}
.upirow b{overflow-wrap:anywhere}
.btn.approve{background:var(--ok);color:#fff}
.lines li{display:flex;justify-content:space-between;gap:10px}
.statuscard{text-align:center}
.statuscard h2{margin:10px 0 4px;font-size:1.3rem}
.statuscard p{margin:0;color:var(--muted)}
.statuspic{display:block;width:100%;max-height:300px;object-fit:contain;border-radius:12px}
.bigicon{font-size:3.4rem;margin:10px 0 0}
.gonehero{background:linear-gradient(160deg,var(--brand2),var(--brand) 75%);height:150px;border-radius:0 0 30px 30px;display:flex;justify-content:center;align-items:flex-end}
.goneicon{width:96px;height:96px;margin-bottom:-48px;border-radius:50%;background:#fff;color:var(--accent2);display:grid;place-items:center;box-shadow:0 8px 24px rgba(16,24,40,.18);border:5px solid #fff3eb}
main.gone{padding-top:60px}
.gonecard{text-align:center;padding:22px 18px}
.gonecard h2{margin:0 0 6px;font-size:1.35rem}
.gonecard>p{margin:0;color:var(--muted);line-height:1.5}
.again{list-style:none;margin:18px 0 6px;padding:12px 14px;background:#f8fafc;border-radius:14px;text-align:left;display:flex;flex-direction:column;gap:10px}
.again li{display:flex;align-items:center;gap:10px;font-size:.92rem}
.again i{font-style:normal;width:26px;height:26px;border-radius:50%;background:var(--brand2);color:#fff;display:grid;place-items:center;font-size:.8rem;font-weight:800;flex:none}
.btn.big{padding:15px 16px;font-size:1.05rem;margin-top:16px;box-shadow:0 8px 20px rgba(37,211,102,.35)}
`;
