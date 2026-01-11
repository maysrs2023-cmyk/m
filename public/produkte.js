 document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("productGrid");
  // Falls Grid-Stile fehlen → erzwingen
grid.style.display = "grid";
grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(220px, 1fr))";
grid.style.justifyContent = "center";
grid.style.gap = "1.5rem";

  const emptyMsg = document.getElementById("emptyMsg");

  let products = [];

  const PRICE_RANGES = {
   "baklava-exzellent": { min: 1299, max: 2499 },
    "baklava-standard": { min: 899, max: 1799 },
    "baklava-pistazien-premium": { min: 1199, max: 3499 },
    "baklava-cashew": { min: 999, max: 1999 },
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

  const money = c => (c / 100).toFixed(2).replace(".", ",");

  const getPriceText = p => {
    const r = PRICE_RANGES[p.id];
    return r
      ? `€ ${money(r.min)} – € ${money(r.max)} <span class="text-gray-500 text-sm">inkl. MwSt.</span>`
      : `€ ${money(p.price)} <span class="text-gray-500 text-sm">inkl. MwSt.</span>`;
  };

  const getCart = () => JSON.parse(localStorage.getItem("mays_cart") || "[]");
  const setCart = (v) => localStorage.setItem("mays_cart", JSON.stringify(v));

  const updateCartBadge = () => {
    const cart = getCart();
    const badge = document.getElementById("cartBadge");
    const n = cart.reduce((s, i) => s + (+i.qty || 0), 0);
    if (badge) badge.textContent = String(n);
  };

 const addToCart = (id, qty = 1) => {
  const p = products.find(x => x.id === id);
  if (!p) return;

  const cart = getCart();

  // 🧠 Wenn Produkt Varianten hat → automatisch die erste Variante nehmen
  if (p.variants?.length > 0) {
    const variant = p.variants[0];  // erste Variante automatisch

    const existing = cart.find(x => x.variantId === variant.id);

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: p.id,
        name: p.name,
        price: variant.price,
        qty,
        variantId: variant.id,
        variantLabel: variant.label,
        image: p.images?.[0] || ""
      });
    }

  } else {
    // Produkt ohne Varianten
    const existing = cart.find(x => x.id === id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: p.id,
        name: p.name,
        price: p.price,
        qty,
        image: p.images?.[0] || ""
      });
    }
  }

  setCart(cart);
  updateCartBadge();
};

const render = list => {
  grid.innerHTML = "";

  if (!list.length) {
    emptyMsg?.classList.remove("hidden");
    return;
  }
  emptyMsg?.classList.add("hidden");

  list.forEach((p, i) => {
    const img = (p.images && p.images[0]) || "/images/mays.png";
    const card = document.createElement("article");

    card.className =
     "bg-white rounded-2xl shadow hover:shadow-lg overflow-hidden flex flex-col"


    card.innerHTML = `
      <button class="block w-full card-img-wrap" data-open="${p.id}">
        <img src="${img}" alt="${p.name}" class="w-full aspect-square object-cover">
      </button>

      <div class="p-5 flex flex-col justify-between flex-grow">
        <div>
          <h3 class="font-semibold text-lg">${p.name}</h3>
          <div class="text-sm text-gray-500">${p.category || "—"}</div>
          <div class="text-pink-700 font-bold mt-1">${getPriceText(p)}</div>
        </div>

        <div class="mt-4">
          <button class="w-full px-4 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-600" data-add="${p.id}">
            In den Warenkorb
          </button>
        </div>
      </div>
    `;

    // Startzustand (unsichtbar)
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";

    grid.appendChild(card);

    // Eins nach dem anderen rein
    setTimeout(() => {
      card.style.transition = "all 0.45s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, i * 90);
  });

  grid.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => {
      location.href = "/product.html?id=" + encodeURIComponent(btn.dataset.open);
    });
  });

  grid.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.add, 1);
    });
  });
};


  try {
    const res = await fetch("/products.json", { cache: "no-cache" });
    products = await res.json();
    render(products);
  } catch (err) {
    console.error("Fehler beim Laden der Produkte:", err);
    grid.innerHTML = "<p class='text-center text-gray-500'>Produkte konnten nicht geladen werden.</p>";
  }

let activeCategory = "alle";
let activeSort = "default";



// Event-Listener für Sortierung
document.getElementById("sortSelect").addEventListener("change", e => {
  activeSort = e.target.value;
  renderFilteredAndSorted();
});

function renderFilteredAndSorted() {
  let result;

  // 🔍 Filtern
  if (activeCategory === "alle") {
    result = products;
  } else if (["harissa", "baklava"].includes(activeCategory)) {
    result = products.filter(p =>
      (p.name || "").toLowerCase().includes(activeCategory)
    );
  } else {
    result = products.filter(p =>
      (p.category || "").toLowerCase() === activeCategory
    );
  }

  // 🔃 Sortieren
  if (activeSort === "price-asc") {
    result = result.slice().sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else if (activeSort === "price-desc") {
    result = result.slice().sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  } else if (activeSort === "name-asc") {
    result = result.slice().sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }

  // ⭐ NUR render – Animation passiert dort
  render(result);
}



// ← Ende Funktion
// Kategorien-Menü (öffnet + schließt korrekt)
const catToggle = document.getElementById("catToggle");
const catList = document.getElementById("catList");

if (catToggle && catList) {
  catToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    catList.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!catList.contains(e.target) && !catToggle.contains(e.target)) {
      catList.classList.remove("open");
    }
  });
}
// ======================================
// Kategorie-Filter (funktionierendes Filtern)
// ======================================
const catButtons = document.querySelectorAll(".cat-btn");

catButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Aktive Kategorie speichern
    activeCategory = btn.dataset.cat;

    // Menü schließen, wenn gewählt
    catList.classList.remove("open");

    // Produkte neu rendern mit Filter
    renderFilteredAndSorted();
  });
});


// ✅ Wenn man außerhalb des Menüs klickt → Dropdown schließen
document.addEventListener("click", e => {
  if (!catList.contains(e.target) && !catToggle.contains(e.target)) {
    catList.classList.remove("open");
  }
});


}); // ← Ende DOMContentLoaded
