import { dt } from './dashText';
import { APP_STYLE, ICON, escapeHtml, rupees, scriptJson, svg } from './pageKit';
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
  lines: { name: string; qty: number; amount: number; imageUrl: string | null }[]; // each product, with its photo
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
  const firstLetter = (name: string) => Array.from(name.trim() || '?')[0].toUpperCase();
  const initial = firstLetter(data.shopName);
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
    `<article class="card order s-${o.status} ${isTodo(o) ? 'todo' : 'closed'}" data-id="${o.id}">` +
    `<div class="ohead"><div><b>#${o.id}</b><span class="date">${escapeHtml(o.date)}</span></div>` +
    `<span class="pill st-${o.status}">${escapeHtml(statusLabel[o.status])}</span></div>` +
    tracker(o) +
    // Each product with its photo, so the seller sees at a glance what to pack
    `<ul class="items">${o.lines
      .map(
        (l) =>
          '<li>' +
          (l.imageUrl ? `<img src="${escapeHtml(l.imageUrl)}" alt="" loading="lazy">` : '<span class="noimg"></span>') +
          `<div><p>${escapeHtml(l.name)}</p><span>× ${l.qty}</span></div><b>₹${rupees(l.amount)}</b></li>`
      )
      .join('')}</ul>` +
    `<div class="total"><span>${escapeHtml(wt(data.language).total)}</span><b>₹${rupees(o.total)}</b></div>` +
    '<div class="cust">' +
    `<span class="cav">${escapeHtml(firstLetter(o.customerName))}</span>` +
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
      `<p class="pstock${p.stock === 0 ? ' none' : p.stock !== null && p.stock <= 3 ? ' low' : ''}">` +
      `${escapeHtml(W.stockLabel(p.stock))}</p>` +
      '<div class="pacts">' +
      `<button type="button" class="btn small outline" data-act="edit">${svg(ICON.edit, 15)} ${escapeHtml(W.edit)}</button>` +
      (canToggle
        ? `<button type="button" class="btn small outline" data-act="${p.status === 'onSale' ? 'hide' : 'show'}">` +
          `${svg(p.status === 'onSale' ? ICON.eyeOff : ICON.eye, 15)} ${escapeHtml(p.status === 'onSale' ? W.hide : W.show)}</button>`
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
  // Home: a blue banner with the greeting and the earnings, three stat cards laid over it,
  // round quick buttons, the orders that need the seller and the latest orders in short
  const stat = (cls: string, icon: string, n: number, label: string, href: string) =>
    `<a class="stat ${cls}" href="${href}"><i>${svg(icon, 20)}</i><b>${n}</b><span>${escapeHtml(label)}</span></a>`;
  const quick = (cls: string, icon: string, label: string, href: string) =>
    `<a class="qa ${cls}" href="${escapeHtml(href)}"><i>${svg(icon, 24)}</i><span>${escapeHtml(label)}</span></a>`;
  const T = wt(data.language);
  const recentRow = (o: SellerOrderRow) => {
    const pic = o.lines.find((l) => l.imageUrl)?.imageUrl;
    const count = o.lines.reduce((n, l) => n + l.qty, 0);
    return (
      `<a class="orow" href="#orders" data-goto="${o.id}">` +
      (pic ? `<img src="${escapeHtml(pic)}" alt="" loading="lazy">` : '<span class="noimg"></span>') +
      `<div class="omid"><b>#${o.id} · ${escapeHtml(o.customerName)}</b>` +
      `<span>${escapeHtml(o.date)} · ${escapeHtml(T.items(count))}</span></div>` +
      `<div class="oright"><b>₹${rupees(o.total)}</b><span class="pill st-${o.status}">${escapeHtml(statusLabel[o.status])}</span></div>` +
      '</a>'
    );
  };

  const home =
    '<section class="tab" id="tab-home">' +
    '<div class="hero">' +
    `<p class="hi">${escapeHtml(W.hello(data.sellerName))}</p><p class="hisub">${escapeHtml(W.helloSub)}</p>` +
    `<div class="earn"><div><span>${escapeHtml(W.statEarned)}</span><b>₹${rupees(data.stats.earned)}</b></div>` +
    `<em>${svg(ICON.check, 16)} ${data.stats.delivered} ${escapeHtml(W.statDelivered)}</em></div></div>` +
    '<div class="stats">' +
    stat('hot', ICON.clock, data.stats.action, W.statAction, '#orders') +
    stat('blue', ICON.truck, data.stats.toShip, W.statToShip, '#orders') +
    stat('green', ICON.tag, data.stats.onSale, W.statOnSale, '#products') +
    '</div>' +
    (data.upiId ? '' : `<a class="warnbar" href="#account">⚠️ ${escapeHtml(W.noUpiWarn)}</a>`) +
    '<div class="card quick">' +
    quick('orange', ICON.plus, W.addProduct, '#add') +
    quick('green', ICON.share, W.share, shareUrl ?? '#account') +
    quick('blue', ICON.qr, W.payment, '#account') +
    quick('purple', ICON.orders, W.tabOrders, '#orders') +
    '</div>' +
    `<h3 class="sec">${escapeHtml(W.needYou)} <span class="count">${needYou.length}</span></h3>` +
    (needYou.length
      ? needYou.map(orderCard).join('')
      : `<div class="card caught">${svg(ICON.check, 30)}<p>${escapeHtml(W.allCaughtUp)}</p></div>`) +
    (data.orders.length
      ? `<div class="sechead"><h3 class="sec">${escapeHtml(W.ordersTitle)}</h3><a href="#orders">${escapeHtml(W.seeAll)} ${svg(ICON.chevron, 16)}</a></div>` +
        `<div class="card list">${data.orders.slice(0, 4).map(recentRow).join('')}</div>`
      : '') +
    '</section>';

  const orders =
    '<section class="tab" id="tab-orders">' +
    `<h3 class="sec">${escapeHtml(W.ordersTitle)} <span class="count">${data.orders.length}</span></h3>` +
    (data.orders.length ? data.orders.map(orderCard).join('') : `<div class="card empty">${escapeHtml(W.noOrders)}</div>`) +
    '</section>';

  const products =
    '<section class="tab" id="tab-products">' +
    `<h3 class="sec">${escapeHtml(W.myProducts)} <span class="count">${data.products.length}</span></h3>` +
    (data.products.length
      ? `<div class="grid">${data.products.map(productCard).join('')}</div>`
      : `<div class="card empty">${escapeHtml(W.noProductsYet)}</div>`) +
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
    '<div class="card pcover"><div class="cover"></div>' +
    `<div class="bigavatar">${escapeHtml(initial)}</div>` +
    `<h2>${escapeHtml(data.shopName)}</h2><p>${escapeHtml(data.sellerName)} · ID ${escapeHtml(data.sellerId)}</p>` +
    `<p class="langs">${svg(ICON.globe, 15)} ${escapeHtml(W.sellsIn(data.languages))}</p>` +
    `<span class="pill ${data.upiId ? 'okpill' : 'badpill'}">${escapeHtml(data.upiId ? W.upiReady : W.upiMissing)}</span></div>` +
    `<h3 class="sec">${svg(ICON.share, 18)} ${escapeHtml(W.shopLinkTitle)}</h3><div class="card">` +
    (data.shopLink
      ? `<p class="linktext">${escapeHtml(data.shopLink)}</p><p class="hint">${escapeHtml(W.shopLinkHint(data.sellerId))}</p>` +
        `<a class="btn whatsapp block" href="${escapeHtml(shareUrl!)}">${svg(ICON.share, 18)} ${escapeHtml(W.share)}</a>`
      : `<p class="hint">${escapeHtml(W.noBotNumber)}</p>`) +
    '</div>' +
    `<h3 class="sec">${svg(ICON.wallet, 18)} ${escapeHtml(W.payment)}</h3><div class="card form">` +
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
    `<h3 class="sec">${svg(ICON.globe, 18)} ${escapeHtml(W.state)}</h3><div class="card form">` +
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
          `<a href="#${id}" data-tab="${id}"${id === 'add' ? ' class="center"' : ''}>` +
          `${id === 'add' ? `<i class="plusbtn">${svg(ICON.plus, 26)}</i>` : svg(icon)}<span>${escapeHtml(label)}</span>` +
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
let shown = '';
function showTab() {
  const t = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
  if (t === shown) return;
  shown = t;
  TABS.forEach((x) => { document.getElementById('tab-' + x).hidden = x !== t; });
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === t));
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', showTab);
showTab();

// A latest order on Home opens the Orders tab at that order
document.querySelectorAll('[data-goto]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = 'orders';
    showTab();
    const card = document.querySelector('#tab-orders .order[data-id="' + a.dataset.goto + '"]');
    if (card) {
      card.scrollIntoView({ block: 'start' });
      window.scrollBy(0, -80);
      card.classList.add('flash');
    }
  });
});

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
    `<title>${escapeHtml(data.shopName)} · ${escapeHtml(W.sellerTitle)}</title><style>${APP_STYLE}${SELLER_STYLE}</style></head><body>` +
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

// The seller dashboard's own look, on top of the shared app look
const SELLER_STYLE = `
.appbar{box-shadow:none}
.sec{display:flex;align-items:center;gap:8px}
.sec svg{color:var(--brand2)}
.count{background:var(--bluebg);color:var(--brand2);border-radius:999px;padding:1px 9px;font-size:.8rem}
.sechead{display:flex;align-items:center;justify-content:space-between}
.sechead a{display:flex;align-items:center;gap:2px;margin:18px 4px 8px;color:var(--brand2);font-weight:700;font-size:.88rem;text-decoration:none}
/* Home: banner, earnings, stat cards over the banner */
.hero{margin:-12px -12px 0;padding:14px 18px 62px;background:linear-gradient(160deg,var(--brand2) 0%,var(--brand) 70%);color:#fff;border-radius:0 0 26px 26px;position:relative;overflow:hidden}
.hero::after{content:"";position:absolute;right:-50px;top:-60px;width:190px;height:190px;border-radius:50%;background:rgba(255,255,255,.07)}
.hero .hi{margin:0;font-size:1.25rem;font-weight:800}
.hero .hisub{margin:2px 0 14px;opacity:.8;font-size:.9rem}
.earn{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:12px 14px;position:relative;z-index:1}
.earn span{display:block;font-size:.82rem;opacity:.85}
.earn b{display:block;font-size:1.9rem;line-height:1.15;letter-spacing:-.01em}
.earn em{font-style:normal;display:flex;align-items:center;gap:4px;font-size:.8rem;background:rgba(255,255,255,.18);border-radius:999px;padding:4px 10px;white-space:nowrap}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:-44px 0 12px;position:relative;z-index:1}
.stat{background:#fff;border-radius:16px;padding:12px 10px;text-decoration:none;display:flex;flex-direction:column;gap:4px;box-shadow:0 6px 18px rgba(16,24,40,.10)}
.stat i{width:36px;height:36px;border-radius:12px;display:grid;place-items:center}
.stat b{font-size:1.45rem;line-height:1.1}
.stat span{color:var(--muted);font-size:.74rem;font-weight:600;line-height:1.2}
.stat.hot i{background:#ffedd5;color:var(--accent2)}
.stat.hot b{color:var(--accent2)}
.stat.blue i{background:var(--bluebg);color:var(--blue)}
.stat.green i{background:var(--okbg);color:var(--ok)}
.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:14px 6px}
.qa{display:flex;flex-direction:column;align-items:center;gap:6px;text-decoration:none;text-align:center}
.qa i{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;color:#fff;box-shadow:0 4px 10px rgba(0,0,0,.12)}
.qa span{font-size:.74rem;font-weight:600;line-height:1.2;color:var(--ink)}
.qa.orange i{background:linear-gradient(135deg,#ff8a3d,var(--accent2))}
.qa.green i{background:linear-gradient(135deg,#34d36b,#16a34a)}
.qa.blue i{background:linear-gradient(135deg,#4f8cff,var(--brand2))}
.qa.purple i{background:linear-gradient(135deg,#a78bfa,#7c3aed)}
.caught{display:flex;align-items:center;gap:12px;color:var(--ok);background:linear-gradient(135deg,#f0fdf4,#dcfce7)}
.caught p{margin:0;color:#166534;font-weight:600}
.card.list{padding:4px 14px}
.orow{display:flex;align-items:center;gap:12px;padding:10px 0;text-decoration:none;border-bottom:1px solid var(--line)}
.orow:last-child{border-bottom:0}
.orow img,.orow .noimg{width:48px;height:48px;border-radius:12px;object-fit:cover;background:#eef2f7;flex:none}
.omid{flex:1;min-width:0;display:flex;flex-direction:column}
.omid b{font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.omid span{color:var(--muted);font-size:.78rem}
.oright{display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.oright .pill{font-size:.68rem;padding:2px 8px}
/* Orders: a colour stripe for the status, the customer's initial */
.order{border-left:4px solid var(--line);transition:box-shadow .3s}
.order.s-PENDING,.order.s-PAID{border-left-color:#f59e0b}
.order.s-CONFIRMED,.order.s-SHIPPED{border-left-color:var(--brand2)}
.order.s-DELIVERED{border-left-color:#22c55e}
.order.s-CANCELLED{border-left-color:#ef4444}
.order.flash{box-shadow:0 0 0 3px var(--bluebg),0 6px 18px rgba(16,24,40,.12)}
.cust{align-items:center}
.cav{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#7c3aed);color:#fff;display:grid;place-items:center;font-weight:800;flex:none}
.cust .who{flex:1}
/* Products */
.pcard{box-shadow:0 2px 10px rgba(16,24,40,.07)}
.pstock{font-weight:600}
.pstock.low{color:var(--amber)}
.pstock.none{color:var(--warn)}
.pacts .btn{gap:4px;padding:7px 6px}
/* Account: profile with a colour cover */
.pcover{padding:0 14px 16px;text-align:center;overflow:hidden}
.cover{height:76px;margin:0 -14px;background:linear-gradient(135deg,var(--brand2),var(--brand) 60%,#7c3aed)}
.pcover .bigavatar{width:76px;height:76px;margin:-38px auto 8px;border:4px solid #fff;background:#ffd34d;color:var(--brand);font-size:2rem;box-shadow:0 4px 12px rgba(0,0,0,.15)}
.pcover h2{margin:0;font-size:1.2rem}
.pcover p{margin:2px 0;color:var(--muted);font-size:.88rem}
.pcover .langs{display:flex;align-items:center;justify-content:center;gap:4px}
.pcover .pill{margin-top:8px}
/* Tab bar with a raised round Add button in the middle */
.tabbar{border-top:0;box-shadow:0 -4px 16px rgba(16,24,40,.08)}
.tabbar a.on::after{content:"";position:absolute;top:0;left:30%;right:30%;height:3px;border-radius:0 0 3px 3px;background:var(--brand2)}
.tabbar a.center::after{display:none}
.plusbtn{margin-top:-24px;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#ff8a3d,var(--accent2));border:4px solid #fff;box-shadow:0 6px 14px rgba(240,90,14,.4)}
.tabbar a.center{color:var(--ink)}
`;
