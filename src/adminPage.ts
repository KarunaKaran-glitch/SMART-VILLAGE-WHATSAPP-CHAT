import { dt } from './dashText';
import { APP_STYLE, DASH_STYLE, ICON, escapeHtml, scriptJson, svg } from './pageKit';
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
  state: string; // shown text, for example "Odisha (English + ଓଡ଼ିଆ)"
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

export function renderAdminPage(data: {
  language: string;
  token: string;
  waiting: AdminWaitingProduct[];
  stats: { sellers: number; orders: number; sales: string };
  states: { value: string; label: string }[];
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
    stat('hot', ICON.clock, data.waiting.length, W.statToApprove, '#approve') +
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
    `<label for="state">${escapeHtml(W.state)}</label><select id="state">${options(data.states)}</select>` +
    `<label for="category">${escapeHtml(W.category)}</label><select id="category">` +
    options(data.categories.map((c) => ({ value: String(c.id), label: c.name }))) +
    '</select><p class="msg" id="msg"></p>' +
    `<button type="button" class="btn primary block" id="save">${escapeHtml(W.save)}</button></div>` +
    '</section>';

  // Every shop's orders, to look at (the sellers move them on from their own dashboards)
  const orders =
    '<section class="tab" id="tab-orders">' +
    `<h3 class="sec">${escapeHtml(W.ordersTitle)} <span class="count">${data.orders.length}</span></h3>` +
    (data.orders.length
      ? data.orders.map((o) => `<article class="card order s-${o.status}">${orderView(o, data.language, true)}</article>`).join('')
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
          (id === 'approve' && data.waiting.length ? `<i class="dot">${data.waiting.length}</i>` : '') +
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

// Approve / Reject a waiting product; the card then shows the decision
document.querySelectorAll('.check').forEach((card) => {
  card.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const approve = b.dataset.ok === '1';
    const note = card.querySelector('.msg');
    card.querySelectorAll('button').forEach((x) => { x.disabled = true; });
    try {
      const res = await fetch('/admin/products/' + card.dataset.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: TOKEN, approve }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) {
        card.querySelector('.acts').remove();
        card.classList.add(approve ? 'decided-ok' : 'decided-no');
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

// Add a seller, then show the Sellers tab with the new seller's ID
const btn = document.getElementById('save');
const msg = document.getElementById('msg');
btn.addEventListener('click', async () => {
  const body = {
    t: TOKEN,
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.replace(/\\D/g, ''),
    shopName: document.getElementById('shop').value.trim(),
    shopLanguage: document.getElementById('state').value,
    categoryId: Number(document.getElementById('category').value),
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
`;
