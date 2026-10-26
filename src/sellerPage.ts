import { dt } from './dashText';
import { STYLE, escapeHtml, rupees, scriptJson } from './shopPage';

// The seller's dashboard (opened from the seller's [Click here] button):
// their products with photo, price, stock and approval, and a form to add a product with a photo.

export type SellerProductRow = {
  id: number;
  name: string;
  price: number;
  stock: number | null;
  imageUrl: string | null;
  status: 'onSale' | 'waiting' | 'rejected' | 'hidden' | 'draft';
};

export function renderSellerPage(data: {
  language: string;
  token: string;
  shopName: string;
  sellerId: string; // the unique ID
  products: SellerProductRow[];
  added: boolean; // a product was just added (shown at the top)
}): string {
  const W = dt(data.language);
  const statusText = {
    onSale: W.statusOnSale,
    waiting: W.statusWaiting,
    rejected: W.statusRejected,
    hidden: W.statusHidden,
    draft: W.statusDraft,
  };

  const notice = data.added ? `<div class="box ok"><b>✅ ${escapeHtml(W.productAdded)}</b></div>` : '';

  const products = data.products.length
    ? data.products
        .map(
          (p) =>
            '<div class="card">' +
            (p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy">` : '<div class="noimg"></div>') +
            `<div class="info"><p class="name">${escapeHtml(p.name)}</p>` +
            `<p class="desc">₹${rupees(p.price)} · ${escapeHtml(W.stockLabel(p.stock))}</p>` +
            `<span class="status ${p.status}">${escapeHtml(statusText[p.status])}</span></div></div>`
        )
        .join('')
    : `<div class="box">${escapeHtml(W.noProductsYet)}</div>`;

  const form =
    `<h2>${escapeHtml(W.addProduct)}</h2><div class="box"><p class="desc">${escapeHtml(W.addProductHint)}</p>` +
    `<label for="photo">${escapeHtml(W.photo)}</label>` +
    '<input id="photo" type="file" accept="image/*">' +
    '<img id="preview" alt="" hidden>' +
    `<label for="pname">${escapeHtml(W.productName)}</label><input id="pname" maxlength="60" autocomplete="off">` +
    `<label for="price">${escapeHtml(W.productPrice)}</label><input id="price" inputmode="decimal" maxlength="9" autocomplete="off" placeholder="250">` +
    `<label for="pdesc">${escapeHtml(W.productDesc)}</label><textarea id="pdesc" maxlength="300"></textarea>` +
    '<p class="msg" id="msg"></p>' +
    `<button type="button" class="go" id="add">${escapeHtml(W.addBtn)}</button></div>`;

  const script = `
const T = ${scriptJson({
    adding: W.adding,
    addBtn: W.addBtn,
    failed: W.failed,
    expired: W.expired,
    photoMissing: W.photoMissing,
    photoInvalid: W.photoInvalid,
    nameInvalid: W.productNameInvalid,
    priceInvalid: W.priceInvalid,
  })};
const msg = document.getElementById('msg');
const preview = document.getElementById('preview');
let photo = null;

// Shrink the photo on the phone (longest side 1200 px, JPEG) before uploading
document.getElementById('photo').addEventListener('change', (e) => {
  photo = null;
  preview.hidden = true;
  msg.textContent = '';
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    photo = c.toDataURL('image/jpeg', 0.82);
    preview.src = photo;
    preview.hidden = false;
    URL.revokeObjectURL(url);
  };
  img.onerror = () => { msg.textContent = T.photoInvalid; URL.revokeObjectURL(url); };
  img.src = url;
});

const btn = document.getElementById('add');
btn.addEventListener('click', async () => {
  const name = document.getElementById('pname').value.trim();
  const price = Number(document.getElementById('price').value.replace(/[,₹\\s]/g, ''));
  const description = document.getElementById('pdesc').value.trim();
  if (!photo) { msg.textContent = T.photoMissing; return; }
  if (name.length < 2 || name.length > 60) { msg.textContent = T.nameInvalid; return; }
  if (!(price >= 1 && price <= 100000)) { msg.textContent = T.priceInvalid; return; }
  btn.disabled = true;
  btn.textContent = T.adding;
  try {
    const res = await fetch('/seller/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: ${scriptJson(data.token)}, name, price, description, photo }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) {
      location.href = '/seller?t=' + encodeURIComponent(${scriptJson(data.token)}) + '&added=1';
      return;
    }
    msg.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
  } catch (e) {
    msg.textContent = T.failed;
  }
  btn.disabled = false;
  btn.textContent = T.addBtn;
});
`;

  return (
    `<!doctype html><html lang="${escapeHtml(data.language)}"><head><meta charset="utf-8">` +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<title>${escapeHtml(W.sellerTitle)}</title><style>${STYLE}${SELLER_STYLE}</style></head><body><main>` +
    `<div class="banner"><h1>${escapeHtml(data.shopName)}</h1>` +
    `<span class="chip">${escapeHtml(W.sellerTitle)} · ${escapeHtml(W.yourId(data.sellerId))}</span></div>` +
    notice +
    `<h2>${escapeHtml(W.myProducts)} (${data.products.length})</h2>` +
    products +
    form +
    `</main><script>${script}</script></body></html>`
  );
}

const SELLER_STYLE = `
main{padding-bottom:32px}
.box.ok{border:2px solid var(--brand);margin-bottom:8px}
label{font-weight:600;display:block;margin:10px 0 4px}
input,select{width:100%;border:1.5px solid var(--line);border-radius:8px;padding:10px;font:inherit;background:#fff}
#preview{display:block;max-width:100%;max-height:260px;border-radius:10px;margin-top:8px}
#preview[hidden]{display:none}
.go{margin-top:6px}
.msg{margin:10px 0 0}
.status{display:inline-block;border-radius:999px;padding:2px 10px;font-size:.8rem;font-weight:600;background:var(--line)}
.status.onSale{background:#d6f0e1;color:#0f5c3a}
.status.waiting{background:#fff1c7;color:#6b4e00}
.status.rejected{background:#fde0de;color:#8c1d16}
`;
