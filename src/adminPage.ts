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

export function renderAdminPage(data: {
  language: string;
  token: string;
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
const T = ${scriptJson({ saving: W.saving, save: W.save, failed: W.failed, expired: W.expired })};
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
`;
