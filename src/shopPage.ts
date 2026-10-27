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
  left: number | null; // shown as "Only n left" when stock is low
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
        '<div class="pimg">' +
        (p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy">` : '') +
        (soldOut
          ? `<span class="badge rejected">${escapeHtml(W.soldOut)}</span>`
          : p.left !== null
            ? `<span class="badge waiting">${escapeHtml(W.onlyLeft(p.left))}</span>`
            : '') +
        '</div><div class="pbody">' +
        `<p class="pname">${escapeHtml(p.name)}</p>` +
        (p.description ? `<p class="pdesc">${escapeHtml(p.description)}</p>` : '') +
        `<p class="pprice">₹${rupees(p.price)}</p>` +
        (data.canOrder && !soldOut ? `<div class="qty" data-id="${p.id}"></div>` : '') +
        '</div></article>'
      );
    })
    .join('');

  // Only what the script needs: prices and limits for the - / + buttons, and the texts
  const script = `
const PRODUCTS = ${scriptJson(data.products.map((p) => ({ id: p.id, price: p.price, max: p.maxQty })))};
const T = ${scriptJson({
    add: W.add,
    pickOne: W.pickOne,
    addressInvalid: W.addressInvalid,
    sending: W.sending,
    failed: W.failed,
    expired: W.expired,
    continue: W.continue,
  })};
const ITEMS_TEXT = ${scriptJson(W.items(999))};
const qty = {};
const fmt = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

function draw(id) {
  const box = document.querySelector('.qty[data-id="' + id + '"]');
  const n = qty[id] || 0;
  box.innerHTML = n === 0
    ? '<button type="button" class="addbtn">' + T.add + '</button>'
    : '<div class="stepper"><button type="button" data-d="-1" aria-label="-">−</button><span>' + n +
      '</span><button type="button" data-d="1" aria-label="+">+</button></div>';
}

function update() {
  let count = 0, total = 0;
  for (const p of PRODUCTS) { const n = qty[p.id] || 0; count += n; total += n * p.price; }
  document.getElementById('count').textContent = ITEMS_TEXT.replace('999', count);
  document.getElementById('total').textContent = '₹' + fmt(total);
  document.querySelector('.cartbar').classList.toggle('empty', count === 0);
  document.getElementById('msg').textContent = '';
}

document.querySelectorAll('.qty').forEach((box) => {
  const id = Number(box.dataset.id);
  const p = PRODUCTS.find((x) => x.id === id);
  draw(id);
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.classList.contains('addbtn') ? 1 : Number(b.dataset.d);
    qty[id] = Math.max(0, Math.min(p.max, (qty[id] || 0) + d));
    draw(id);
    update();
  });
});

const go = document.getElementById('go');
const msg = document.getElementById('msg');
go.addEventListener('click', async () => {
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
  go.textContent = T.sending;
  try {
    const res = await fetch(location.pathname + '/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: ${scriptJson(data.token)}, items, address }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) {
      // On to the payment page of the new order (same secret)
      location.href = location.pathname + '/order/' + out.orderId + location.search;
      return;
    }
    msg.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
  } catch (e) {
    msg.textContent = T.failed;
  }
  go.disabled = false;
  go.textContent = T.continue + ' ›';
});
update();
`;

  const body = !data.products.length
    ? `<div class="card empty">${escapeHtml(W.noProducts)}</div>`
    : (data.canOrder ? '' : `<div class="warnbar warnbox">⚠️ ${escapeHtml(W.notReady)}</div>`) +
      `<h3 class="sec">${escapeHtml(W.chooseProducts)} (${data.products.length})</h3>` +
      `<div class="grid">${cards}</div>` +
      (data.canOrder
        ? `<h3 class="sec">${svg(ICON.pin, 18)} ${escapeHtml(W.address)}</h3><div class="card form">` +
          `<textarea id="address" maxlength="200" placeholder="${escapeHtml(W.addressHint)}">${escapeHtml(data.address)}</textarea></div>`
        : '');

  return (
    head(data.language, data.shopName, CUSTOMER_STYLE) +
    appbar(data.shopName, W.handmadeBy(data.shopName)) +
    `<div class="perks"><span>🚚 ${escapeHtml(W.freeDelivery)}</span><span>💳 ${escapeHtml(W.payByUpi)}</span></div>` +
    `<main class="shop">${body}</main>` +
    (ordering
      ? '<div class="cartbar empty"><p class="msg" id="msg"></p><div class="cartrow">' +
        `<div class="sum"><span id="count"></span><b id="total">₹0</b></div>` +
        `<button type="button" class="btn primary" id="go">${escapeHtml(W.continue)} ›</button></div></div>` +
        `<script>${script}</script>`
      : '') +
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
  lines: { name: string; qty: number; amount: number }[];
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
    `<ul class="lines">${data.lines
      .map((l) => `<li><span>${escapeHtml(l.name)} × ${l.qty}</span><b>₹${rupees(l.amount)}</b></li>`)
      .join('')}</ul>` +
    `<div class="total"><span>${escapeHtml(W.amount)}</span><b>₹${total}</b></div>` +
    `<p class="hint">🚚 ${escapeHtml(W.freeDelivery)}</p></div>`;

  let body: string;
  let script = '';
  if (data.state === 'pay') {
    body =
      `<div class="card amountcard"><span>${escapeHtml(W.amount)}</span><b>₹${total}</b>` +
      `<p>${escapeHtml(W.payDirect(data.shopName))}</p></div>` +
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
      `<h3 class="sec">${escapeHtml(W.afterPay)}</h3><div class="card form">` +
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
.perks{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;background:#fff;padding:8px 12px;border-bottom:1px solid var(--line);font-size:.82rem;font-weight:600;color:var(--brand)}
.perks span{background:var(--bluebg);border-radius:999px;padding:4px 10px}
.warnbox{margin-top:4px}
.sec svg{vertical-align:-3px}
.sec.left{text-align:left;margin:16px 0 0}
.pcard.out{opacity:.6}
.pdesc{margin:2px 0 0;color:var(--muted);font-size:.8rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.qty{margin-top:8px}
.addbtn{width:100%;border:1.5px solid var(--accent);background:#fff;color:var(--accent);border-radius:8px;padding:8px 0;font:inherit;font-weight:800;letter-spacing:.04em}
.stepper{display:flex;align-items:center;justify-content:space-between;background:var(--accent);border-radius:8px;overflow:hidden}
.stepper button{border:0;background:transparent;color:#fff;width:40px;height:36px;font-size:1.3rem;font-weight:700}
.stepper span{color:#fff;font-weight:800;min-width:30px;text-align:center}
.cartbar{position:fixed;left:0;right:0;bottom:0;z-index:6;background:#fff;border-top:1px solid var(--line);box-shadow:0 -4px 14px rgba(0,0,0,.08);padding:10px 14px calc(10px + env(safe-area-inset-bottom))}
.cartbar .msg{max-width:640px;margin:0 auto 8px}
.cartrow{max-width:640px;margin:0 auto;display:flex;align-items:center;gap:12px}
.cartrow .sum{flex:1;display:flex;flex-direction:column}
.cartrow .sum span{color:var(--muted);font-size:.82rem}
.cartrow .sum b{font-size:1.25rem}
.cartrow .btn{flex:1.3;padding:14px 10px;font-size:1.02rem}
.cartbar.empty .btn{opacity:.55}
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
