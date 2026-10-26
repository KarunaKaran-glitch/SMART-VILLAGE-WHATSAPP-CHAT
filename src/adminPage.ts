import { dt } from './dashText';
import { STYLE, escapeHtml, scriptJson } from './shopPage';

// The admin dashboard (opened from the admin's [Click here] button): a form to add a seller,
// who gets a unique ID, and the list of sellers with their IDs.

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
  states: { value: string; label: string }[];
  categories: { id: number; name: string }[];
  sellers: AdminSellerRow[];
  created: { shopName: string; id: string } | null; // just added (shown at the top)
  botNumber: string; // shown as "+15556478208", or '' when not set
}): string {
  const W = dt(data.language);

  const notice = data.created
    ? `<div class="box ok"><b>✅ ${escapeHtml(W.created(data.created.shopName, data.created.id))}</b>` +
      `<p class="desc">${escapeHtml(W.tellSeller(data.created.id, data.botNumber || 'the bot'))}</p></div>`
    : '';

  // Products to check: photo, details and Approve / Reject
  const waiting =
    `<h2>${escapeHtml(W.productsWaiting)} (${data.waiting.length})</h2>` +
    (data.waiting.length
      ? data.waiting
          .map(
            (p) =>
              `<div class="box check" data-id="${p.id}">` +
              (p.imageUrl ? `<img class="big" src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy">` : '') +
              `<p class="name">#${p.id} ${escapeHtml(p.name)} · ₹${escapeHtml(p.price)}</p>` +
              (p.description ? `<p class="desc">${escapeHtml(p.description)}</p>` : '') +
              `<p class="desc">${escapeHtml(p.shop)}</p>` +
              '<p class="msg"></p>' +
              `<div class="two"><button type="button" class="go" data-ok="1">${escapeHtml(W.approve)}</button>` +
              `<button type="button" class="no" data-ok="0">${escapeHtml(W.reject)}</button></div></div>`
          )
          .join('')
      : `<div class="box">${escapeHtml(W.noProductsWaiting)}</div>`);

  const options = (list: { value: string; label: string }[]) =>
    list.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');

  const form =
    `<h2>${escapeHtml(W.addSeller)}</h2><div class="box"><p class="desc">${escapeHtml(W.addHint)}</p>` +
    `<label for="name">${escapeHtml(W.sellerName)}</label><input id="name" maxlength="60" autocomplete="off">` +
    `<label for="phone">${escapeHtml(W.phone)}</label><input id="phone" inputmode="numeric" maxlength="13" autocomplete="off" placeholder="9876543210">` +
    `<label for="shop">${escapeHtml(W.shopName)}</label><input id="shop" maxlength="40" autocomplete="off">` +
    `<label for="state">${escapeHtml(W.state)}</label><select id="state">${options(data.states)}</select>` +
    `<label for="category">${escapeHtml(W.category)}</label><select id="category">` +
    options(data.categories.map((c) => ({ value: String(c.id), label: c.name }))) +
    '</select><p class="msg" id="msg"></p>' +
    `<button type="button" class="go" id="save">${escapeHtml(W.save)}</button></div>`;

  const sellers = data.sellers.length
    ? data.sellers
        .map(
          (s) =>
            `<div class="box seller"><div class="row"><b>${escapeHtml(s.shopName)}</b>` +
            `<span class="idchip">${escapeHtml(W.uniqueId)} ${escapeHtml(s.id)}</span></div>` +
            `<p class="desc">${escapeHtml(s.name)} · +${escapeHtml(s.phone)}<br>${escapeHtml(s.state)} · ${escapeHtml(s.category)}<br>` +
            `${escapeHtml(W.productCount(s.products, s.waiting))}</p>` +
            (s.shopLink ? `<p class="desc link">${escapeHtml(s.shopLink)}</p>` : '') +
            '</div>'
        )
        .join('')
    : `<div class="box">${escapeHtml(W.noSellers)}</div>`;

  const script = `
const T = ${scriptJson({
    saving: W.saving,
    save: W.save,
    failed: W.failed,
    expired: W.expired,
    approvedNote: W.approvedNote,
    rejectedNote: W.rejectedNote,
  })};

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
        body: JSON.stringify({ t: ${scriptJson(data.token)}, approve }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) {
        card.querySelector('.two').remove();
        note.className = approve ? 'done-ok' : 'done-no';
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
const btn = document.getElementById('save');
const msg = document.getElementById('msg');
btn.addEventListener('click', async () => {
  const body = {
    t: ${scriptJson(data.token)},
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
      location.href = '/admin?t=' + encodeURIComponent(body.t) + '&new=' + encodeURIComponent(out.id);
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
    `<title>${escapeHtml(W.adminTitle)}</title><style>${STYLE}${ADMIN_STYLE}</style></head><body><main>` +
    `<div class="banner"><h1>${escapeHtml(W.adminTitle)}</h1><span class="chip">Smart Village</span></div>` +
    notice +
    waiting +
    form +
    `<h2>${escapeHtml(W.sellers)} (${data.sellers.length})</h2>` +
    sellers +
    `</main><script>${script}</script></body></html>`
  );
}

const ADMIN_STYLE = `
main{padding-bottom:32px}
.box+.box{margin-top:10px}
.box.ok{border:2px solid var(--brand);margin-bottom:8px}
label{font-weight:600;display:block;margin:10px 0 4px}
input,select{width:100%;border:1.5px solid var(--line);border-radius:8px;padding:10px;font:inherit;background:#fff}
.go{margin-top:6px}
.msg{margin:10px 0 0}
.idchip{background:var(--brand);color:#fff;border-radius:999px;padding:3px 10px;font-weight:700;font-size:.9rem;white-space:nowrap}
.seller .desc{margin:6px 0 0}
.link{overflow-wrap:anywhere;font-size:.8rem}
.big{display:block;width:100%;max-height:320px;object-fit:contain;border-radius:10px;background:var(--line);margin-bottom:8px}
.two{display:flex;gap:10px}
.two button{flex:1;margin-top:4px}
.no{border:1.5px solid var(--warn);color:var(--warn);background:#fff;border-radius:10px;font-size:1.05rem;font-weight:700;padding:13px}
.no:disabled{opacity:.5}
.done-ok{color:var(--brand);font-weight:700}
.done-no{color:var(--warn);font-weight:700}
`;
