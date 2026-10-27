// Shared by all web pages (shop, payment, seller and admin dashboards): small helpers,
// the app look (top bar, cards, buttons, bottom tab bar) and line icons.

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// JSON that is safe inside a <script> tag
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function rupees(amount: number): string {
  return amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

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

// The app look shared by every page
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
.items{list-style:none;margin:0;padding:10px 0;border-top:1px dashed var(--line);border-bottom:1px dashed var(--line);display:flex;flex-direction:column;gap:10px}
.items li{display:flex;align-items:center;gap:10px}
.items img,.items .noimg{width:56px;height:56px;border-radius:10px;object-fit:cover;background:#eef2f7;flex:none;border:1px solid var(--line)}
.items div{flex:1;min-width:0}
.items p{margin:0;font-weight:600;font-size:.9rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.items span{color:var(--muted);font-size:.82rem}
.items b{white-space:nowrap}
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
