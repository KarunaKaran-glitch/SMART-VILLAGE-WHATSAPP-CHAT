import { wt } from './webText';

// The shop web page a customer opens from the [Click here] button: the seller's products
// with - / + quantity, the total, the delivery address and [Continue].
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

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// JSON that is safe inside a <script> tag
function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function rupees(amount: number): string {
  return amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

const STYLE = `
:root{--bg:#e6f4ec;--card:#fff;--ink:#1d2b24;--muted:#5d6f66;--brand:#0f7a4d;--brand-ink:#fff;--line:#d5e6dc;--warn:#b3261e}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",sans-serif;background:var(--bg);color:var(--ink);color-scheme:light}
main{max-width:520px;margin:auto;padding:12px 16px 150px}
.banner{background:linear-gradient(135deg,#0f7a4d,#2aa36b);color:#fff;border-radius:14px;padding:18px 16px;margin-bottom:12px}
.banner h1{margin:0 0 6px;font-size:1.4rem}
.chip{display:inline-block;background:rgba(255,255,255,.2);border-radius:999px;padding:3px 10px;font-size:.85rem}
h2{font-size:1.05rem;margin:18px 4px 8px}
.card{background:var(--card);border-radius:12px;padding:12px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start}
.card img,.card .noimg{width:96px;height:96px;border-radius:10px;object-fit:cover;flex:none;background:var(--line)}
.info{flex:1;min-width:0}
.name{font-weight:600;margin:0 0 2px}
.desc{color:var(--muted);font-size:.88rem;margin:0 0 6px;overflow-wrap:anywhere}
.row{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.price{font-weight:700}
.left{color:var(--warn);font-size:.8rem}
.soldout{color:var(--muted);font-weight:600}
.add{border:1.5px solid var(--brand);color:var(--brand);background:#fff;border-radius:8px;padding:6px 16px;font-weight:600;font-size:.95rem}
.stepper{display:flex;align-items:center;border:1.5px solid var(--brand);border-radius:8px;overflow:hidden}
.stepper button{border:0;background:var(--brand);color:var(--brand-ink);width:34px;height:32px;font-size:1.2rem}
.stepper span{min-width:34px;text-align:center;font-weight:700}
.box{background:var(--card);border-radius:12px;padding:12px}
textarea{width:100%;min-height:76px;border:1.5px solid var(--line);border-radius:8px;padding:8px;font:inherit;resize:vertical}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:10px 16px calc(10px + env(safe-area-inset-bottom))}
.bar .inner{max-width:520px;margin:auto}
.sum{display:flex;justify-content:space-between;margin-bottom:8px}
.sum b{font-size:1.15rem}
.go{width:100%;border:0;border-radius:10px;background:var(--brand);color:var(--brand-ink);font-size:1.05rem;font-weight:700;padding:13px}
.go:disabled{opacity:.5}
.msg{color:var(--warn);min-height:1.2em;margin:0 0 6px;font-size:.9rem}
.done{text-align:center;padding:28px 16px}
.done .tick{font-size:3rem}
.wa{display:inline-block;margin-top:12px;background:var(--brand);color:#fff;text-decoration:none;border-radius:10px;padding:12px 20px;font-weight:700}
`;

export function simplePage(title: string, message: string): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<title>${escapeHtml(title)}</title><style>${STYLE}</style></head>` +
    `<body><main><div class="box done"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></div></main></body></html>`
  );
}

export function renderShopPage(data: {
  language: string;
  shopName: string;
  code: string;
  token: string;
  address: string;
  products: ShopPageProduct[];
  whatsAppLink: string | null;
}): string {
  const W = wt(data.language);

  const cards = data.products
    .map((p) => {
      const photo = p.imageUrl
        ? `<img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy">`
        : '<div class="noimg"></div>';
      const action =
        p.maxQty > 0
          ? `<div class="qty" data-id="${p.id}"></div>`
          : `<span class="soldout">${escapeHtml(W.soldOut)}</span>`;
      return (
        `<div class="card">${photo}<div class="info">` +
        `<p class="name">${escapeHtml(p.name)}</p>` +
        (p.description ? `<p class="desc">${escapeHtml(p.description)}</p>` : '') +
        `<div class="row"><span><span class="price">₹${rupees(p.price)}</span>` +
        (p.left !== null && p.maxQty > 0 ? ` <span class="left">${escapeHtml(W.onlyLeft(p.left))}</span>` : '') +
        `</span>${action}</div></div></div>`
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
    backToWhatsApp: W.backToWhatsApp,
  })};
const ITEMS_TEXT = ${scriptJson(W.items(999))};
const PLACED = ${scriptJson({ title: W.placed(999), body: W.placedBody(data.shopName, '#TOTAL#') })};
const WA_LINK = ${scriptJson(data.whatsAppLink)};
const qty = {};
const fmt = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

function draw(id) {
  const box = document.querySelector('.qty[data-id="' + id + '"]');
  const n = qty[id] || 0;
  box.innerHTML = n === 0
    ? '<button type="button" class="add">' + T.add + '</button>'
    : '<div class="stepper"><button type="button" data-d="-1" aria-label="-">−</button><span>' + n +
      '</span><button type="button" data-d="1" aria-label="+">+</button></div>';
}

function update() {
  let count = 0, total = 0;
  for (const p of PRODUCTS) { const n = qty[p.id] || 0; count += n; total += n * p.price; }
  document.getElementById('count').textContent = ITEMS_TEXT.replace('999', count);
  document.getElementById('total').textContent = '₹' + fmt(total);
  document.getElementById('msg').textContent = '';
}

document.querySelectorAll('.qty').forEach((box) => {
  const id = Number(box.dataset.id);
  const p = PRODUCTS.find((x) => x.id === id);
  draw(id);
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.classList.contains('add') ? 1 : Number(b.dataset.d);
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
  if (address.length < 10 || address.length > 200) { msg.textContent = T.addressInvalid; document.getElementById('address').focus(); return; }
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
      document.querySelector('main').innerHTML =
        '<div class="box done"><div class="tick">✅</div><h1></h1><p></p></div>';
      document.querySelector('.done h1').textContent = PLACED.title.replace('999', out.orderId);
      document.querySelector('.done p').textContent = PLACED.body.replace('#TOTAL#', fmt(out.total));
      if (WA_LINK) {
        const a = document.createElement('a');
        a.className = 'wa'; a.href = WA_LINK; a.textContent = T.backToWhatsApp;
        document.querySelector('.done').appendChild(a);
      }
      document.querySelector('.bar').remove();
      return;
    }
    msg.textContent = res.status === 403 ? T.expired : (out.error || T.failed);
  } catch (e) {
    msg.textContent = T.failed;
  }
  go.disabled = false;
  go.textContent = T.continue;
});
update();
`;

  const body = data.products.length
    ? `<h2>${escapeHtml(W.chooseProducts)}</h2>${cards}` +
      `<h2>${escapeHtml(W.address)}</h2><div class="box">` +
      `<textarea id="address" maxlength="200" placeholder="${escapeHtml(W.addressHint)}">${escapeHtml(data.address)}</textarea></div>`
    : `<div class="box">${escapeHtml(W.noProducts)}</div>`;

  return (
    `<!doctype html><html lang="${escapeHtml(data.language)}"><head><meta charset="utf-8">` +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<title>${escapeHtml(data.shopName)}</title><style>${STYLE}</style></head><body><main>` +
    `<div class="banner"><h1>${escapeHtml(data.shopName)}</h1><span class="chip">🚚 ${escapeHtml(W.freeDelivery)}</span></div>` +
    body +
    '</main>' +
    (data.products.length
      ? '<div class="bar"><div class="inner"><p class="msg" id="msg"></p>' +
        `<div class="sum"><span id="count"></span><span>${escapeHtml(W.total)}: <b id="total">₹0</b></span></div>` +
        `<button type="button" class="go" id="go">${escapeHtml(W.continue)}</button></div></div>` +
        `<script>${script}</script>`
      : '') +
    '</body></html>'
  );
}
