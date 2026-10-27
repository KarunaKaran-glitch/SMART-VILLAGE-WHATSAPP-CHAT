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
export function simplePage(title: string, message: string): string {
  return (
    head('en', title, CUSTOMER_STYLE) +
    `<main><div class="card statuscard"><div class="bigicon">⏱️</div><h2>${escapeHtml(title)}</h2>` +
    `<p>${escapeHtml(message)}</p></div></main></body></html>`
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
function draw(id) {
  const n = qty[id] || 0;
  document.querySelectorAll('.qty[data-id="' + id + '"]').forEach((box) => {
    box.innerHTML = n === 0
      ? '<button type="button" class="addbtn">' + T.add + ' +</button>'
      : '<div class="stepper"><button type="button" data-d="-1" aria-label="-">−</button><span>' + n +
        '</span><button type="button" data-d="1" aria-label="+">+</button></div>';
  });
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
  qty[id] = Math.max(0, Math.min(p.max, (qty[id] || 0) + d));
  if (!qty[id]) delete qty[id];
  save();
  draw(id);
  update();
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
function hideSheet() {
  sheet.hidden = true;
  document.body.classList.remove('locked');
}
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]');
  if (o) {
    history.pushState({ p: o.dataset.open }, '', '#p' + o.dataset.open);
    showSheet(Number(o.dataset.open));
  } else if (e.target.closest('[data-close]') && !sheet.hidden) {
    history.back();
  }
});
addEventListener('popstate', () => {
  const m = /^#p(\\d+)$/.exec(location.hash);
  if (m) showSheet(Number(m[1])); else hideSheet();
});
PRODUCTS.forEach((p) => { if (p.max > 0) draw(p.id); });
// After a reload the details view stays open
const opened = /^#p(\\d+)$/.exec(location.hash);
if (opened) showSheet(Number(opened[1]));
if (ORDERING) {
const go = document.getElementById('go');
const goText = document.getElementById('gotext');
const msg = document.getElementById('msg');
go.addEventListener('click', async () => {
  if (!sheet.hidden) history.back();
  const items = PRODUCTS.filter((p) => qty[p.id] > 0).map((p) => ({ id: p.id, qty: qty[p.id] }));
  const address = document.getElementById('address').value.trim();
  if (items.length === 0) { msg.textContent = T.pickOne; return; }
  if (address.length < 10 || address.length > 200) {
    msg.textContent = T.addressInvalid;
    document.getElementById('address').scrollIntoView({ block: 'center' });
    document.getElementById('address').focus();
    return;
  }
  go.disabled = true;
  goText.textContent = T.sending;
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
    msg.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
  } catch (e) {
    msg.textContent = T.failed;
  }
  go.disabled = false;
  goText.textContent = T.continue + ' ›';
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
    (data.products.length ? `${sheet}<script>${script}</script>` : '') +
    '</body></html>'
  );
}

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
`;
