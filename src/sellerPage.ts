import { dt } from './dashText';
import { escapeHtml, rupees, scriptJson } from './shopPage';
import { wt } from './webText';

// The seller's dashboard (opened from the seller's [My dashboard] button), laid out like a
// shopping app: a top bar with the shop, a bottom tab bar, and five tabs:
// Home (tiles and the orders that need the seller), Orders (order cards with a progress tracker),
// Products (a photo grid with Edit / Hide), Add (a product with a phone photo) and
// Account (shop link to share, UPI ID and QR, state).

export type SellerProductRow = {
  id: number;
  name: string;
  price: number;
  stock: number | null;
  imageUrl: string | null;
  status: 'onSale' | 'waiting' | 'rejected' | 'hidden' | 'draft';
};

// One order as the seller sees it, with the one next step as buttons
export type SellerOrderRow = {
  id: number;
  date: string;
  customerName: string;
  customerPhone: string; // digits with country code, for the call link
  address: string;
  lines: string[]; // "Red Jute Bag × 2 = ₹900"
  total: number;
  status: 'PENDING' | 'PAID' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  payment: 'notYet' | 'check' | 'paid' | 'cancelled';
  reference: string | null;
  actions: ('RECEIVED' | 'NOTRECEIVED' | 'CONFIRM' | 'SHIP' | 'DELIVER')[];
};

export type SellerStats = {
  action: number; // orders waiting for the seller (payment to check, order to confirm)
  toShip: number; // confirmed or shipped, not delivered yet
  delivered: number;
  onSale: number;
  earned: number; // value of delivered orders
};

// Simple line icons for the tab bar and buttons
export const ICON = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  orders: '<path d="M4 7h16l-1.5 12h-13z"/><path d="M8 7a4 4 0 0 1 8 0"/>',
  products: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  add: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/>',
  store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v2a3 3 0 0 1-5.3 2 3 3 0 0 1-5.4 0A3 3 0 0 1 4 11z"/><path d="M5.5 13.5V20h13v-6.5"/><path d="M10 20v-4h4v4"/>',
  userPlus: '<circle cx="10" cy="8" r="4"/><path d="M3 21a7 7 0 0 1 12.5-4.3"/><path d="M19 14v6M16 17h6"/>',
};
export const svg = (paths: string, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export function renderSellerPage(data: {
  language: string;
  token: string;
  shopName: string;
  sellerName: string;
  sellerId: string; // the unique ID
  orders: SellerOrderRow[];
  products: SellerProductRow[];
  stats: SellerStats;
  notice: string | null; // shown at the top after a change ("Product added", "Saved")
  shopLink: string | null; // wa.me link customers open (null when the bot number is not set)
  languages: string; // "English + हिन्दी"
  upiId: string | null;
  qrUrl: string | null;
  shopLanguage: string | null;
  states: { value: string; label: string }[];
}): string {
  const W = dt(data.language);
  const initial = Array.from(data.shopName.trim() || '?')[0].toUpperCase();
  const shareUrl = data.shopLink
    ? `https://wa.me/?text=${encodeURIComponent(W.shareText(data.shopName, data.shopLink))}`
    : null;

  // ---- Orders ----
  const statusLabel = {
    PENDING: W.stPending,
    PAID: W.stPaid,
    CONFIRMED: W.stConfirmed,
    SHIPPED: W.stShipped,
    DELIVERED: W.stDelivered,
    CANCELLED: W.stCancelled,
  };
  const actionLabel = {
    RECEIVED: W.btnReceived,
    NOTRECEIVED: W.btnNotReceived,
    CONFIRM: W.btnConfirm,
    SHIP: W.btnShip,
    DELIVER: W.btnDeliver,
  };
  const paymentText = (o: SellerOrderRow) =>
    o.payment === 'check'
      ? W.payCheck(o.reference)
      : o.payment === 'paid'
        ? W.payPaid
        : o.payment === 'cancelled'
          ? W.payCancelled
          : W.payNotYet;
  // Progress tracker: Ordered → Paid → Confirmed → Shipped → Delivered
  const steps = [W.stepOrdered, W.stPaid, W.stConfirmed, W.stShipped, W.stDelivered];
  const stepIndex = (o: SellerOrderRow) =>
    o.status === 'DELIVERED'
      ? 4
      : o.status === 'SHIPPED'
        ? 3
        : o.status === 'CONFIRMED'
          ? 2
          : o.payment === 'paid'
            ? 1
            : 0;
  const tracker = (o: SellerOrderRow) => {
    if (o.status === 'CANCELLED') return `<div class="cancelled">✖ ${escapeHtml(W.stCancelled)}</div>`;
    const at = stepIndex(o);
    return (
      '<ol class="track">' +
      steps
        .map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"><span></span>${escapeHtml(s)}</li>`)
        .join('') +
      '</ol>'
    );
  };
  const isTodo = (o: SellerOrderRow) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
  const orderCard = (o: SellerOrderRow) =>
    `<article class="card order ${isTodo(o) ? 'todo' : 'closed'}" data-id="${o.id}">` +
    `<div class="ohead"><div><b>#${o.id}</b><span class="date">${escapeHtml(o.date)}</span></div>` +
    `<span class="pill st-${o.status}">${escapeHtml(statusLabel[o.status])}</span></div>` +
    tracker(o) +
    `<ul class="lines">${o.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>` +
    `<div class="total"><span>${escapeHtml(wt(data.language).total)}</span><b>₹${rupees(o.total)}</b></div>` +
    '<div class="cust">' +
    `<div class="who"><b>${escapeHtml(o.customerName)}</b><span>${svg(ICON.pin, 15)} ${escapeHtml(o.address)}</span></div>` +
    `<a class="callbtn" href="tel:+${escapeHtml(o.customerPhone)}">${svg(ICON.phone, 16)} ${escapeHtml(W.call)}</a></div>` +
    `<p class="pay ${o.payment}">${escapeHtml(paymentText(o))}</p>` +
    (o.actions.length
      ? '<div class="acts">' +
        o.actions
          .map(
            (a) =>
              `<button type="button" class="${a === 'NOTRECEIVED' ? 'btn ghost-red' : 'btn primary'}" data-action="${a}">` +
              `${escapeHtml(actionLabel[a])}</button>`
          )
          .join('') +
        '</div>'
      : '') +
    '<p class="msg"></p></article>';

  const needYou = data.orders.filter((o) => o.actions.includes('RECEIVED') || o.actions.includes('CONFIRM'));

  // ---- Products ----
  const statusText = {
    onSale: W.statusOnSale,
    waiting: W.statusWaiting,
    rejected: W.statusRejected,
    hidden: W.statusHidden,
    draft: W.statusDraft,
  };
  const productCard = (p: SellerProductRow) => {
    const canToggle = p.status === 'onSale' || p.status === 'hidden';
    return (
      `<article class="pcard prod" data-id="${p.id}">` +
      '<div class="pimg">' +
      (p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy">` : '') +
      `<span class="badge ${p.status}">${escapeHtml(statusText[p.status])}</span></div>` +
      `<div class="pbody"><p class="pname">${escapeHtml(p.name)}</p>` +
      `<p class="pprice">₹${rupees(p.price)}</p>` +
      `<p class="pstock">${escapeHtml(W.stockLabel(p.stock))}</p>` +
      '<div class="pacts">' +
      `<button type="button" class="btn small outline" data-act="edit">${escapeHtml(W.edit)}</button>` +
      (canToggle
        ? `<button type="button" class="btn small outline" data-act="${p.status === 'onSale' ? 'hide' : 'show'}">` +
          `${escapeHtml(p.status === 'onSale' ? W.hide : W.show)}</button>`
        : '') +
      '</div>' +
      '<div class="editbox" hidden>' +
      `<label>${escapeHtml(W.priceLabel)}</label><input class="eprice" inputmode="decimal" value="${p.price}">` +
      `<label>${escapeHtml(W.stockLabelEdit)}</label><input class="estock" inputmode="numeric" value="${p.stock ?? ''}">` +
      `<button type="button" class="btn primary small" data-act="save">${escapeHtml(W.saveChange)}</button></div>` +
      '<p class="msg"></p></div></article>'
    );
  };

  // ---- Tabs ----
  const tiles =
    '<div class="tiles">' +
    `<a class="tile hot" href="#orders"><b>${data.stats.action}</b><span>${escapeHtml(W.statAction)}</span></a>` +
    `<a class="tile" href="#orders"><b>${data.stats.toShip}</b><span>${escapeHtml(W.statToShip)}</span></a>` +
    `<a class="tile" href="#orders"><b>${data.stats.delivered}</b><span>${escapeHtml(W.statDelivered)}</span></a>` +
    `<a class="tile" href="#products"><b>${data.stats.onSale}</b><span>${escapeHtml(W.statOnSale)}</span></a>` +
    `<div class="tile wide money"><span>${escapeHtml(W.statEarned)}</span><b>₹${rupees(data.stats.earned)}</b></div>` +
    '</div>';

  const home =
    '<section class="tab" id="tab-home">' +
    `<div class="hello"><h2>${escapeHtml(W.hello(data.sellerName))}</h2><p>${escapeHtml(W.helloSub)}</p></div>` +
    (data.upiId ? '' : `<a class="warnbar" href="#account">⚠️ ${escapeHtml(W.noUpiWarn)}</a>`) +
    tiles +
    `<h3 class="sec">${escapeHtml(W.needYou)} (${needYou.length})</h3>` +
    (needYou.length ? needYou.map(orderCard).join('') : `<div class="card empty">${escapeHtml(W.allCaughtUp)}</div>`) +
    `<a class="btn outline block" href="#orders">${escapeHtml(W.seeAll)}</a>` +
    '</section>';

  const orders =
    '<section class="tab" id="tab-orders">' +
    `<h3 class="sec">${escapeHtml(W.ordersTitle)} (${data.orders.length})</h3>` +
    '<div class="chips">' +
    `<button type="button" class="chip on" data-filter="all">${escapeHtml(W.filterAll)}</button>` +
    `<button type="button" class="chip" data-filter="todo">${escapeHtml(W.filterTodo)}</button>` +
    `<button type="button" class="chip" data-filter="closed">${escapeHtml(W.filterDone)}</button></div>` +
    (data.orders.length ? data.orders.map(orderCard).join('') : `<div class="card empty">${escapeHtml(W.noOrders)}</div>`) +
    '</section>';

  const products =
    '<section class="tab" id="tab-products">' +
    `<h3 class="sec">${escapeHtml(W.myProducts)} (${data.products.length})</h3>` +
    (data.products.length
      ? `<div class="grid">${data.products.map(productCard).join('')}</div>`
      : `<div class="card empty">${escapeHtml(W.noProductsYet)}</div>`) +
    `<a class="btn primary block" href="#add">+ ${escapeHtml(W.addProduct)}</a>` +
    '</section>';

  const add =
    '<section class="tab" id="tab-add">' +
    `<h3 class="sec">${escapeHtml(W.addProduct)}</h3><div class="card form">` +
    `<label class="drop" for="photo"><img id="preview" alt="" hidden>` +
    `<span class="dropin">${svg(ICON.camera, 34)}<b>${escapeHtml(W.tapPhoto)}</b></span></label>` +
    '<input id="photo" class="hiddenfile" type="file" accept="image/*">' +
    `<p class="hint">${escapeHtml(W.addProductHint)}</p>` +
    `<label for="pname">${escapeHtml(W.productName)}</label><input id="pname" maxlength="60" autocomplete="off">` +
    `<label for="price">${escapeHtml(W.productPrice)}</label><input id="price" inputmode="decimal" maxlength="9" autocomplete="off" placeholder="250">` +
    `<label for="pdesc">${escapeHtml(W.productDesc)}</label><textarea id="pdesc" maxlength="300"></textarea>` +
    '<p class="msg" id="msg"></p>' +
    `<button type="button" class="btn primary block" id="addbtn">${escapeHtml(W.addBtn)}</button></div>` +
    '</section>';

  const stateOptions = data.states
    .map(
      (s) =>
        `<option value="${escapeHtml(s.value)}"${s.value === data.shopLanguage ? ' selected' : ''}>${escapeHtml(s.label)}</option>`
    )
    .join('');
  const account =
    '<section class="tab" id="tab-account">' +
    '<div class="card profile">' +
    `<div class="bigavatar">${escapeHtml(initial)}</div>` +
    `<div><h2>${escapeHtml(data.shopName)}</h2><p>${escapeHtml(data.sellerName)} · ID ${escapeHtml(data.sellerId)}</p>` +
    `<p class="langs">${escapeHtml(W.sellsIn(data.languages))}</p>` +
    `<span class="pill ${data.upiId ? 'okpill' : 'badpill'}">${escapeHtml(data.upiId ? W.upiReady : W.upiMissing)}</span></div></div>` +
    `<h3 class="sec">${escapeHtml(W.shopLinkTitle)}</h3><div class="card">` +
    (data.shopLink
      ? `<p class="linktext">${escapeHtml(data.shopLink)}</p><p class="hint">${escapeHtml(W.shopLinkHint(data.sellerId))}</p>` +
        `<a class="btn whatsapp block" href="${escapeHtml(shareUrl!)}">${svg(ICON.share, 18)} ${escapeHtml(W.share)}</a>`
      : `<p class="hint">${escapeHtml(W.noBotNumber)}</p>`) +
    '</div>' +
    `<h3 class="sec">${escapeHtml(W.payment)}</h3><div class="card form">` +
    `<label for="upi">${escapeHtml(W.upiLabel)}</label>` +
    `<input id="upi" maxlength="100" autocomplete="off" placeholder="name@okaxis" value="${escapeHtml(data.upiId ?? '')}">` +
    `<p class="msg" id="upimsg"></p><button type="button" class="btn primary block" id="saveupi">${escapeHtml(W.saveUpi)}</button>` +
    `<hr><label for="qr">${escapeHtml(W.qrLabel)}</label><p class="hint">${escapeHtml(W.qrHint)}</p>` +
    (data.qrUrl ? `<img class="qrnow" src="${escapeHtml(data.qrUrl)}" alt="QR">` : '') +
    `<label class="drop small" for="qr"><img id="qrpreview" alt="" hidden><span class="dropin">${svg(ICON.camera, 26)}<b>${escapeHtml(W.tapPhoto)}</b></span></label>` +
    '<input id="qr" class="hiddenfile" type="file" accept="image/*">' +
    `<p class="msg" id="qrmsg"></p><button type="button" class="btn primary block" id="saveqr">${escapeHtml(W.saveQr)}</button>` +
    (data.qrUrl ? `<button type="button" class="btn ghost-red block" id="removeqr">${escapeHtml(W.removeQr)}</button>` : '') +
    '</div>' +
    `<h3 class="sec">${escapeHtml(W.state)}</h3><div class="card form">` +
    `<label for="state">${escapeHtml(W.stateLabel)}</label><select id="state">${stateOptions}</select>` +
    `<p class="msg" id="statemsg"></p><button type="button" class="btn primary block" id="savestate">${escapeHtml(W.saveState)}</button></div>` +
    '</section>';

  const tabbar =
    '<nav class="tabbar">' +
    [
      ['home', W.tabHome, ICON.home],
      ['orders', W.tabOrders, ICON.orders],
      ['products', W.tabProducts, ICON.products],
      ['add', W.tabAdd, ICON.add],
      ['account', W.tabAccount, ICON.account],
    ]
      .map(
        ([id, label, icon]) =>
          `<a href="#${id}" data-tab="${id}">${svg(icon)}<span>${escapeHtml(label)}</span>` +
          (id === 'orders' && data.stats.action ? `<i class="dot">${data.stats.action}</i>` : '') +
          '</a>'
      )
      .join('') +
    '</nav>';

  const script = `
const TOKEN = ${scriptJson(data.token)};
const T = ${scriptJson({
    adding: W.adding,
    addBtn: W.addBtn,
    failed: W.failed,
    expired: W.expired,
    photoMissing: W.photoMissing,
    photoInvalid: W.photoInvalid,
    nameInvalid: W.productNameInvalid,
    priceInvalid: W.priceInvalid,
    stockInvalid: W.stockInvalid,
    upiInvalid: W.upiInvalid,
  })};

// Tabs: the part after # in the address (#orders ...), so a reload stays on the same tab
const TABS = ['home', 'orders', 'products', 'add', 'account'];
function showTab() {
  const t = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
  TABS.forEach((x) => { document.getElementById('tab-' + x).hidden = x !== t; });
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === t));
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', showTab);
showTab();

// Order filters: All / To do / Completed
document.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === c));
  document.querySelectorAll('#tab-orders .order').forEach((o) => {
    o.hidden = c.dataset.filter !== 'all' && !o.classList.contains(c.dataset.filter);
  });
}));

async function post(url, body, msgEl, notice) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ t: TOKEN }, body)),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) {
      location.href = '/seller?t=' + encodeURIComponent(TOKEN) + '&done=' + notice + (location.hash || '');
      return true;
    }
    msgEl.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
  } catch (e) {
    msgEl.textContent = T.failed;
  }
  return false;
}

// Shrink a photo on the phone (longest side 1200 px, JPEG) before uploading
function readPhoto(input, previewEl, msgEl, done) {
  input.addEventListener('change', () => {
    done(null);
    previewEl.hidden = true;
    previewEl.parentElement.classList.remove('has');
    msgEl.textContent = '';
    const file = input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/jpeg', 0.85);
      previewEl.src = data;
      previewEl.hidden = false;
      previewEl.parentElement.classList.add('has');
      URL.revokeObjectURL(url);
      done(data);
    };
    img.onerror = () => { msgEl.textContent = T.photoInvalid; URL.revokeObjectURL(url); };
    img.src = url;
  });
}

// Add a product (then show the Products tab)
let photo = null;
const msg = document.getElementById('msg');
readPhoto(document.getElementById('photo'), document.getElementById('preview'), msg, (d) => { photo = d; });
const addBtn = document.getElementById('addbtn');
addBtn.addEventListener('click', async () => {
  const name = document.getElementById('pname').value.trim();
  const price = Number(document.getElementById('price').value.replace(/[,₹\\s]/g, ''));
  const description = document.getElementById('pdesc').value.trim();
  if (!photo) { msg.textContent = T.photoMissing; return; }
  if (name.length < 2 || name.length > 60) { msg.textContent = T.nameInvalid; return; }
  if (!(price >= 1 && price <= 100000)) { msg.textContent = T.priceInvalid; return; }
  addBtn.disabled = true;
  addBtn.textContent = T.adding;
  history.replaceState(null, '', '#products');
  if (!(await post('/seller/products', { name, price, description, photo }, msg, 'added'))) {
    history.replaceState(null, '', '#add');
    addBtn.disabled = false;
    addBtn.textContent = T.addBtn;
  }
});

// Orders: Money received / Not received, Confirm, Ship, Deliver
document.querySelectorAll('.order').forEach((card) => {
  card.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    card.querySelectorAll('button').forEach((x) => { x.disabled = true; });
    if (!(await post('/seller/orders/' + card.dataset.id, { action: b.dataset.action }, card.querySelector('.msg'), 'saved'))) {
      card.querySelectorAll('button').forEach((x) => { x.disabled = false; });
    }
  });
});

// Products: Edit (price, stock), Hide / Show
document.querySelectorAll('.prod').forEach((card) => {
  const m = card.querySelector('.msg');
  card.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'edit') { const box = card.querySelector('.editbox'); box.hidden = !box.hidden; return; }
    let body;
    if (act === 'save') {
      const price = Number(card.querySelector('.eprice').value.replace(/[,₹\\s]/g, ''));
      const s = card.querySelector('.estock').value.trim();
      const stock = s === '' ? null : Number(s);
      if (!(price >= 1 && price <= 100000)) { m.textContent = T.priceInvalid; return; }
      if (stock !== null && !(Number.isInteger(stock) && stock >= 0 && stock <= 9999)) { m.textContent = T.stockInvalid; return; }
      body = { price, stock };
    } else {
      body = { active: act === 'show' };
    }
    b.disabled = true;
    if (!(await post('/seller/products/' + card.dataset.id, body, m, 'saved'))) b.disabled = false;
  });
});

// UPI ID
document.getElementById('saveupi').addEventListener('click', async (e) => {
  const upi = document.getElementById('upi').value.trim();
  const m = document.getElementById('upimsg');
  if (!/^[A-Za-z0-9._-]{2,64}@[A-Za-z]{2,32}$/.test(upi)) { m.textContent = T.upiInvalid; return; }
  e.target.disabled = true;
  if (!(await post('/seller/settings', { upi }, m, 'saved'))) e.target.disabled = false;
});

// QR photo
let qr = null;
const qrmsg = document.getElementById('qrmsg');
readPhoto(document.getElementById('qr'), document.getElementById('qrpreview'), qrmsg, (d) => { qr = d; });
document.getElementById('saveqr').addEventListener('click', async (e) => {
  if (!qr) { qrmsg.textContent = T.photoMissing; return; }
  e.target.disabled = true;
  if (!(await post('/seller/settings', { qr }, qrmsg, 'saved'))) e.target.disabled = false;
});
const rm = document.getElementById('removeqr');
if (rm) rm.addEventListener('click', async () => {
  rm.disabled = true;
  if (!(await post('/seller/settings', { removeQr: true }, qrmsg, 'saved'))) rm.disabled = false;
});

// State
document.getElementById('savestate').addEventListener('click', async (e) => {
  e.target.disabled = true;
  const shopLanguage = document.getElementById('state').value;
  if (!(await post('/seller/settings', { shopLanguage }, document.getElementById('statemsg'), 'saved'))) e.target.disabled = false;
});

// The "Saved" note disappears after a few seconds
const toast = document.querySelector('.toast');
if (toast) setTimeout(() => toast.classList.add('gone'), 3500);
`;

  return (
    `<!doctype html><html lang="${escapeHtml(data.language)}"><head><meta charset="utf-8">` +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="theme-color" content="#1f3c88">' +
    `<title>${escapeHtml(data.shopName)} · ${escapeHtml(W.sellerTitle)}</title><style>${APP_STYLE}</style></head><body>` +
    '<header class="appbar">' +
    `<div class="avatar">${escapeHtml(initial)}</div>` +
    `<div class="who"><b>${escapeHtml(data.shopName)}</b><span>${escapeHtml(W.sellerTitle)} · ID ${escapeHtml(data.sellerId)}</span></div>` +
    (shareUrl ? `<a class="iconbtn" href="${escapeHtml(shareUrl)}" aria-label="${escapeHtml(W.share)}">${svg(ICON.share)}</a>` : '') +
    '</header>' +
    (data.notice ? `<div class="toast">✅ ${escapeHtml(data.notice)}</div>` : '') +
    `<main>${home}${orders}${products}${add}${account}</main>` +
    tabbar +
    `<script>${script}</script></body></html>`
  );
}

// Shared by the seller and admin dashboards (app look: top bar, cards, bottom tab bar)
export const APP_STYLE = `
:root{--bg:#f1f3f6;--card:#fff;--ink:#1f2937;--muted:#6b7280;--line:#e5e7eb;--brand:#1f3c88;--brand2:#2f5fd0;
--accent:#fb641b;--accent2:#f05a0e;--ok:#15803d;--okbg:#dcfce7;--warn:#b91c1c;--warnbg:#fee2e2;--amber:#b45309;--amberbg:#fef3c7;--blue:#1d4ed8;--bluebg:#dbeafe}
*{box-sizing:border-box}
html{color-scheme:light}
body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",sans-serif;font-size:15px;-webkit-tap-highlight-color:transparent}
a{color:inherit}
.appbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px 16px;background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.18)}
.avatar{width:42px;height:42px;border-radius:50%;background:#ffd34d;color:var(--brand);display:grid;place-items:center;font-weight:800;font-size:1.25rem;flex:none}
.appbar .who{flex:1;min-width:0;display:flex;flex-direction:column}
.appbar .who b{font-size:1.08rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.appbar .who span{font-size:.8rem;opacity:.85}
.iconbtn{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.16);color:#fff;flex:none}
main{max-width:640px;margin:0 auto;padding:12px 12px 96px}
.tab[hidden]{display:none}
.toast{position:fixed;left:50%;top:72px;transform:translateX(-50%);z-index:9;background:#111827;color:#fff;padding:10px 16px;border-radius:999px;font-weight:600;font-size:.9rem;box-shadow:0 6px 18px rgba(0,0,0,.25);transition:opacity .4s}
.toast.gone{opacity:0;pointer-events:none}
.hello{background:var(--card);border-radius:14px;padding:14px 16px;margin-bottom:10px}
.hello h2{margin:0;font-size:1.2rem}
.hello p{margin:2px 0 0;color:var(--muted)}
.warnbar{display:block;text-decoration:none;background:var(--amberbg);color:var(--amber);border-radius:12px;padding:10px 12px;font-weight:600;margin-bottom:10px}
.tiles{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.tile{background:var(--card);border-radius:14px;padding:14px;text-decoration:none;display:flex;flex-direction:column;gap:2px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.tile b{font-size:1.6rem;line-height:1.1}
.tile span{color:var(--muted);font-size:.85rem}
.tile.hot{background:linear-gradient(135deg,#fff7ed,#ffedd5)}
.tile.hot b{color:var(--accent2)}
.tile.wide{grid-column:1/-1;flex-direction:row;justify-content:space-between;align-items:center}
.tile.money{background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff}
.tile.money span{color:#dbe4ff}
@media (min-width:520px){.tiles{grid-template-columns:repeat(4,1fr)}}
.sec{font-size:1rem;margin:18px 4px 8px}
.card{background:var(--card);border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.card.empty{color:var(--muted);text-align:center;padding:22px 14px}
.order[hidden]{display:none}
.ohead{display:flex;justify-content:space-between;align-items:center;gap:8px}
.ohead b{font-size:1.05rem}
.ohead .date{color:var(--muted);font-size:.8rem;margin-left:8px}
.pill{display:inline-block;border-radius:999px;padding:3px 10px;font-size:.78rem;font-weight:700;background:var(--line)}
.st-PENDING,.st-PAID{background:var(--amberbg);color:var(--amber)}
.st-CONFIRMED,.st-SHIPPED{background:var(--bluebg);color:var(--blue)}
.st-DELIVERED{background:var(--okbg);color:var(--ok)}
.st-CANCELLED{background:var(--warnbg);color:var(--warn)}
.track{list-style:none;display:flex;padding:0;margin:14px 0 10px;counter-reset:s}
.track li{flex:1;position:relative;text-align:center;font-size:.68rem;color:var(--muted);padding-top:20px}
.track li span{position:absolute;top:0;left:50%;transform:translateX(-50%);width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #cbd5e1;z-index:1}
.track li::before{content:"";position:absolute;top:6px;left:-50%;width:100%;height:2px;background:#cbd5e1}
.track li:first-child::before{display:none}
.track li.done span,.track li.now span{background:var(--ok);border-color:var(--ok)}
.track li.done::before,.track li.now::before{background:var(--ok)}
.track li.now{color:var(--ink);font-weight:700}
.track li.now span{box-shadow:0 0 0 4px var(--okbg)}
.cancelled{margin:12px 0;color:var(--warn);font-weight:700}
.lines{list-style:none;margin:0;padding:10px 0;border-top:1px dashed var(--line);border-bottom:1px dashed var(--line)}
.lines li{padding:2px 0}
.total{display:flex;justify-content:space-between;align-items:center;padding:8px 0}
.total b{font-size:1.15rem}
.cust{display:flex;gap:10px;align-items:flex-start;justify-content:space-between;background:#f8fafc;border-radius:10px;padding:10px}
.cust .who{display:flex;flex-direction:column;gap:2px;min-width:0}
.cust .who span{color:var(--muted);font-size:.85rem;overflow-wrap:anywhere;display:flex;gap:4px;align-items:flex-start}
.callbtn{display:inline-flex;align-items:center;gap:4px;text-decoration:none;border:1.5px solid var(--ok);color:var(--ok);border-radius:999px;padding:6px 12px;font-weight:700;font-size:.85rem;flex:none}
.pay{margin:10px 0 0;font-weight:600;font-size:.9rem}
.pay.check{background:var(--amberbg);color:var(--amber);border-radius:10px;padding:8px 10px}
.pay.paid{color:var(--ok)}
.pay.notYet{color:var(--muted)}
.acts{display:flex;gap:10px;margin-top:10px}
.acts .btn{flex:1}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:10px;padding:13px 16px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none;text-align:center}
.btn.block{display:flex;width:100%;margin-top:8px}
.btn.primary{background:var(--accent);color:#fff;box-shadow:0 2px 0 var(--accent2)}
.btn.primary:active{transform:translateY(1px);box-shadow:none}
.btn.outline{background:#fff;color:var(--brand2);border:1.5px solid var(--brand2)}
.btn.ghost-red{background:#fff;color:var(--warn);border:1.5px solid var(--warn)}
.btn.whatsapp{background:#25d366;color:#fff}
.btn.small{padding:7px 12px;font-size:.85rem;border-radius:8px}
.btn:disabled{opacity:.5}
.chips{display:flex;gap:8px;margin:0 0 10px;overflow-x:auto}
.chip{border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:7px 14px;font:inherit;font-weight:600;color:var(--muted);white-space:nowrap}
.chip.on{background:var(--brand2);border-color:var(--brand2);color:#fff}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
@media (min-width:560px){.grid{grid-template-columns:repeat(3,1fr)}}
.pcard{background:var(--card);border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.06);display:flex;flex-direction:column}
.pimg{position:relative;aspect-ratio:1/1;background:#eef2f7}
.pimg img{width:100%;height:100%;object-fit:cover;display:block}
.badge{position:absolute;top:8px;left:8px;border-radius:6px;padding:3px 8px;font-size:.72rem;font-weight:700;background:#fff;color:var(--muted);box-shadow:0 1px 3px rgba(0,0,0,.15)}
.badge.onSale{background:var(--ok);color:#fff}
.badge.waiting{background:#f59e0b;color:#fff}
.badge.rejected{background:var(--warn);color:#fff}
.badge.hidden{background:#475569;color:#fff}
.pbody{padding:10px;display:flex;flex-direction:column;gap:2px;flex:1}
.pname{margin:0;font-weight:600;font-size:.9rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.4em}
.pprice{margin:2px 0 0;font-weight:800;font-size:1.05rem}
.pstock{margin:0;color:var(--muted);font-size:.78rem}
.pacts{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.pacts .btn{flex:1}
.editbox{margin-top:8px}
.editbox[hidden]{display:none}
.editbox .btn{width:100%;margin-top:8px}
.form label,.editbox label{display:block;font-weight:600;font-size:.88rem;margin:12px 0 5px}
input,select,textarea{width:100%;border:1.5px solid #d1d5db;border-radius:10px;padding:11px 12px;font:inherit;background:#fff;color:var(--ink)}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--brand2);box-shadow:0 0 0 3px var(--bluebg)}
textarea{min-height:80px;resize:vertical}
.hiddenfile{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.drop{display:grid;place-items:center;min-height:190px;border:2px dashed #c7d2fe;border-radius:14px;background:#f5f7ff;cursor:pointer;overflow:hidden;margin:0;position:relative}
.drop.small{min-height:120px;margin-top:8px}
.drop img{width:100%;max-height:300px;object-fit:contain;display:block}
.drop img[hidden]{display:none}
.drop.has .dropin{display:none}
.dropin{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--brand2);padding:16px;text-align:center}
.hint{color:var(--muted);font-size:.85rem;margin:8px 0 0}
.msg{color:var(--warn);font-size:.88rem;margin:8px 0 0;min-height:0}
.msg:empty{display:none}
hr{border:0;border-top:1px solid var(--line);margin:18px 0 4px}
.qrnow{display:block;width:180px;max-width:100%;border-radius:10px;border:1px solid var(--line);margin:10px 0}
.profile{display:flex;gap:14px;align-items:center}
.bigavatar{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff;display:grid;place-items:center;font-size:1.8rem;font-weight:800;flex:none}
.profile h2{margin:0;font-size:1.15rem}
.profile p{margin:2px 0;color:var(--muted);font-size:.88rem}
.okpill{background:var(--okbg);color:var(--ok);margin-top:4px}
.badpill{background:var(--warnbg);color:var(--warn);margin-top:4px}
.linktext{font-weight:600;overflow-wrap:anywhere;margin:0;color:var(--brand2)}
.tabbar{position:fixed;left:0;right:0;bottom:0;z-index:5;display:flex;background:#fff;border-top:1px solid var(--line);box-shadow:0 -2px 10px rgba(0,0,0,.06);padding-bottom:env(safe-area-inset-bottom)}
.tabbar a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0 7px;text-decoration:none;color:var(--muted);font-size:.72rem;font-weight:600;position:relative}
.tabbar a.on{color:var(--brand2)}
.tabbar a.on svg{stroke-width:2.3}
.tabbar .dot{position:absolute;top:4px;left:calc(50% + 6px);background:var(--accent);color:#fff;border-radius:999px;font-style:normal;font-size:.65rem;min-width:17px;height:17px;display:grid;place-items:center;padding:0 4px}
`;
