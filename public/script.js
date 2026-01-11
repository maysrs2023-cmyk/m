/* =======================
   MAYS – Script (Home)
   ======================= */

// --- Warenkorb (localStorage) ---
const CART_KEY = "mays_cart";
const getCart  = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const setCart  = (v) => localStorage.setItem(CART_KEY, JSON.stringify(v));
const cartBadge = document.getElementById("cartBadge");
function refreshBadge(){
  if(!cartBadge) return;

  const n = getCart().reduce((s,i)=> s + (Number(i.qty)||0), 0);
  cartBadge.textContent = String(n);

  // Animation triggern
  cartBadge.classList.remove("cart-bounce");
  void cartBadge.offsetWidth; // reset animation
  cartBadge.classList.add("cart-bounce");
}

refreshBadge();

// --- Globale Objekte ---
window.MAYS_PRODUCTS = [];
window.MAYS_CART_API = { getCart, setCart, refreshBadge };
let _resolveReady;
window.MAYS_PRODUCTS_READY = new Promise(r => (_resolveReady = r));

// --- State ---
let state = { search: "", category: "Alle" };

// --- DOM ---
const grid = document.getElementById("productGrid");
const emptyMsg = document.getElementById("emptyMsg");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

// Off-canvas (nur falls vorhanden)
const menuBtn = document.getElementById("menuBtn");
const menuClose = document.getElementById("menuClose");
const menuPanel = document.getElementById("menuPanel");
const menuBackdrop = document.getElementById("menuBackdrop");

// --- Helpers ---
const money = c => (c/100).toFixed(2).replace(".", ",");

const PRICE_RANGES = {
  "baklava-exzellent": { min: 1299, max: 2499 },
  "baklava-standard":  { min:  899, max: 1799 },
  "baklava-pistazien-premium": { min: 1199, max: 3499 },
  "baklava-cashew": { min: 999, max: 1999 }, // 👈 Das hier ergänzt!
   "baklava-mix": { min: 1099, max: 2199 },
   "baklava-walnuss": { min: 999, max: 1999 },
     "pistazien-harissa": { min: 999, max: 1999 },
   "harissa-drei-nuesse": { min: 499, max: 999 },
   "harissa-schoko": { min: 799, max: 1499 },
     "asch-al-bulbul": { min: 1299, max: 2499 },
     "asch-al-bulbul-premium": { min: 1799, max: 3499 },
     "knafeh-sticks-pistazie": { min: 1799, max: 3499 },
     "boulouria-hamra": { min: 1799, max: 3499 },
     "boulouria-bayda": { min: 1799, max: 3499 },
    "suwar-al-sitt": { min: 1799, max: 3499 },

"yalberq-baklava": { min: 1799, max: 3499 },
"tamriya": { min: 1499, max: 2999 },
"maamoul-dattel": { min: 1299, max: 2499 },
"barazek": { min: 1099, max: 2199 },
"biyoutifour": { min: 1299, max: 2499 },
"halawa-al-jibn": { min: 999, max: 1999 },
"atayef": { min: 799, max: 1499 },
"lokum-rot": { min: 1299, max: 2499 },
"lokum-pistazien-rosen": { min: 1299, max: 2499 },
"lokum-rot-pur": { min: 1299, max: 2499 },
"lokumrolle-weiss": { min: 1299, max: 2499 },
"lokumrolle-kokos": { min: 1299, max: 2499 },
"gemischtes-maamoul": { min: 1099, max: 2199 },
"nussmix-geraeuchert": { min: 899, max: 1699 },
"sauer-nuss-mischung": { min: 899, max: 1699 },
"salzige-nuss-mischung": { min: 899, max: 1699 },
"wassermelonenkerne-rot": { min: 499, max: 999 },
"kuerbiskerne-weiss": { min: 499, max: 999 },
"kuerbiskerne-gelb": { min: 499, max: 999 },
"kuerbiskerne-weiss-lang": { min: 499, max: 999 },
"gelbe-kerne": { min: 499, max: 999 },
"schwarze-kerne": { min: 499, max: 999 },
"schwarze-kerne": { min: 499, max: 999 },
"zuckerkugeln-bunt": { min: 599, max: 1199 },
"fruchtchips-mix": { min: 499, max: 4999 },
"asia-snack-mix": { min: 599, max: 1199 },
"knusper-mix-bunt": { min: 499, max: 999 },
"bunter-snack-mix": { min: 599, max: 1199 },
"salziger-nuss-mix": { min: 699, max: 1399 },
"gesalzene-mandeln": { min: 899, max: 1699 },
"wassermelonenkerne-geroestet": { min: 499, max: 999 },
"mandeln-geroestet-schale": { min: 599, max: 1199 },
"qbqab-ghawar": { min: 599, max: 1199 },
"geroestete-erdnuesse": { min: 499, max: 999 },
"dattelriegel-pistazie": { min: 1299, max: 2499 },
"halwa-rolle-pistazie": { min: 1099, max: 2199 },
"pistazien-honig-riegel": { min: 1299, max: 2499 },
"halawa-rollen-klassisch": { min: 999, max: 1999 },
"luxus-pralinen": { min: 1299, max: 2499 },
"suessigkeiten-mix-box": { min: 1099, max: 2199 },
"pistazien-gruen-gemahlen": { min: 899, max: 4499 },
"pistazien-dunkel-roh": { min: 699, max: 3499 },
"pistazien-hell-roh": { min: 899, max: 4499 },


};

// --- Produkte laden ---
fetch("/products.json", { cache: "no-cache" })
  .then(r => r.json())
  .then(data => {
    window.MAYS_PRODUCTS = Array.isArray(data) ? data : [];
    _resolveReady && _resolveReady(window.MAYS_PRODUCTS);
   // Nur auf der Startseite: 4 zufällige Produkte anzeigen
if (location.pathname.endsWith("index.html") || location.pathname === "/") {
  const shuffled = [...window.MAYS_PRODUCTS].sort(() => 0.5 - Math.random());
  renderProducts(shuffled.slice(0, 4));
    } else if (location.pathname.endsWith("produkte.html")) {
      renderCategorizedProducts();
    } else {
      applyFiltersAndRender();
    }

  })
  .catch(err => console.error("Produkte laden fehlgeschlagen:", err));

// --- Render Grid ---
function renderProducts(list) {
  if (!grid) return;
  grid.innerHTML = "";

  if (!list.length) {
    emptyMsg?.classList.remove("hidden");
    return;
  }
  emptyMsg?.classList.add("hidden");

  list.forEach(p => {
    const pickupOnly = [
      'arabisches-eis-portion-1',
      'arabisches-eis-mit-pistazien-stk',
      'atayef',
      'warbat-sahne',
      'halawa-al-jibn'
    ];

    const img = (p.images && p.images[0]) || "/images/mays.png";
    const card = document.createElement("article");
    card.className = "bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden";

    const range = PRICE_RANGES[p.id];
    const priceText = range
      ? `€ ${money(range.min)} – € ${money(range.max)} <span class="text-gray-500 text-sm">inkl. MwSt.</span>`
      : `€ ${money(p.price)} <span class="text-gray-500 text-sm">inkl. MwSt.</span>`;

    const starsHTML = `<div class="flex gap-0.5 mt-1 text-gray-300 text-lg">
      <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
    </div>`;

    card.innerHTML = `
      <button class="block w-full card-img-wrap" data-open="${p.id}" aria-label="${p.name}" style="position: relative;">
        <img src="${img}" alt="${p.name}" class="card-img">
        ${p.pickup_only ? `
          <div class="absolute top-2 left-2 bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-1 rounded-full border border-pink-300 shadow-sm">
            🚫 Kein Versand möglich
          </div>
        ` : ""}
      </button>

      <div class="p-4">
        <h3 class="font-semibold">${p.name}</h3>
        <div class="text-sm text-gray-500">${p.category || "—"}</div>
        <div class="text-pink-700 font-bold mt-1">${priceText}</div>
        ${starsHTML}
        <div class="mt-3 text-center">
          <button class="px-4 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-600" data-add="${p.id}">
            In den Warenkorb
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  }); // 👈 forEach endet hier

  // Klick-Events aktivieren
  grid.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => {
      location.href = "/product.html?id=" + encodeURIComponent(btn.getAttribute("data-open"));
    });
  });

  grid.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.getAttribute("data-add"), 1));
  });
}
function addToCart(id, qty = 1, variant = null) {
  const p = (window.MAYS_PRODUCTS || []).find(x => x.id === id);
  if (!p) return;

  // ✅ Wenn keine Variante angegeben ist, nimm die erste Variante (z. B. 500g)
  if (!variant && Array.isArray(p.variants) && p.variants.length > 0) {
    variant = p.variants[0];
  }

  const price = variant?.price || p.price;
  const name = p.name;
  const variantLabel = variant?.label || null;
  const image = (p.images && p.images[0]) || "/images/mays.png";

  const cart = getCart();
  const row = cart.find(x => x.id === (variant?.id || id));
  if (row) {
    row.qty += qty;
  } else {
    cart.push({
      id: variant?.id || id,
      productId: id, // Wichtig für spätere Erkennung
      variantId: variant?.id || null,
      name: name,
      price: price,
      qty,
      image: image,
      variantLabel: variantLabel
    });
  }

  setCart(cart);
  refreshBadge();
}

// --- Filter ---
function applyFiltersAndRender() {
  let data = window.MAYS_PRODUCTS || [];
  const cat = (state.category || "").toLowerCase();

  if (cat && cat !== "alle") {
    if (["harissa", "baklava"].includes(cat)) {
      // Nur Titel durchsuchen
      data = data.filter(p => (p.name || "").toLowerCase().includes(cat));
    } else {
      // Genaues Matching bei Kategorie
      data = data.filter(p => {
     const productCat = (p.category || "").toLowerCase().trim();
const catNormalized = cat.toLowerCase().trim();
return productCat === catNormalized;

      });
    }
  }

  // Suche anwenden (optional)
  if (state.search) {
    const q = state.search.toLowerCase();
    data = data.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
  }

  renderProducts(data);
}



// Suche
searchForm?.addEventListener("submit",(e)=>{
  e.preventDefault();
  state.search = (searchInput?.value || "").trim();
  applyFiltersAndRender();
});

// Off-canvas Menü (falls vorhanden)
function openMenu(){
  menuPanel?.classList.remove("translate-x-[-100%]");
  menuBackdrop?.classList.remove("hidden");
}
function closeMenu(){
  menuPanel?.classList.add("translate-x-[-100%]");
  menuBackdrop?.classList.add("hidden");
}
menuBtn?.addEventListener("click", openMenu);
menuClose?.addEventListener("click", closeMenu);
menuBackdrop?.addEventListener("click", closeMenu);
document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") closeMenu(); });

// Kategorien-Klicks (falls Buttons existieren)
menuPanel?.querySelectorAll(".cat-btn[data-cat]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    menuPanel.querySelectorAll(".cat-btn[data-cat]").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    state.category = btn.dataset.cat || "Alle";
    closeMenu();
    applyFiltersAndRender();
    document.getElementById("productGrid")?.scrollIntoView({ behavior:"smooth" });
  });
});
function renderCategorizedProducts() {
  const container = document.getElementById("categorizedProducts");
  if (!container) return;

  const grouped = {};

  // Produkte nach Kategorie sortieren
  window.MAYS_PRODUCTS.forEach(p => {
    const cat = (p.category || "Unkategorisiert").trim();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  container.innerHTML = "";

  Object.keys(grouped).forEach((cat, idx) => {
    // Überschrift
    const title = document.createElement("h2");
    title.className = "text-2xl font-bold text-pink-700 mt-10 mb-4";
    title.textContent = cat;
    container.appendChild(title);

    // Produkt-Grid
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";
    grouped[cat].forEach(p => {
      const img = (p.images && p.images[0]) || "/images/mays.png";
      const card = document.createElement("article");
      card.className = "bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden";
      const range = PRICE_RANGES[p.id];
      const priceText = range
        ? `€ ${money(range.min)} – € ${money(range.max)} <span class="text-gray-500 text-sm">inkl. MwSt.</span>`
        : `€ ${money(p.price)} <span class="text-gray-500 text-sm">inkl. MwSt.</span>`;
      const starsHTML = `<div class="flex gap-0.5 mt-1 text-gray-300 text-lg">
        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
      </div>`;
      card.innerHTML = `
        <button class="block w-full card-img-wrap" data-open="${p.id}" aria-label="${p.name}">
          <img src="${img}" alt="${p.name}" class="card-img">
        </button>
        <div class="p-4">
          <h3 class="font-semibold">${p.name}</h3>
          <div class="text-sm text-gray-500">${p.category || "—"}</div>
          <div class="text-pink-700 font-bold mt-1">${priceText}</div>
          ${starsHTML}
          <div class="mt-3 text-center">
            <button class="px-4 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-600" data-add="${p.id}">
              In den Warenkorb
            </button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    container.appendChild(grid);

    // Pinker Trennstrich (außer beim letzten)
    if (idx < Object.keys(grouped).length - 1) {
      const hr = document.createElement("hr");
      hr.className = "my-12 border-t-2 border-pink-300";
      container.appendChild(hr);
    }
  });

  // Events aktivieren (wie bei renderProducts)
  container.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => {
      location.href = "/product.html?id=" + encodeURIComponent(btn.getAttribute("data-open"));
    });
  });
  container.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.getAttribute("data-add"), 1));
  });
}
window.addEventListener('DOMContentLoaded', () => {
  const title = document.getElementById('relTitle');
  if (title) title.classList.add('appear');
});
window.addEventListener('DOMContentLoaded', () => {
  const title = document.getElementById('relTitle');
  if (title) {
    setTimeout(() => {
      title.classList.add('animate');
    }, 100);
  }
});
// Stripe Checkout direkt starten
document.addEventListener("DOMContentLoaded", () => {
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener("click", async () => {
    const cart = getCart();
    if (!cart.length) return alert("Dein Warenkorb ist leer.");

    const items = cart.map(i => ({
      id: i.variantId || i.id,
      qty: i.qty
    }));

    const pickup = false; // später kannst du das auswählbar machen

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, pickup })
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Fehler beim Weiterleiten zu Stripe.");
    }
  });
});
