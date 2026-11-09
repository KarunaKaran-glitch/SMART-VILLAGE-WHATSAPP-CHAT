import { dt } from './dashText';
import { APP_STYLE, DASH_STYLE, ICON, escapeHtml, rupees, scriptJson, svg } from './pageKit';
import { firstLetter, orderView, type SellerOrderRow } from './sellerPage';

// The admin dashboard (opened from the admin's [Click here] button), in the same app style as the
// seller dashboard: a top bar, a bottom tab bar, and five tabs: Home (banner, stat cards and the next
// products to check), Approve (every waiting product with photo, Approve / Reject), Add seller (the
// form that gives a seller a unique ID), Sellers (each seller with ID, call and "send ID on WhatsApp")
// and Orders (every shop's orders, to look at).

export type AdminSellerRow = {
  id: string; // the seller's unique ID (shop code)
  name: string;
  shopName: string;
  phone: string;
  state: string; // shown text, for example "Odisha (ଓଡ଼ିଆ + हिन्दी + English)"
  category: string;
  products: number;
  waiting: number;
  shopLink: string | null;
};

export type AdminWaitingProduct = {
  id: number;
  name: string;
  price: string; // already formatted, for example "1,500"
  description: string | null;
  imageUrl: string | null;
  shop: string; // "Malathy Bags (ID 5915)"
};

// A seller changed the name of an approved product: shown to the admin once, until "OK, seen"
export type AdminRename = {
  id: number;
  oldName: string; // the name the admin saw before
  newName: string; // the name customers see now
  price: string;
  imageUrl: string | null;
  shop: string;
};

export function renderAdminPage(data: {
  language: string;
  token: string;
  waiting: AdminWaitingProduct[];
  renames: AdminRename[];
  stateKey: string; // where every order is now, in short: the page checks it for changes
  stats: { sellers: number; orders: number; sales: string };
  states: { value: string; label: string; languages: string }[]; // languages: "অসমীয়া + हिन्दी + English"
  categories: { id: number; name: string }[];
  sellers: AdminSellerRow[];
  orders: SellerOrderRow[]; // every shop's orders, newest open ones first
  created: { shopName: string; id: string } | null; // just added (shown at the top of Sellers)
  botNumber: string; // shown as "+15556478208", or '' when not set
}): string {
  const W = dt(data.language);

  // ---- Products to check ----
  const checkCard = (p: AdminWaitingProduct) =>
    `<article class="card check" data-id="${p.id}">` +
    (p.imageUrl
      ? `<div class="bigimg"><img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy">` +
        `<span class="waitchip">${svg(ICON.clock, 14)} ${escapeHtml(W.statusWaiting)}</span></div>`
      : '') +
    `<div class="ohead"><b>${escapeHtml(p.name)}</b><span class="pprice">₹${escapeHtml(p.price)}</span></div>` +
    (p.description ? `<p class="hint">${escapeHtml(p.description)}</p>` : '') +
    `<p class="shopline">${svg(ICON.store, 16)} ${escapeHtml(p.shop)} · #${p.id}</p>` +
    '<p class="msg"></p>' +
    `<div class="acts two"><button type="button" class="btn approve" data-ok="1">✓ ${escapeHtml(W.approve)}</button>` +
    `<button type="button" class="btn ghost-red" data-ok="0">✕ ${escapeHtml(W.reject)}</button></div></article>`;

  // A name change: the product's photo, the old name crossed out, the new name, [OK, seen]
  const renameCard = (p: AdminRename) =>
    `<article class="card rename" data-id="${p.id}">` +
    '<div class="rnrow">' +
    (p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy">` : '<span class="noimg"></span>') +
    `<div class="rnnames"><span class="waitchip">${svg(ICON.edit, 13)} ${escapeHtml(W.nameChangeChip)}</span>` +
    `<small>${escapeHtml(W.oldName)}</small><s>${escapeHtml(p.oldName)}</s>` +
    `<small>${escapeHtml(W.newName)}</small><b>${escapeHtml(p.newName)}</b></div></div>` +
    `<p class="shopline">${svg(ICON.store, 16)} ${escapeHtml(p.shop)} · #${p.id} · ₹${escapeHtml(p.price)}</p>` +
    '<p class="msg"></p>' +
    `<div class="acts"><button type="button" class="btn primary block" data-ok="1">✓ ${escapeHtml(W.seenBtn)}</button></div></article>`;
  const toCheck = data.waiting.length + data.renames.length;

  // ---- Sellers ----
  const sellerCard = (s: AdminSellerRow) => {
    const tell = `https://wa.me/${s.phone}?text=${encodeURIComponent(W.tellId(s.shopName, s.id, data.botNumber))}`;
    const initial = Array.from(s.shopName.trim() || '?')[0].toUpperCase();
    return (
      `<article class="card seller${data.created?.id === s.id ? ' fresh' : ''}">` +
      '<div class="srow">' +
      `<div class="savatar">${escapeHtml(initial)}</div>` +
      `<div class="sinfo"><b>${escapeHtml(s.shopName)}</b><span>${escapeHtml(s.name)} · +${escapeHtml(s.phone)}</span></div>` +
      `<span class="idchip">ID ${escapeHtml(s.id)}</span></div>` +
      '<div class="facts">' +
      `<span>${svg(ICON.globe, 15)} ${escapeHtml(s.state)}</span>` +
      `<span>${svg(ICON.tag, 15)} ${escapeHtml(s.category)}</span>` +
      `<span>${svg(ICON.products, 15)} ${escapeHtml(W.productCount(s.products, s.waiting))}</span></div>` +
      (s.shopLink ? `<p class="linktext small">${escapeHtml(s.shopLink)}</p>` : '') +
      '<div class="acts two">' +
      `<a class="callbtn" href="tel:+${escapeHtml(s.phone)}">${svg(ICON.phone, 16)} ${escapeHtml(W.call)}</a>` +
      `<a class="btn whatsapp small" href="${escapeHtml(tell)}">${svg(ICON.share, 16)} ${escapeHtml(W.sendId)}</a></div>` +
      `<button type="button" class="btn ghost-red block removeseller" data-code="${escapeHtml(s.id)}" data-ask="${escapeHtml(W.removeSellerAsk(s.shopName))}">${escapeHtml(W.removeSeller)}</button>` +
      '<p class="msg"></p>' +
      '</article>'
    );
  };

  // ---- Tabs ----
  // Home: a blue banner with the total sales, three stat cards laid over it, round quick buttons,
  // the next products to check (a sideways strip) and the newest sellers in short
  const stat = (cls: string, icon: string, n: number, label: string, href: string) =>
    `<a class="stat ${cls}" href="${href}"><i>${svg(icon, 20)}</i><b>${n}</b><span>${escapeHtml(label)}</span></a>`;
  const quick = (cls: string, icon: string, label: string, href: string) =>
    `<a class="qa ${cls}" href="${href}"><i>${svg(icon, 24)}</i><span>${escapeHtml(label)}</span></a>`;
  const sellerRow = (s: AdminSellerRow) =>
    '<a class="orow" href="#sellers">' +
    `<span class="savatar small">${escapeHtml(firstLetter(s.shopName))}</span>` +
    `<div class="omid"><b>${escapeHtml(s.shopName)}</b><span>${escapeHtml(s.name)} · ${escapeHtml(W.productCount(s.products, s.waiting))}</span></div>` +
    `<div class="oright"><span class="idchip">ID ${escapeHtml(s.id)}</span></div></a>`;

  const home =
    '<section class="tab" id="tab-home">' +
    '<div class="hero">' +
    `<p class="hi">${escapeHtml(W.adminHello)}</p><p class="hisub">${escapeHtml(W.adminSub)}</p>` +
    `<div class="earn"><div><span>${escapeHtml(W.statSales)}</span><b>₹${escapeHtml(data.stats.sales)}</b></div>` +
    `<a href="#orders"><em>${svg(ICON.orders, 16)} ${data.stats.orders} ${escapeHtml(W.statOrders)} ${svg(ICON.chevron, 14)}</em></a></div></div>` +
    '<div class="stats">' +
    stat('hot', ICON.clock, toCheck, W.statToApprove, '#approve') +
    stat('blue', ICON.store, data.stats.sellers, W.statSellers, '#sellers') +
    stat('green', ICON.orders, data.stats.orders, W.statOrders, '#orders') +
    '</div>' +
    '<div class="card quick three">' +
    quick('orange', ICON.check, W.tabApprove, '#approve') +
    quick('green', ICON.userPlus, W.addSeller, '#addseller') +
    quick('blue', ICON.store, W.sellers, '#sellers') +
    '</div>' +
    (data.waiting.length
      ? `<div class="sechead"><h3 class="sec">${escapeHtml(W.nextToApprove)} <span class="count">${data.waiting.length}</span></h3>` +
        `<a href="#approve">${escapeHtml(W.seeMore)} ${svg(ICON.chevron, 16)}</a></div>` +
        '<div class="minis">' +
        data.waiting
          .slice(0, 6)
          .map(
            (p) =>
              `<a class="mini" href="#approve">` +
              (p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy">` : '<span class="noimg"></span>') +
              `<span>${escapeHtml(p.name)}</span><b>₹${escapeHtml(p.price)}</b></a>`
          )
          .join('') +
        '</div>'
      : `<h3 class="sec">${escapeHtml(W.nextToApprove)} <span class="count">0</span></h3>` +
        `<div class="card caught">${svg(ICON.check, 30)}<p>${escapeHtml(W.noProductsWaiting)}</p></div>`) +
    (data.sellers.length
      ? `<div class="sechead"><h3 class="sec">${escapeHtml(W.sellers)} <span class="count">${data.sellers.length}</span></h3>` +
        `<a href="#sellers">${escapeHtml(W.seeMore)} ${svg(ICON.chevron, 16)}</a></div>` +
        `<div class="card list">${data.sellers.slice(0, 4).map(sellerRow).join('')}</div>`
      : '') +
    '</section>';

  const approve =
    '<section class="tab" id="tab-approve">' +
    `<h3 class="sec">${escapeHtml(W.productsWaiting)} <span class="count">${data.waiting.length}</span></h3>` +
    (data.waiting.length
      ? data.waiting.map(checkCard).join('')
      : `<div class="card caught">${svg(ICON.check, 30)}<p>${escapeHtml(W.noProductsWaiting)}</p></div>`) +
    (data.renames.length
      ? `<h3 class="sec">${escapeHtml(W.nameChanges)} <span class="count">${data.renames.length}</span></h3>` +
        data.renames.map(renameCard).join('')
      : '') +
    '</section>';

  const sellers =
    '<section class="tab" id="tab-sellers">' +
    (data.created
      ? `<div class="card created"><b>✅ ${escapeHtml(W.created(data.created.shopName, data.created.id))}</b>` +
        `<p class="hint">${escapeHtml(W.tellSeller(data.created.id, data.botNumber || 'the bot'))}</p></div>`
      : '') +
    `<h3 class="sec">${escapeHtml(W.sellers)} <span class="count">${data.sellers.length}</span></h3>` +
    (data.sellers.length ? data.sellers.map(sellerCard).join('') : `<div class="card empty">${escapeHtml(W.noSellers)}</div>`) +
    `<a class="btn primary block" href="#addseller">+ ${escapeHtml(W.addSeller)}</a>` +
    '</section>';

  const options = (list: { value: string; label: string }[]) =>
    list.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
  const addSeller =
    '<section class="tab" id="tab-addseller">' +
    `<h3 class="sec">${escapeHtml(W.addSeller)}</h3><div class="card form">` +
    `<div class="formhead"><i>${svg(ICON.userPlus, 26)}</i><p class="hint">${escapeHtml(W.addHint)}</p></div>` +
    `<label for="name">${escapeHtml(W.sellerName)}</label><input id="name" maxlength="60" autocomplete="off">` +
    `<label for="phone">${escapeHtml(W.phone)}</label><input id="phone" inputmode="numeric" maxlength="16" autocomplete="off" placeholder="9876543210">` +
    `<label for="shop">${escapeHtml(W.shopName)}</label><input id="shop" maxlength="40" autocomplete="off">` +
    // State (A to Z), then the languages its customers get: the state's own first, Hindi, English
    `<label for="state">${escapeHtml(W.state)}</label><select id="state">` +
    `<option value="" selected disabled>${escapeHtml(W.chooseState)}</option>` +
    data.states
      .map((o) => `<option value="${escapeHtml(o.value)}" data-langs="${escapeHtml(o.languages)}">${escapeHtml(o.label)}</option>`)
      .join('') +
    '</select>' +
    `<label>${escapeHtml(W.customerLanguages)}</label><div class="langbox"><div class="langs" id="langs"></div>` +
    `<p class="hint">${svg(ICON.globe, 14)} ${escapeHtml(W.languagesHint)}</p></div>` +
    // What they make: the list, or "Others" with a box to type a new product type
    `<label for="category">${escapeHtml(W.category)}</label><select id="category">` +
    `<option value="" selected disabled>${escapeHtml(W.chooseCategory)}</option>` +
    options(data.categories.map((c) => ({ value: String(c.id), label: c.name }))) +
    `<option value="other">${escapeHtml(W.otherCategory)}</option></select>` +
    `<input id="newcat" maxlength="24" autocomplete="off" placeholder="${escapeHtml(W.otherHint)}" hidden>` +
    '<p class="msg" id="msg"></p>' +
    `<button type="button" class="btn primary block" id="save">${escapeHtml(W.save)}</button></div>` +
    '</section>';

  // Open orders can be cancelled by the admin, for example when a seller stops answering
  const cancelButton = (o: SellerOrderRow) =>
    o.status === 'DELIVERED' || o.status === 'CANCELLED'
      ? ''
      : '<p class="msg"></p>' +
        `<button type="button" class="btn ghost-red block cancelorder" data-id="${o.id}" data-ask="${escapeHtml(
          o.payment === 'paid' || o.payment === 'check' ? W.cancelOrderAskPaid(o.id, rupees(o.total)) : W.cancelOrderAsk(o.id)
        )}">${escapeHtml(W.cancelOrder)}</button>`;

  // Every shop's orders, to look at (the sellers move them on from their own dashboards)
  const orders =
    '<section class="tab" id="tab-orders">' +
    `<h3 class="sec">${escapeHtml(W.ordersTitle)} <span class="count">${data.orders.length}</span></h3>` +
    (data.orders.length
      ? data.orders.map((o) => `<article class="card order s-${o.status}" data-id="${o.id}">${orderView(o, data.language, true)}${cancelButton(o)}</article>`).join('')
      : `<div class="card empty">${escapeHtml(W.noOrders)}</div>`) +
    '</section>';

  const tabbar =
    '<nav class="tabbar">' +
    [
      ['home', W.tabHome, ICON.home],
      ['approve', W.tabApprove, ICON.check],
      ['addseller', W.tabAddSeller, ICON.userPlus],
      ['sellers', W.tabSellers, ICON.store],
      ['orders', W.tabOrders, ICON.orders],
    ]
      .map(
        ([id, label, icon]) =>
          `<a href="#${id}" data-tab="${id}"${id === 'addseller' ? ' class="center"' : ''}>` +
          `${id === 'addseller' ? `<i class="plusbtn">${svg(ICON.plus, 26)}</i>` : svg(icon)}<span>${escapeHtml(label)}</span>` +
          (id === 'approve' && toCheck ? `<i class="dot">${toCheck}</i>` : '') +
          '</a>'
      )
      .join('') +
    '</nav>';

  const script = `
const TOKEN = ${scriptJson(data.token)};
const T = ${scriptJson({
    saving: W.saving,
    save: W.save,
    failed: W.failed,
    expired: W.expired,
    approvedNote: W.approvedNote,
    rejectedNote: W.rejectedNote,
    seenNote: W.seenNote,
  })};

// Tabs: the part after # in the address, so a reload stays on the same tab
const TABS = ['home', 'approve', 'addseller', 'sellers', 'orders'];
function showTab() {
  const t = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
  TABS.forEach((x) => { document.getElementById('tab-' + x).hidden = x !== t; });
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === t));
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', showTab);
showTab();

// Orders move on while the page is open (the seller taps Money received, Confirm, Ship,
// Deliver). Every 5 seconds the page asks whether anything changed, and at once when the admin
// comes back to it. Then only the Orders and Home parts and the tab badges are fetched and
// swapped in: no page reload, so the tab, the scroll position and a half-filled form stay.
let NOW = ${scriptJson(data.stateKey)};
let checking = false;
async function checkOrders() {
  if (checking) return;
  checking = true;
  try {
    const res = await fetch('/admin/state?t=' + encodeURIComponent(TOKEN), { cache: 'no-store' });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.v && out.v !== NOW) {
      const page = await fetch('/admin?t=' + encodeURIComponent(TOKEN), { cache: 'no-store' });
      if (page.ok) {
        const doc = new DOMParser().parseFromString(await page.text(), 'text/html');
        const before = new Map([...document.querySelectorAll('#tab-orders .order')].map((c) => [c.dataset.id, c.className]));
        ['tab-home', 'tab-orders'].forEach((id) => {
          const fresh = doc.getElementById(id);
          if (fresh) document.getElementById(id).innerHTML = fresh.innerHTML;
        });
        document.querySelectorAll('.tabbar a').forEach((a) => {
          const fresh = doc.querySelector('.tabbar a[data-tab="' + a.dataset.tab + '"]');
          if (fresh) a.innerHTML = fresh.innerHTML;
        });
        // Briefly mark the orders that are new or moved to another step
        document.querySelectorAll('#tab-orders .order').forEach((c) => {
          if (before.get(c.dataset.id) !== c.className) c.classList.add('flash');
        });
        NOW = out.v;
      }
    }
  } catch (e) {}
  checking = false;
}
setInterval(checkOrders, 5000);
document.addEventListener('visibilitychange', checkOrders);
window.addEventListener('focus', checkOrders);

// Approve / Reject a waiting product, or "OK, seen" on a name change; the card then shows it
document.querySelectorAll('.check, .rename').forEach((card) => {
  const rename = card.classList.contains('rename');
  card.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const approve = b.dataset.ok === '1';
    const note = card.querySelector('.msg');
    card.querySelectorAll('button').forEach((x) => { x.disabled = true; });
    try {
      const res = await fetch('/admin/products/' + card.dataset.id + (rename ? '/name' : ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: TOKEN, approve }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) {
        card.querySelector('.acts').remove();
        card.classList.add(approve ? 'decided-ok' : 'decided-no');
        if (rename) { card.classList.add('decided-ok'); note.textContent = '✅ ' + T.seenNote; return; }
        note.textContent = (approve ? '✅ ' : '✖️ ') + (approve ? T.approvedNote : T.rejectedNote);
        return;
      }
      note.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
    } catch (err) {
      note.textContent = T.failed;
    }
    card.querySelectorAll('button').forEach((x) => { x.disabled = false; });
  });
});

// Cancel an order, after asking. Listens on the whole page: the order cards get replaced when
// orders move on (see checkOrders).
document.addEventListener('click', async (e) => {
  const b = e.target.closest && e.target.closest('.cancelorder');
  if (!b || !confirm(b.dataset.ask)) return;
  const note = b.parentElement.querySelector('.msg');
  note.textContent = '';
  b.disabled = true;
  try {
    const res = await fetch('/admin/orders/' + b.dataset.id + '/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: TOKEN }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) { location.reload(); return; }
    note.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
  } catch (err) {
    note.textContent = T.failed;
  }
  b.disabled = false;
});

// Remove a seller, after asking; the page then loads again without them
document.querySelectorAll('.removeseller').forEach((b) => {
  b.addEventListener('click', async () => {
    if (!confirm(b.dataset.ask)) return;
    const note = b.parentElement.querySelector('.msg');
    note.textContent = '';
    b.disabled = true;
    try {
      const res = await fetch('/admin/sellers/' + encodeURIComponent(b.dataset.code) + '/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: TOKEN }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) { location.reload(); return; }
      note.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
    } catch (err) {
      note.textContent = T.failed;
    }
    b.disabled = false;
  });
});

// Add a seller, then show the Sellers tab with the new seller's ID
// The state shows its customer languages as numbered chips (1 = the state's language)
const state = document.getElementById('state');
const langs = document.getElementById('langs');
function showLangs() {
  const opt = state.selectedOptions[0];
  const list = opt && opt.dataset.langs ? opt.dataset.langs.split(' + ') : [];
  langs.innerHTML = list.map((l, i) => '<span' + (i === 0 && list.length > 2 ? ' class="local"' : '') + '><i>' + (i + 1) + '</i>' + l + '</span>').join('');
  langs.hidden = !list.length;
}
state.addEventListener('change', showLangs);
showLangs();
// "Others": a box to type the product type
const category = document.getElementById('category');
const newcat = document.getElementById('newcat');
category.addEventListener('change', () => {
  newcat.hidden = category.value !== 'other';
  if (!newcat.hidden) newcat.focus();
});
const btn = document.getElementById('save');
const msg = document.getElementById('msg');
btn.addEventListener('click', async () => {
  const body = {
    t: TOKEN,
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.replace(/\\D/g, ''),
    shopName: document.getElementById('shop').value.trim(),
    sellerState: state.value,
    categoryId: category.value === 'other' ? null : Number(category.value) || null,
    newCategory: category.value === 'other' ? newcat.value.trim() : '',
  };
  msg.textContent = '';
  btn.disabled = true;
  btn.textContent = T.saving;
  try {
    const res = await fetch('/admin/sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) {
      location.href = '/admin?t=' + encodeURIComponent(TOKEN) + '&new=' + encodeURIComponent(out.id) + '#sellers';
      return;
    }
    msg.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
  } catch (e) {
    msg.textContent = T.failed;
  }
  btn.disabled = false;
  btn.textContent = T.save;
});
`;

  return (
    `<!doctype html><html lang="${escapeHtml(data.language)}"><head><meta charset="utf-8">` +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="theme-color" content="#1f3c88">' +
    `<title>${escapeHtml(W.adminTitle)}</title><style>${APP_STYLE}${DASH_STYLE}${ADMIN_STYLE}</style></head><body>` +
    '<header class="appbar">' +
    `<div class="avatar">${svg(ICON.check, 24)}</div>` +
    `<div class="who"><b>${escapeHtml(W.adminTitle)}</b><span>Smart Village</span></div>` +
    '</header>' +
    `<main>${home}${approve}${sellers}${addSeller}${orders}</main>` +
    tabbar +
    `<script>${script}</script></body></html>`
  );
}

const ADMIN_STYLE = `
.langbox{background:#f8fafc;border:1.5px dashed #d6dce5;border-radius:12px;padding:10px 12px}
.langs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
.langs[hidden]{display:none}
.langs span{display:flex;align-items:center;gap:6px;background:#fff;border:1.5px solid var(--line);border-radius:999px;padding:5px 12px 5px 5px;font-weight:700;font-size:.9rem}
.langs span.local{border-color:var(--brand2);background:var(--bluebg);color:var(--brand2)}
.langs i{font-style:normal;width:22px;height:22px;border-radius:50%;background:var(--brand2);color:#fff;display:grid;place-items:center;font-size:.75rem}
.langbox .hint{margin:0;display:flex;gap:6px;align-items:flex-start}
.langbox .hint svg{flex:none;margin-top:2px}
#newcat{margin-top:8px}
#newcat[hidden]{display:none}
.bigimg{margin:-14px -14px 12px;background:#eef2f7;aspect-ratio:4/3;overflow:hidden;border-radius:14px 14px 0 0}
.bigimg img{width:100%;height:100%;object-fit:contain;display:block}
.pprice{font-weight:800;font-size:1.1rem;white-space:nowrap}
.shopline{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:.85rem;margin:8px 0 0}
.two{display:flex;gap:10px;margin-top:12px}
.two>*{flex:1}
.btn.approve{background:var(--ok);color:#fff}
.decided-ok{outline:2px solid var(--ok)}
.decided-no{outline:2px solid var(--warn);opacity:.85}
.check .msg{color:var(--ink);font-weight:700}
.minis{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.mini{background:var(--card);border-radius:14px;overflow:hidden;text-decoration:none;display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.mini img,.mini .noimg{width:100%;aspect-ratio:1/1;object-fit:cover;background:#eef2f7;display:block}
.mini span{padding:8px 10px 0;font-weight:600;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mini b{padding:2px 10px 10px}
.srow{display:flex;align-items:center;gap:12px}
.savatar{width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff;display:grid;place-items:center;font-weight:800;font-size:1.2rem;flex:none}
.sinfo{flex:1;min-width:0;display:flex;flex-direction:column}
.sinfo b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sinfo span{color:var(--muted);font-size:.85rem}
.idchip{background:var(--accent);color:#fff;border-radius:999px;padding:4px 10px;font-weight:800;font-size:.85rem;white-space:nowrap}
.seller .hint{margin:6px 0 0}
.seller .callbtn{justify-content:center}
.removeseller,.cancelorder{margin-top:10px}
.order>.msg:empty{display:none}
.seller .msg:empty{display:none}
.linktext.small{font-size:.8rem;margin-top:6px}
.seller.fresh{outline:2px solid var(--ok)}
.created{border-left:5px solid var(--ok)}
.formhead{display:flex;gap:12px;align-items:flex-start;color:var(--brand2)}
.formhead .hint{margin:0}
.formhead svg{flex:none}
.tabbar a{font-size:.7rem}
.bigimg{position:relative}
.waitchip{position:absolute;top:10px;left:10px;display:flex;align-items:center;gap:4px;background:#f59e0b;color:#fff;border-radius:999px;padding:4px 10px;font-size:.75rem;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.15)}
.check{border-left:4px solid #f59e0b;box-shadow:0 2px 10px rgba(16,24,40,.07)}
.check .ohead b{font-size:1.05rem}
.check .two .btn{padding:13px 10px}
.rename{border-left:4px solid #6366f1;box-shadow:0 2px 10px rgba(16,24,40,.07)}
.rename .msg{color:var(--ink);font-weight:700}
.rename .two .btn{padding:13px 10px}
.rnrow{display:flex;gap:12px;align-items:flex-start}
.rnrow img,.rnrow .noimg{width:84px;height:84px;border-radius:12px;object-fit:cover;flex:none;background:var(--line)}
.rnnames{display:flex;flex-direction:column;gap:1px;min-width:0}
.rnnames .waitchip{position:static;align-self:flex-start;background:#6366f1;margin-bottom:6px}
.rnnames small{color:var(--muted);font-size:.72rem;margin-top:4px}
.rnnames s{color:var(--muted)}
.rnnames b{font-size:1.05rem;color:var(--ink)}
.decided-ok{border-left-color:var(--ok)}
.decided-no{border-left-color:var(--warn)}
.minis{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 8px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.minis::-webkit-scrollbar{display:none}
.mini{flex:0 0 42%;scroll-snap-align:start;box-shadow:0 2px 10px rgba(16,24,40,.08)}
.savatar.small{width:44px;height:44px;font-size:1.1rem}
.orow .idchip{font-size:.75rem;padding:3px 9px}
.seller{box-shadow:0 2px 10px rgba(16,24,40,.07)}
.facts{display:flex;flex-direction:column;gap:5px;margin:12px 0 0;padding:10px 12px;background:#f8fafc;border-radius:10px}
.facts span{display:flex;align-items:center;gap:8px;color:#374151;font-size:.85rem}
.facts svg{color:var(--brand2);flex:none}
.formhead i{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;color:#fff;flex:none;background:linear-gradient(135deg,#34d36b,#16a34a);box-shadow:0 4px 10px rgba(0,0,0,.12)}
@media (min-width:1024px){
#tab-approve,#tab-sellers{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;align-items:start}
#tab-approve>.sec,#tab-approve>.caught,#tab-sellers>.sec,#tab-sellers>.created,#tab-sellers>.btn,#tab-sellers>.empty{grid-column:1/-1;margin-bottom:0}
#tab-sellers>.btn{justify-self:start;width:auto;padding:13px 28px}
.check,.seller{margin:0}
.mini{flex:0 0 200px}
.tabbar a{font-size:.95rem}
}
`;
