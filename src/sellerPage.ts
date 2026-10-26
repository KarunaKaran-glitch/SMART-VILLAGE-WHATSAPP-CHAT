import { dt } from './dashText';
import { STYLE, escapeHtml, rupees, scriptJson } from './shopPage';

// The seller's dashboard (opened from the seller's [Click here] button): shop link to share,
// products (change price / stock, hide / show), add a product with a photo, UPI ID and QR, state.

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
  notice: string | null; // shown at the top after a change ("Product added", "Saved")
  shopLink: string | null; // wa.me link customers open (null when the bot number is not set)
  upiId: string | null;
  qrUrl: string | null;
  shopLanguage: string | null;
  states: { value: string; label: string }[];
}): string {
  const W = dt(data.language);
  const statusText = {
    onSale: W.statusOnSale,
    waiting: W.statusWaiting,
    rejected: W.statusRejected,
    hidden: W.statusHidden,
    draft: W.statusDraft,
  };

  const notice = data.notice ? `<div class="box ok"><b>✅ ${escapeHtml(data.notice)}</b></div>` : '';
  const upiWarn = data.upiId ? '' : `<div class="box warnbox">⚠️ ${escapeHtml(W.noUpiWarn)}</div>`;

  // Shop link with a WhatsApp share button
  const shareUrl = data.shopLink
    ? `https://wa.me/?text=${encodeURIComponent(W.shareText(data.shopName, data.shopLink))}`
    : null;
  const linkBox =
    `<h2>${escapeHtml(W.shopLinkTitle)}</h2><div class="box">` +
    (data.shopLink
      ? `<p class="linktext">${escapeHtml(data.shopLink)}</p><p class="desc">${escapeHtml(W.shopLinkHint(data.sellerId))}</p>` +
        `<a class="go pay" href="${escapeHtml(shareUrl!)}">${escapeHtml(W.share)}</a>`
      : `<p class="desc">${escapeHtml(W.noBotNumber)}</p>`) +
    '</div>';

  // Products, each with [Change] (price, stock) and [Hide] / [Show]
  const products = data.products.length
    ? data.products
        .map((p) => {
          const canToggle = p.status === 'onSale' || p.status === 'hidden';
          return (
            `<div class="card prod" data-id="${p.id}">` +
            (p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy">` : '<div class="noimg"></div>') +
            `<div class="info"><p class="name">${escapeHtml(p.name)}</p>` +
            `<p class="desc">₹${rupees(p.price)} · ${escapeHtml(W.stockLabel(p.stock))}</p>` +
            `<span class="status ${p.status}">${escapeHtml(statusText[p.status])}</span>` +
            '<div class="acts">' +
            `<button type="button" class="add small" data-act="edit">${escapeHtml(W.change)}</button>` +
            (canToggle
              ? `<button type="button" class="add small" data-act="${p.status === 'onSale' ? 'hide' : 'show'}">` +
                `${escapeHtml(p.status === 'onSale' ? W.hide : W.show)}</button>`
              : '') +
            '</div>' +
            '<div class="editbox" hidden>' +
            `<label>${escapeHtml(W.priceLabel)}</label><input class="eprice" inputmode="decimal" value="${p.price}">` +
            `<label>${escapeHtml(W.stockLabelEdit)}</label><input class="estock" inputmode="numeric" value="${p.stock ?? ''}">` +
            `<button type="button" class="go small" data-act="save">${escapeHtml(W.saveChange)}</button></div>` +
            '<p class="msg"></p></div></div>'
          );
        })
        .join('')
    : `<div class="box">${escapeHtml(W.noProductsYet)}</div>`;

  const form =
    `<h2>${escapeHtml(W.addProduct)}</h2><div class="box"><p class="desc">${escapeHtml(W.addProductHint)}</p>` +
    `<label for="photo">${escapeHtml(W.photo)}</label>` +
    '<input id="photo" type="file" accept="image/*">' +
    '<img id="preview" class="preview" alt="" hidden>' +
    `<label for="pname">${escapeHtml(W.productName)}</label><input id="pname" maxlength="60" autocomplete="off">` +
    `<label for="price">${escapeHtml(W.productPrice)}</label><input id="price" inputmode="decimal" maxlength="9" autocomplete="off" placeholder="250">` +
    `<label for="pdesc">${escapeHtml(W.productDesc)}</label><textarea id="pdesc" maxlength="300"></textarea>` +
    '<p class="msg" id="msg"></p>' +
    `<button type="button" class="go" id="add">${escapeHtml(W.addBtn)}</button></div>`;

  // Payment details and state
  const stateOptions = data.states
    .map(
      (s) =>
        `<option value="${escapeHtml(s.value)}"${s.value === data.shopLanguage ? ' selected' : ''}>${escapeHtml(s.label)}</option>`
    )
    .join('');
  const settings =
    `<h2>${escapeHtml(W.payment)}</h2><div class="box">` +
    `<label for="upi">${escapeHtml(W.upiLabel)}</label>` +
    `<input id="upi" maxlength="100" autocomplete="off" placeholder="name@okaxis" value="${escapeHtml(data.upiId ?? '')}">` +
    `<p class="msg" id="upimsg"></p><button type="button" class="go" id="saveupi">${escapeHtml(W.saveUpi)}</button>` +
    `<label for="qr">${escapeHtml(W.qrLabel)}</label><p class="desc">${escapeHtml(W.qrHint)}</p>` +
    (data.qrUrl ? `<img class="preview" src="${escapeHtml(data.qrUrl)}" alt="QR">` : '') +
    '<input id="qr" type="file" accept="image/*"><img id="qrpreview" class="preview" alt="" hidden>' +
    `<p class="msg" id="qrmsg"></p><button type="button" class="go" id="saveqr">${escapeHtml(W.saveQr)}</button>` +
    (data.qrUrl ? `<button type="button" class="no wide" id="removeqr">${escapeHtml(W.removeQr)}</button>` : '') +
    '</div>' +
    `<h2>${escapeHtml(W.state)}</h2><div class="box">` +
    `<label for="state">${escapeHtml(W.stateLabel)}</label><select id="state">${stateOptions}</select>` +
    `<p class="msg" id="statemsg"></p><button type="button" class="go" id="savestate">${escapeHtml(W.saveState)}</button></div>`;

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

async function post(url, body, msgEl, notice) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ t: TOKEN }, body)),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok && out.ok) {
      location.href = '/seller?t=' + encodeURIComponent(TOKEN) + '&done=' + notice;
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
      URL.revokeObjectURL(url);
      done(data);
    };
    img.onerror = () => { msgEl.textContent = T.photoInvalid; URL.revokeObjectURL(url); };
    img.src = url;
  });
}

// Add a product
let photo = null;
const msg = document.getElementById('msg');
readPhoto(document.getElementById('photo'), document.getElementById('preview'), msg, (d) => { photo = d; });
const addBtn = document.getElementById('add');
addBtn.addEventListener('click', async () => {
  const name = document.getElementById('pname').value.trim();
  const price = Number(document.getElementById('price').value.replace(/[,₹\\s]/g, ''));
  const description = document.getElementById('pdesc').value.trim();
  if (!photo) { msg.textContent = T.photoMissing; return; }
  if (name.length < 2 || name.length > 60) { msg.textContent = T.nameInvalid; return; }
  if (!(price >= 1 && price <= 100000)) { msg.textContent = T.priceInvalid; return; }
  addBtn.disabled = true;
  addBtn.textContent = T.adding;
  if (!(await post('/seller/products', { name, price, description, photo }, msg, 'added'))) {
    addBtn.disabled = false;
    addBtn.textContent = T.addBtn;
  }
});

// Change price / stock, hide / show
document.querySelectorAll('.prod').forEach((card) => {
  const m = card.querySelector('.msg');
  card.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'edit') { card.querySelector('.editbox').hidden = false; return; }
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
`;

  return (
    `<!doctype html><html lang="${escapeHtml(data.language)}"><head><meta charset="utf-8">` +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<title>${escapeHtml(W.sellerTitle)}</title><style>${STYLE}${SELLER_STYLE}</style></head><body><main>` +
    `<div class="banner"><h1>${escapeHtml(data.shopName)}</h1>` +
    `<span class="chip">${escapeHtml(W.sellerTitle)} · ${escapeHtml(W.yourId(data.sellerId))}</span></div>` +
    notice +
    upiWarn +
    linkBox +
    `<h2>${escapeHtml(W.myProducts)} (${data.products.length})</h2>` +
    products +
    form +
    settings +
    `</main><script>${script}</script></body></html>`
  );
}

const SELLER_STYLE = `
main{padding-bottom:32px}
.box.ok{border:2px solid var(--brand);margin-bottom:8px}
.warnbox{border:2px solid #e0a800;background:#fff8e1;margin-bottom:8px}
label{font-weight:600;display:block;margin:10px 0 4px}
input,select{width:100%;border:1.5px solid var(--line);border-radius:8px;padding:10px;font:inherit;background:#fff}
.preview{display:block;max-width:100%;max-height:260px;border-radius:10px;margin-top:8px}
.preview[hidden]{display:none}
.go{margin-top:8px}
.go.pay{display:block;text-decoration:none;text-align:center}
.no.wide{width:100%;margin-top:8px;border:1.5px solid var(--warn);color:var(--warn);background:#fff;border-radius:10px;font-weight:700;padding:11px}
.msg{margin:10px 0 0}
.linktext{overflow-wrap:anywhere;font-weight:600;margin:0 0 4px}
.status{display:inline-block;border-radius:999px;padding:2px 10px;font-size:.8rem;font-weight:600;background:var(--line)}
.status.onSale{background:#d6f0e1;color:#0f5c3a}
.status.waiting{background:#fff1c7;color:#6b4e00}
.status.rejected{background:#fde0de;color:#8c1d16}
.acts{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.small{padding:5px 12px;font-size:.88rem}
.go.small{width:auto;padding:8px 18px;font-size:.95rem}
.editbox[hidden]{display:none}
`;
