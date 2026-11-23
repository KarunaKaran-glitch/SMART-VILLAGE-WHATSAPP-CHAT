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

// The customer uploaded a screenshot, the seller says the money did not arrive: the admin decides
export type AdminDispute = {
  orderId: number;
  amount: string;
  customerName: string;
  customerPhone: string;
  sellerPhone: string;
  shop: string;
  proofUrl: string;
};

// Statistics tab: one row per village, and every seller with a score out of 100
export type VillageStat = {
  state: string;
  village: string;
  sellers: number;
  orders: number;
  sales: string;
  salesValue: number;
  best: { id: string; shop: string; score: number } | null;
  worst: { id: string; shop: string; score: number } | null; // only with 2 or more sellers
};
export type SellerStat = {
  id: string;
  shop: string;
  name: string;
  state: string;
  village: string;
  score: number;
  sales: string;
  salesValue: number;
  orders: number;
  delivered: number;
  speedHours: number | null; // money received -> shipped, on average
  late: number; // orders waiting for the seller too long
  complaints: number;
  products: number; // approved and on sale
  lastActiveDays: number | null;
  badge: 'best' | 'worst' | null; // in their village
  warnings: number; // sent by the admin
  lastWarningDays: number | null;
};

// ---- Charts for the Statistics tab, drawn here as SVG (no library; they also print)
// Village colours in a fixed order (checked for colour-blind readers); every chart also has
// labels with the numbers, and the tables below show the same data.
const VILLAGE_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];
const STATUS_COLORS = { delivered: '#1f9254', active: '#2a78d6', waiting: '#eda100', cancelled: '#9a9893' };
type Part = { label: string; value: number; text: string; color: string; href?: string };

function donutChart(parts: Part[], center: string, centerSub: string, empty: string, title: string): string {
  const total = parts.reduce((n, p) => n + p.value, 0);
  const R = 80, r = 50, C = 90;
  const at = (angle: number, radius: number) => `${(C + radius * Math.sin(angle)).toFixed(2)} ${(C - radius * Math.cos(angle)).toFixed(2)}`;
  const pct = (v: number) => (total ? Math.round((v * 100) / total) : 0);
  const live = parts.filter((p) => p.value > 0);
  let rings = '';
  if (!total) {
    rings = `<circle cx="${C}" cy="${C}" r="${(R + r) / 2}" fill="none" stroke="#e9edf3" stroke-width="${R - r}"/>`;
  } else if (live.length === 1) {
    rings = `<circle cx="${C}" cy="${C}" r="${(R + r) / 2}" fill="none" stroke="${live[0].color}" stroke-width="${R - r}"><title>${escapeHtml(`${live[0].label}: ${live[0].text} (100%)`)}</title></circle>`;
  } else {
    let start = 0;
    for (const p of live) {
      const end = start + (2 * Math.PI * p.value) / total;
      const large = end - start > Math.PI ? 1 : 0;
      const slice =
        `<path d="M ${at(start, R)} A ${R} ${R} 0 ${large} 1 ${at(end, R)} L ${at(end, r)} A ${r} ${r} 0 ${large} 0 ${at(start, r)} Z" ` +
        `fill="${p.color}" stroke="#fff" stroke-width="2"><title>${escapeHtml(`${p.label}: ${p.text} (${pct(p.value)}%)`)}</title></path>`;
      rings += p.href ? `<a href="${escapeHtml(p.href)}">${slice}</a>` : slice;
      start = end;
    }
  }
  const svgPart =
    `<svg class="donut" viewBox="0 0 180 180" role="img" aria-label="${escapeHtml(title)}">${rings}` +
    `<text x="${C}" y="${C + 2}" text-anchor="middle" class="dbig">${escapeHtml(total ? center : '0')}</text>` +
    `<text x="${C}" y="${C + 22}" text-anchor="middle" class="dsmall">${escapeHtml(centerSub)}</text></svg>`;
  const legend =
    '<ul class="legend">' +
    parts
      .map(
        (p) =>
          (p.href ? `<li><a class="lg" href="${escapeHtml(p.href)}">` : '<li><span class="lg">') +
          `<i style="background:${p.color}"></i><span>${escapeHtml(p.label)}</span>` +
          `<b>${escapeHtml(p.text)}</b><em>${total ? `${pct(p.value)}%` : ''}</em>` +
          (p.href ? '</a></li>' : '</span></li>')
      )
      .join('') +
    '</ul>';
  return `<div class="donutwrap">${svgPart}${legend}</div>` + (total ? '' : `<p class="hint nodata">${escapeHtml(empty)}</p>`);
}

function columnChart(items: { label: string; value: number; color: string; href?: string }[], title: string): string {
  const W = 340, H = 210, top = 26, bottom = 40, side = 6;
  const base = H - bottom, plot = base - top;
  const slot = (W - side * 2) / items.length;
  const bw = Math.min(40, slot * 0.55);
  const max = Math.max(1, ...items.map((i) => i.value));
  const bars = items
    .map((it, i) => {
      const h = it.value ? Math.max(3, (it.value / max) * plot) : 0;
      const x = side + i * slot + (slot - bw) / 2;
      const y = base - h;
      const cx = (x + bw / 2).toFixed(1);
      // rounded top corners, flat on the baseline
      const rr = Math.min(4, h);
      const shape = h
        ? `<path d="M ${x.toFixed(1)} ${base} V ${(y + rr).toFixed(1)} Q ${x.toFixed(1)} ${y.toFixed(1)} ${(x + rr).toFixed(1)} ${y.toFixed(1)} H ${(x + bw - rr).toFixed(1)} Q ${(x + bw).toFixed(1)} ${y.toFixed(1)} ${(x + bw).toFixed(1)} ${(y + rr).toFixed(1)} V ${base} Z" fill="${it.color}"><title>${escapeHtml(`${it.label}: ${it.value}`)}</title></path>`
        : '';
      const bar =
        // a clear hit area over the whole column, so a short bar is easy to tap too
        `<rect x="${(side + i * slot).toFixed(1)}" y="${top - 20}" width="${slot.toFixed(1)}" height="${plot + 44}" fill="transparent"/>` +
        shape +
        `<text x="${cx}" y="${(y - 7).toFixed(1)}" text-anchor="middle" class="cval">${it.value}</text>` +
        `<text x="${cx}" y="${base + 17}" text-anchor="middle" class="clab">${escapeHtml(it.label)}</text>`;
      return it.href ? `<a href="${escapeHtml(it.href)}">${bar}</a>` : bar;
    })
    .join('');
  return (
    `<svg class="columns" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(title)}">` +
    `<line x1="${side}" y1="${base}" x2="${W - side}" y2="${base}" stroke="#d6dce5" stroke-width="1"/>${bars}</svg>`
  );
}

export function renderAdminPage(data: {
  language: string;
  token: string;
  account: { adminCode: string; hasPassword: boolean; loginUrl: string };
  sellerStats: {
    period: '30' | 'all';
    villages: VillageStat[];
    sellers: SellerStat[];
    statusCounts: { delivered: number; active: number; waiting: number; cancelled: number };
  };
  waiting: AdminWaitingProduct[];
  renames: AdminRename[];
  stateKey: string; // where every order is now, in short: the page checks it for changes
  stats: { sellers: number; orders: number; sales: string };
  states: { value: string; label: string; languages: string }[]; // languages: "অসমীয়া + हिन्दी + English"
  categories: { id: number; name: string }[];
  sellers: AdminSellerRow[];
  orders: SellerOrderRow[]; // every shop's orders, newest open ones first
  disputes: AdminDispute[];
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

  // ---- My account: Admin ID, website login, password, log out
  const ac = data.account;
  const pwField = (id: string, label: string, auto: string) =>
    `<label for="${id}">${escapeHtml(label)}</label><input id="${id}" type="password" maxlength="72" autocomplete="${auto}">`;
  const account =
    `<h3 class="sec">${escapeHtml(W.accountTitle)}</h3>` +
    '<div class="card form account">' +
    `<div class="accrow"><span>${escapeHtml(W.adminIdLabel)}</span><b id="admincode">${escapeHtml(ac.adminCode)}</b></div>` +
    `<div class="accrow"><span>${escapeHtml(W.loginAtLabel)}</span><a href="${escapeHtml(ac.loginUrl)}" target="_blank" rel="noopener">${escapeHtml(ac.loginUrl.replace(/^https?:\/\//, ''))}</a></div>` +
    `<details id="pwbox"${ac.hasPassword ? '' : ' open'}><summary>${escapeHtml(ac.hasPassword ? W.changePasswordTitle : W.setPasswordTitle)}</summary>` +
    (ac.hasPassword ? '' : `<p class="hint">${escapeHtml(W.setPasswordHint)}</p>`) +
    (ac.hasPassword ? pwField('pwold', W.oldPassword, 'current-password') : '') +
    pwField('pwnew', W.newPassword, 'new-password') +
    pwField('pwnew2', W.repeatPassword, 'new-password') +
    `<p class="msg" id="pwmsg"></p><button type="button" class="btn primary block" id="pwsave">${escapeHtml(W.savePassword)}</button></details>` +
    `<button type="button" class="btn outline block" id="logout">${escapeHtml(W.logout)}</button>` +
    '</div>';

  const home =
    '<section class="tab" id="tab-home">' +
    (data.disputes.length
      ? `<a class="card disputealert" href="#orders">⚠️ ${escapeHtml(W.disputeAlert(data.disputes.length))} ${svg(ICON.chevron, 16)}</a>`
      : '') +
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
    account +
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

  // A payment complaint: the screenshot, who to call, and the admin's two answers
  const disputeCard = (d: AdminDispute) =>
    `<article class="card disputecard" data-id="${d.orderId}">` +
    `<div class="ohead"><div><b>#${d.orderId}</b></div><b>₹${escapeHtml(d.amount)}</b></div>` +
    `<p class="shopline">${svg(ICON.store, 16)} ${escapeHtml(d.shop)}</p>` +
    `<p>${escapeHtml(W.disputeText(d.customerName, d.amount))}</p>` +
    `<a href="${escapeHtml(d.proofUrl)}" target="_blank" rel="noopener"><img src="${escapeHtml(d.proofUrl)}" alt="" loading="lazy"></a>` +
    '<div class="acts two">' +
    `<a class="callbtn" href="tel:+${escapeHtml(d.customerPhone)}">${svg(ICON.phone, 16)} ${escapeHtml(W.callCustomer)}</a>` +
    `<a class="callbtn" href="tel:+${escapeHtml(d.sellerPhone)}">${svg(ICON.phone, 16)} ${escapeHtml(W.callSeller)}</a></div>` +
    '<p class="msg"></p>' +
    '<div class="acts two">' +
    `<button type="button" class="btn approve" data-paid="1" data-ask="${escapeHtml(W.disputeAskPaid(d.orderId))}">✓ ${escapeHtml(W.disputePaidBtn)}</button>` +
    `<button type="button" class="btn ghost-red" data-paid="0" data-ask="${escapeHtml(W.disputeAskNotPaid(d.orderId))}">✕ ${escapeHtml(W.disputeNotPaidBtn)}</button></div></article>`;

  // Every shop's orders, to look at (the sellers move them on from their own dashboards)
  const orders =
    '<section class="tab" id="tab-orders">' +
    (data.disputes.length
      ? `<h3 class="sec">⚠️ ${escapeHtml(W.disputeTitle)} <span class="count">${data.disputes.length}</span></h3>` +
        data.disputes.map(disputeCard).join('')
      : '') +
    `<h3 class="sec">${escapeHtml(W.ordersTitle)} <span class="count" id="ocount">${data.orders.length}</span></h3>` +
    // Filters (also opened from the Statistics tab): status, and village / seller / last days
    '<div class="ofilter">' +
    (
      [
        ['', W.fAll],
        ['delivered', W.stDelivered],
        ['active', W.stActive],
        ['waiting', W.stWaiting],
        ['cancelled', W.stCancelled],
      ] as const
    )
      .map(([g, label]) => `<a data-g="${g}" href="#orders${g ? `?g=${g}` : ''}">${escapeHtml(label)}</a>`)
      .join('') +
    '</div><p class="otags" id="otags" hidden></p>' +
    `<div class="card empty" id="onone" hidden>${escapeHtml(W.noOrdersHere)}</div>` +
    (data.orders.length
      ? data.orders
          .map(
            (o) =>
              `<article class="card order s-${o.status}" data-id="${o.id}" data-g="${o.group}" data-v="${escapeHtml(o.village)}" ` +
              `data-s="${escapeHtml(o.shopCode)}" data-shop="${escapeHtml(o.shop)}" data-age="${o.ageDays}">${orderView(o, data.language, true)}</article>`
          )
          .join('')
      : `<div class="card empty">${escapeHtml(W.noOrders)}</div>`) +
    '</section>';

  // ---- Statistics: villages, then every seller by score
  const ss = data.sellerStats;
  const ordersLink = (f: { g?: string; v?: string; s?: string }) => {
    const q = new URLSearchParams();
    if (f.g) q.set('g', f.g);
    if (f.v) q.set('v', f.v);
    if (f.s) q.set('s', f.s);
    if (ss.period === '30') q.set('d', '30');
    const qs = q.toString();
    return '#orders' + (qs ? '?' + qs : '');
  };
  const level = (n: number) => (n >= 70 ? 'good' : n >= 40 ? 'mid' : 'low');
  const periodLink = (p: '30' | 'all', label: string) =>
    `<a class="${ss.period === p ? 'on' : ''}" href="?t=${escapeHtml(encodeURIComponent(data.token))}&amp;period=${p}#stats">${escapeHtml(label)}</a>`;
  const pickCell = (x: VillageStat['best'], cls: string, empty: string) =>
    x
      ? `<td><a class="who ${cls}" href="${escapeHtml(ordersLink({ s: x.id }))}"><b>${escapeHtml(x.shop)}</b><small>ID ${escapeHtml(x.id)} · ${x.score}/100</small></a></td>`
      : `<td><small class="muted">${escapeHtml(empty)}</small></td>`;
  const villageRow = (v: VillageStat) =>
    '<tr>' +
    `<th scope="row"><a href="${escapeHtml(ordersLink({ v: v.village }))}"><b>${escapeHtml(v.village)}</b><small>${escapeHtml(v.state)}</small></a></th>` +
    `<td class="num">${v.sellers}</td>` +
    `<td class="num"><a href="${escapeHtml(ordersLink({ v: v.village }))}">${v.orders}</a></td>` +
    `<td class="num"><a href="${escapeHtml(ordersLink({ g: 'delivered', v: v.village }))}">₹${escapeHtml(v.sales)}</a></td>` +
    pickCell(v.best, 'best', W.noSellersYet) +
    pickCell(v.worst, 'worst', v.sellers ? W.needTwoSellers : W.noSellersYet) +
    '</tr>';
  const sellerStatRow = (r: SellerStat, i: number) =>
    `<tr class="${r.badge ?? ''}">` +
    `<td class="num rank">${i + 1}</td>` +
    `<th scope="row"><a href="${escapeHtml(ordersLink({ s: r.id }))}"><b>${escapeHtml(r.shop)}</b>` +
    (r.badge ? ` <em class="rankchip ${r.badge}">${escapeHtml(r.badge === 'best' ? W.badgeBest : W.badgeWorst)}</em>` : '') +
    `<small>ID ${escapeHtml(r.id)}</small></a></th>` +
    `<td>${escapeHtml(r.village || r.state || '—')}</td>` +
    `<td class="scorecell"><span class="score ${level(r.score)}"><i style="width:${r.score}%"></i></span><b class="scorenum">${r.score}</b></td>` +
    `<td class="num"><a href="${escapeHtml(ordersLink({ g: 'delivered', s: r.id }))}">₹${escapeHtml(r.sales)}</a></td>` +
    `<td class="num"><a href="${escapeHtml(ordersLink({ s: r.id }))}">${r.orders}</a></td>` +
    `<td class="num"><a href="${escapeHtml(ordersLink({ g: 'delivered', s: r.id }))}">${r.delivered}</a></td>` +
    `<td class="num${r.late ? ' bad' : ''}">${r.late}</td><td class="num${r.complaints ? ' bad' : ''}">${r.complaints}</td>` +
    // Warnings: how many, Warn, and Remove seller in red after 2
    '<td><div class="warnbox">' +
    `<span class="warncount w${Math.min(r.warnings, 2)}" title="${escapeHtml(r.lastWarningDays === null ? '' : W.lastActive(r.lastWarningDays))}">${r.warnings}</span>` +
    `<button type="button" class="warnbtn" data-code="${escapeHtml(r.id)}" data-ask="${escapeHtml(W.warnAsk(r.shop, r.warnings + 1))}">⚠️ ${escapeHtml(W.sendWarning)}</button>` +
    (r.warnings >= 2
      ? `<button type="button" class="rmbtn removeseller" data-code="${escapeHtml(r.id)}" data-ask="${escapeHtml(W.removeSellerAsk(r.shop))}">${escapeHtml(W.removeSeller)}</button>`
      : '') +
    '<p class="msg"></p></div></td>' +
    '</tr>';
  // A heading over a number column is lined up on the right, like the numbers
  const head = (cols: (string | [string, 'num'])[]) =>
    `<thead><tr>${cols.map((x) => (Array.isArray(x) ? `<th scope="col" class="num">${escapeHtml(x[0])}</th>` : `<th scope="col">${escapeHtml(x)}</th>`)).join('')}</tr></thead>`;
  const statsTab =
    '<section class="tab" id="tab-stats">' +
    `<h3 class="sec">${escapeHtml(W.statsTitle)}</h3><p class="hint statsub">${escapeHtml(W.statsSub)}</p>` +
    `<div class="periods">${periodLink('30', W.period30)}${periodLink('all', W.periodAll)}</div>` +
    // Four big numbers, then the charts, then the tables with the same numbers
    '<div class="kpis">' +
    [
      [W.colSellers, String(ss.sellers.length), '#sellers'],
      [W.colOrders, String(Object.values(ss.statusCounts).reduce((n, v) => n + v, 0)), ordersLink({})],
      [W.colSales, `₹${ss.villages.reduce((n, v) => n + v.salesValue, 0).toLocaleString('en-IN')}`, ordersLink({ g: 'delivered' })],
      [W.colDelivered, String(ss.statusCounts.delivered), ordersLink({ g: 'delivered' })],
    ]
      .map(([label, value, href]) => `<a class="card kpi" href="${escapeHtml(href)}"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></a>`)
      .join('') +
    '</div>' +
    '<div class="charts">' +
    `<div class="card chart"><h4>${escapeHtml(W.chartStatus)}</h4>` +
    donutChart(
      (
        [
          ['delivered', W.stDelivered],
          ['active', W.stActive],
          ['waiting', W.stWaiting],
          ['cancelled', W.stCancelled],
        ] as const
      ).map(([k, label]) => ({ label, value: ss.statusCounts[k], text: String(ss.statusCounts[k]), color: STATUS_COLORS[k], href: ordersLink({ g: k }) })),
      String(Object.values(ss.statusCounts).reduce((n, v) => n + v, 0)),
      W.allOrdersWord,
      W.noDataYet,
      W.chartStatus
    ) +
    '</div>' +
    `<div class="card chart"><h4>${escapeHtml(W.chartSalesVillage)}</h4>` +
    donutChart(
      ss.villages.map((v, i) => ({
        label: v.village,
        value: v.salesValue,
        text: `₹${v.sales}`,
        color: VILLAGE_COLORS[i % VILLAGE_COLORS.length],
        href: ordersLink({ g: 'delivered', v: v.village }),
      })),
      `₹${ss.villages.reduce((n, v) => n + v.salesValue, 0).toLocaleString('en-IN')}`,
      W.totalSalesWord,
      W.noDataYet,
      W.chartSalesVillage
    ) +
    '</div>' +
    `<div class="card chart"><h4>${escapeHtml(W.chartOrdersVillage)}</h4>` +
    columnChart(ss.villages.map((v) => ({ label: v.village, value: v.orders, color: '#2a78d6', href: ordersLink({ v: v.village }) })), W.chartOrdersVillage) +
    '</div>' +
    `<div class="card chart"><h4>${escapeHtml(W.chartScores)}</h4>` +
    (ss.sellers.length
      ? '<div class="meters">' +
        ss.sellers
          .slice(0, 10)
          .map(
            (r) =>
              `<a class="meter" href="${escapeHtml(ordersLink({ s: r.id }))}"><span class="mname"><b>${escapeHtml(r.shop)}</b>` +
              (r.badge ? ` <em class="rankchip ${r.badge}">${escapeHtml(r.badge === 'best' ? W.badgeBest : W.badgeWorst)}</em>` : '') +
              `<small>${escapeHtml(r.village || r.state || '')}</small></span>` +
              `<span class="mtrack" title="${escapeHtml(`${r.shop}: ${r.score}/100`)}"><i class="${level(r.score)}" style="width:${Math.max(r.score, 2)}%"></i></span>` +
              `<b class="mval">${r.score}</b></a>`
          )
          .join('') +
        '</div>' +
        (ss.sellers.length > 10 ? `<p class="hint">${escapeHtml(W.moreInTable(ss.sellers.length - 10))}</p>` : '')
      : `<p class="hint nodata">${escapeHtml(W.noDataYet)}</p>`) +
    '</div>' +
    '</div>' +
    `<h3 class="sec">${escapeHtml(W.villagesTitle)}</h3>` +
    `<div class="card tablewrap"><table class="stattable villages">${head([W.colVillage, [W.colSellers, 'num'], [W.colOrders, 'num'], [W.colSales, 'num'], W.colBest, W.colWorst])}` +
    `<tbody>${ss.villages.map(villageRow).join('')}</tbody></table></div>` +
    `<h3 class="sec">${escapeHtml(W.sellersByScore)} <span class="count">${ss.sellers.length}</span></h3>` +
    (ss.sellers.length
      ? `<div class="card tablewrap"><table class="stattable sellers">${head([['#', 'num'], W.colSeller, W.colVillage, W.colScore, [W.colSales, 'num'], [W.colOrders, 'num'], [W.colDelivered, 'num'], [W.colLate, 'num'], [W.colComplaints, 'num'], W.colWarnings])}` +
        `<tbody>${ss.sellers.map(sellerStatRow).join('')}</tbody></table></div>`
      : `<div class="card empty">${escapeHtml(W.noStatsSellers)}</div>`) +
    '</section>';

  const tabbar =
    '<nav class="tabbar">' +
    [
      ['home', W.tabHome, ICON.home],
      ['approve', W.tabApprove, ICON.check],
      ['addseller', W.tabAddSeller, ICON.userPlus],
      ['stats', W.tabStats, ICON.chart],
      ['sellers', W.tabSellers, ICON.store],
      ['orders', W.tabOrders, ICON.orders],
    ]
      .map(
        ([id, label, icon]) =>
          `<a href="#${id}" data-tab="${id}"${id === 'addseller' ? ' class="center"' : ''}>` +
          `${id === 'addseller' ? `<i class="plusbtn">${svg(ICON.plus, 26)}</i>` : svg(icon)}<span>${escapeHtml(label)}</span>` +
          (id === 'approve' && toCheck ? `<i class="dot">${toCheck}</i>` : '') +
          (id === 'orders' && data.disputes.length ? `<i class="dot">${data.disputes.length}</i>` : '') +
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
    passwordShort: W.passwordShort,
    passwordMismatch: W.passwordMismatch,
    passwordSaved: W.passwordSaved,
    clearFilter: W.clearFilter,
    last30: W.period30,
  })};
T.lastDays = (d) => (d === 30 ? T.last30 : d + ' d');

// My account: set or change the password, log out. Listens on the whole page: Home is
// replaced when something changes (see checkOrders).
document.addEventListener('click', async (e) => {
  const t = e.target.closest && e.target.closest('#pwsave, #logout');
  if (!t) return;
  if (t.id === 'logout') {
    try { await fetch('/admin/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: TOKEN }) }); } catch {}
    location.replace('/admin/login?out=1');
    return;
  }
  const note = document.getElementById('pwmsg');
  const old = document.getElementById('pwold'), pw = document.getElementById('pwnew').value, pw2 = document.getElementById('pwnew2').value;
  note.className = 'msg';
  if (pw.length < 8 || pw.length > 72) { note.textContent = T.passwordShort; return; }
  if (pw !== pw2) { note.textContent = T.passwordMismatch; return; }
  t.disabled = true;
  try {
    const res = await fetch('/admin/password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: TOKEN, old: old ? old.value : undefined, password: pw }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      note.className = 'msg ok'; note.textContent = T.passwordSaved;
      document.querySelectorAll('#pwbox input').forEach((i) => { i.value = ''; });
    } else note.textContent = res.status === 403 ? T.expired : j.error || T.failed;
  } catch { note.textContent = T.failed; }
  t.disabled = false;
});

// Tabs: the part after # in the address, so a reload stays on the same tab
const TABS = ['home', 'approve', 'addseller', 'stats', 'sellers', 'orders'];
// "#orders?g=delivered&v=Kusunpur&d=30": the tab, then the Orders filters
function hashParts() {
  const h = location.hash.slice(1), i = h.indexOf('?');
  return { tab: i < 0 ? h : h.slice(0, i), q: new URLSearchParams(i < 0 ? '' : h.slice(i + 1)) };
}
// Show only the orders that match: status group, village, seller, last days
function applyOrderFilter() {
  const q = hashParts().q, g = q.get('g') || '', v = q.get('v') || '', s = q.get('s') || '', d = Number(q.get('d') || 0);
  let n = 0;
  document.querySelectorAll('#tab-orders .order').forEach((c) => {
    const ok = (!g || c.dataset.g === g) && (!v || c.dataset.v === v) && (!s || c.dataset.s === s) && (!d || Number(c.dataset.age) < d);
    c.hidden = !ok;
    if (ok) n++;
  });
  const count = document.getElementById('ocount');
  if (count) count.textContent = n;
  const none = document.getElementById('onone');
  if (none) none.hidden = n > 0;
  // status buttons keep the other filters
  document.querySelectorAll('#tab-orders .ofilter a').forEach((a) => {
    const p = new URLSearchParams(q);
    if (a.dataset.g) p.set('g', a.dataset.g); else p.delete('g');
    a.href = '#orders' + (p.toString() ? '?' + p : '');
    a.classList.toggle('on', (a.dataset.g || '') === g);
  });
  const tags = document.getElementById('otags');
  if (tags) {
    const shopCard = s && document.querySelector('#tab-orders .order[data-s="' + CSS.escape(s) + '"]');
    const parts = [v, s ? (shopCard ? shopCard.dataset.shop : 'ID ' + s) : '', d ? T.lastDays(d) : ''].filter(Boolean);
    tags.hidden = !parts.length;
    tags.innerHTML = '';
    if (parts.length) {
      tags.append(parts.join(' · ') + ' ');
      const clear = document.createElement('a');
      const p = new URLSearchParams(); if (g) p.set('g', g);
      clear.href = '#orders' + (p.toString() ? '?' + p : '');
      clear.textContent = '✕ ' + T.clearFilter;
      tags.append(clear);
    }
  }
}
function showTab() {
  const h = hashParts().tab;
  const t = TABS.includes(h) ? h : 'home';
  TABS.forEach((x) => { document.getElementById('tab-' + x).hidden = x !== t; });
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === t));
  applyOrderFilter();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', showTab);
showTab();

// Things change while the page is open: a seller sends a product to approve, a seller moves
// an order on, a customer pays. Every 5 seconds the page asks whether anything changed, and at
// once when the admin comes back to it. Then the tabs are fetched again and swapped in: no page
// reload, so the tab and the scroll position stay. Add seller is never swapped, and neither is a
// tab with something typed in it (it is tried again on the next check).
let NOW = ${scriptJson(data.stateKey)};
let checking = false;
const LIVE_TABS = ['tab-home', 'tab-approve', 'tab-stats', 'tab-sellers', 'tab-orders'];
const typing = (el) => [...el.querySelectorAll('input, textarea')].some((i) => i.value || i === document.activeElement);
async function checkOrders() {
  if (checking) return;
  checking = true;
  try {
    const res = await fetch('/admin/state?t=' + encodeURIComponent(TOKEN), { cache: 'no-store' });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.v && out.v !== NOW) {
      // the same address (keeps Last 30 days / All time)
      const page = await fetch('/admin' + location.search, { cache: 'no-store' });
      if (page.ok) {
        const doc = new DOMParser().parseFromString(await page.text(), 'text/html');
        const before = new Map([...document.querySelectorAll('#tab-orders .order')].map((c) => [c.dataset.id, c.className]));
        let all = true;
        LIVE_TABS.forEach((id) => {
          const fresh = doc.getElementById(id), now = document.getElementById(id);
          if (!fresh || !now) return;
          if (typing(now)) { all = false; return; }
          now.innerHTML = fresh.innerHTML;
        });
        document.querySelectorAll('.tabbar a').forEach((a) => {
          const fresh = doc.querySelector('.tabbar a[data-tab="' + a.dataset.tab + '"]');
          if (fresh) a.innerHTML = fresh.innerHTML;
        });
        // Briefly mark the orders that are new or moved to another step
        document.querySelectorAll('#tab-orders .order').forEach((c) => {
          if (before.get(c.dataset.id) !== c.className) c.classList.add('flash');
        });
        applyOrderFilter();
        if (all) NOW = out.v;
      }
    }
  } catch (e) {}
  checking = false;
}
setInterval(checkOrders, 5000);
document.addEventListener('visibilitychange', checkOrders);
window.addEventListener('focus', checkOrders);

// Approve / Reject a waiting product, or "OK, seen" on a name change; the card then shows it.
// Listens on the whole page: new cards come in without a reload.
document.addEventListener('click', async (e) => {
  const b = e.target.closest && e.target.closest('.check .acts button, .rename .acts button');
  if (!b) return;
  const card = b.closest('.check, .rename');
  const rename = card.classList.contains('rename');
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
      const chip = card.querySelector('.waitchip');
      if (chip) chip.remove();
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

// Decide a payment complaint, after asking. Listens on the whole page: the cards get replaced
// when orders move on (see checkOrders).
document.addEventListener('click', async (e) => {
  const b = e.target.closest && e.target.closest('.disputecard button');
  if (!b || !confirm(b.dataset.ask)) return;
  const card = b.closest('.disputecard');
  const note = card.querySelector('.msg');
  note.textContent = '';
  card.querySelectorAll('button').forEach((x) => { x.disabled = true; });
  try {
    const res = await fetch('/admin/orders/' + card.dataset.id + '/complaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: TOKEN, paid: b.dataset.paid === '1' }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) { location.reload(); return; }
    note.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
  } catch (err) {
    note.textContent = T.failed;
  }
  card.querySelectorAll('button').forEach((x) => { x.disabled = false; });
});

// Warn a seller (Statistics tab) or remove a seller, after asking; the page then loads again.
// Listens on the whole page: the tabs are replaced when something changes.
document.addEventListener('click', async (e) => {
  const b = e.target.closest && e.target.closest('.warnbtn, .removeseller');
  if (!b || !confirm(b.dataset.ask)) return;
  const note = b.parentElement.querySelector('.msg');
  if (note) note.textContent = '';
  b.disabled = true;
  try {
    const res = await fetch('/admin/sellers/' + encodeURIComponent(b.dataset.code) + (b.classList.contains('warnbtn') ? '/warn' : '/remove'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: TOKEN }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) { location.reload(); return; }
    if (note) note.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
  } catch (err) {
    if (note) note.textContent = T.failed;
  }
  b.disabled = false;
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
    `<main>${home}${approve}${sellers}${addSeller}${statsTab}${orders}</main>` +
    tabbar +
    `<script>${script}</script></body></html>`
  );
}

const ADMIN_STYLE = `
.statsub{margin:-4px 0 10px}
a.kpi{display:block;text-decoration:none;color:var(--ink);transition:box-shadow .15s,transform .15s}
a.kpi:hover{box-shadow:0 6px 18px rgba(31,60,136,.14);transform:translateY(-1px)}
a.kpi b{color:var(--brand2)}
.legend a.lg,.legend span.lg{display:contents;color:inherit;text-decoration:none}
.legend li:has(a.lg){cursor:pointer}
.legend li:has(a.lg):hover span{color:var(--brand2);text-decoration:underline}
.donut a path:hover,.columns a path:hover{opacity:.85}
a.meter{text-decoration:none;color:var(--ink);border-radius:8px}
a.meter:hover .mname b{color:var(--brand2);text-decoration:underline}
.stattable a,.stattable a:visited,a.meter:visited,a.kpi:visited,.legend a.lg:visited{color:inherit;text-decoration:none}
.stattable a:hover b,.stattable td.num a:hover{color:var(--brand2);text-decoration:underline}
.stattable .who.best b{color:#11683a}
.stattable .who.worst b{color:#b42318}
.ofilter{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}
.ofilter a{padding:7px 14px;border-radius:999px;border:1.5px solid var(--line);background:#fff;color:var(--ink);text-decoration:none;font-weight:700;font-size:.86rem}
.ofilter a.on{background:var(--brand2);border-color:var(--brand2);color:#fff}
.otags{margin:-2px 0 12px;font-size:.9rem;font-weight:700}
.otags a{margin-left:8px;color:var(--brand2);font-weight:700}
.order[hidden]{display:none}
#tab-orders>.ofilter,#tab-orders>.otags{grid-column:1/-1;margin-bottom:0}
#tab-orders>.otags[hidden],#tab-orders>.empty[hidden]{display:none}
.kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:12px 0 2px}
@media (min-width:700px){.kpis{grid-template-columns:repeat(4,1fr)}}
.kpi{padding:14px 16px;margin:0}
.kpi span{display:block;color:var(--muted);font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
.kpi b{display:block;font-size:1.6rem;margin-top:4px;font-variant-numeric:tabular-nums}
.charts{display:grid;grid-template-columns:1fr;gap:12px;margin:10px 0 4px}
@media (min-width:900px){.charts{grid-template-columns:1fr 1fr}}
.chart h4{margin:0 0 10px;font-size:.98rem}
.donutwrap{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.donut{width:150px;height:150px;flex:none}
.donut .dbig{font-size:22px;font-weight:800;fill:var(--ink)}
.donut .dsmall{font-size:11px;fill:var(--muted)}
.legend{list-style:none;margin:0;padding:0;flex:1;min-width:170px}
.legend li{display:grid;grid-template-columns:12px 1fr auto 40px;gap:8px;align-items:center;padding:4px 0;font-size:.88rem;border-bottom:1px solid var(--line)}
.legend li:last-child{border-bottom:0}
.legend i{width:12px;height:12px;border-radius:3px}
.legend b{font-variant-numeric:tabular-nums}
.legend em{font-style:normal;color:var(--muted);text-align:right;font-variant-numeric:tabular-nums}
.columns{width:100%;max-width:560px;height:auto;display:block;margin:0 auto}
.columns .cval{font-size:12px;font-weight:800;fill:var(--ink)}
.columns .clab{font-size:10px;fill:var(--muted)}
.nodata{margin:8px 0 0}
.meters{display:flex;flex-direction:column;gap:9px}
.meter{display:grid;grid-template-columns:minmax(110px,40%) 1fr 30px;gap:10px;align-items:center}
.mname{font-size:.86rem;line-height:1.2;overflow:hidden}
.mname small{display:block;color:var(--muted);font-size:.75rem}
.mtrack{height:12px;border-radius:99px;background:#e9edf3;overflow:hidden}
.mtrack i{display:block;height:100%;border-radius:99px}
.mtrack i.good{background:#1f9254}.mtrack i.mid{background:#e08a00}.mtrack i.low{background:#d4382c}
.mval{text-align:right;font-variant-numeric:tabular-nums}
.periods{display:flex;gap:8px;margin-bottom:6px}
.periods a{padding:7px 14px;border-radius:999px;border:1.5px solid var(--line);background:#fff;color:var(--ink);text-decoration:none;font-weight:700;font-size:.88rem}
.periods a.on{background:var(--brand2);border-color:var(--brand2);color:#fff}
.tablewrap{padding:0;overflow-x:auto;-webkit-overflow-scrolling:touch}
.stattable{width:100%;border-collapse:collapse;font-size:.88rem}
.stattable th,.stattable td{padding:10px 7px;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap;vertical-align:middle}
.stattable thead th{white-space:normal;line-height:1.25;vertical-align:bottom}
.stattable thead th.num{text-align:right}
.stattable tbody tr:hover>*{background:#f8faff}
.stattable .rank{color:var(--muted);width:28px}
.stattable .scorecell{min-width:104px}
.stattable thead th{background:#f4f6fb;color:var(--muted);font-size:.75rem;text-transform:uppercase;letter-spacing:.03em;font-weight:700}
.stattable tbody tr:last-child>*{border-bottom:0}
.stattable tbody th{position:sticky;left:0;background:#fff;z-index:1}
.stattable th small,.stattable .who small{display:block;color:var(--muted);font-weight:500;font-size:.78rem}
.stattable .num{text-align:right;font-variant-numeric:tabular-nums}
.stattable .bad{color:#b42318;font-weight:800}
.stattable .muted{color:var(--muted)}
.stattable .who.best b{color:#11683a}
.stattable .who.worst b{color:#b42318}
.warnbox{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:max-content}
.warnbox .msg{flex-basis:100%;margin:2px 0 0;color:#b42318;font-size:.78rem;white-space:normal;max-width:220px}
.warnbox .msg:empty{display:none}
.warncount{min-width:24px;height:24px;border-radius:999px;display:inline-grid;place-items:center;font-weight:800;font-size:.8rem;padding:0 6px}
.warncount.w0{background:#eef1f5;color:var(--muted)}
.warncount.w1{background:#fff1d6;color:#a35c00}
.warncount.w2{background:#fde2dd;color:#b42318}
.warnbtn,.rmbtn{border-radius:999px;padding:5px 11px;font:inherit;font-size:.78rem;font-weight:700;cursor:pointer;white-space:nowrap}
.warnbtn{border:1.5px solid #e0a100;background:#fffaf0;color:#8a5a00}
.rmbtn{border:1.5px solid #d4382c;background:#d4382c;color:#fff}
.warnbtn:disabled,.rmbtn:disabled{opacity:.55}
.rankchip{font-style:normal;font-size:.7rem;font-weight:800;padding:2px 8px;border-radius:999px;vertical-align:middle}
.rankchip.best{background:#d7f5df;color:#11683a}
.rankchip.worst{background:#fde2dd;color:#b42318}
.score{display:inline-block;width:56px;height:8px;border-radius:99px;background:#e9edf3;vertical-align:middle;overflow:hidden;margin-right:8px}
.score i{display:block;height:100%;border-radius:99px}
.score.good i{background:#1f9254}.score.mid i{background:#e08a00}.score.low i{background:#d4382c}
.scorenum{font-variant-numeric:tabular-nums}
.account .accrow{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:.92rem}
.account .accrow span{color:var(--muted)}
.account .accrow a{color:var(--brand2);font-weight:700;word-break:break-all;text-align:right}
#admincode{font-size:1.1rem;letter-spacing:.05em}
.account details{margin:12px 0}
.account summary{cursor:pointer;font-weight:700;color:var(--brand2);padding:6px 0}
.account .msg.ok{color:#11683a;font-weight:700}
#logout{margin-top:6px}
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
.removeseller{margin-top:10px}
.disputealert{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px;background:var(--amberbg);color:var(--amber);font-weight:700;text-decoration:none}
.disputecard{outline:2px solid var(--amber);margin-bottom:14px}
.disputecard img{display:block;width:100%;max-height:380px;object-fit:contain;margin:8px 0;border:1px solid var(--line);border-radius:10px;background:#fff}
.disputecard .acts{margin-top:8px}
.disputecard .callbtn{justify-content:center}
.disputecard .msg:empty{display:none}
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
