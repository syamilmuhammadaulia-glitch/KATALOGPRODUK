import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  get,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBeQs6HOAgjTCpYuHM8V4rU5hmMCjeEwjM",
  authDomain: "teranacoffe.firebaseapp.com",
  databaseURL:
    "https://teranacoffe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "teranacoffe",
  storageBucket: "teranacoffe.firebasestorage.app",
  messagingSenderId: "392806775927",
  appId: "1:392806775927:web:708b3d0edd77c5ed45da72",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const menuRef = ref(db, "menu");

const CONFIG = {
  whatsappNumber: "62859106960106",
  adminPassword: "TERANA",
};

// TAMBAHKAN "Hot" di sini agar muncul saat klik "Semua"
const KNOWN_CATEGORIES = [
  "Coffee Utama",
  "Black Series",
  "Kopsus Series",
  "Botol 200ml",
  "Non-Coffee",
  "Hot",
  "Makanan",
  "Extra",
];

let products = [];
let cart = [];
let activeCat = "All";
let searchQuery = "";
let currentSelectItem = null;

// --- UTILS ---
function escapeHtml(str) {
  if (str == null) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

function escapeAttr(str) {
  if (str == null) return "";
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// 2. Data Default
const defaultMenu = [
  {
    name: "Langit Pagi",
    price: 12000,
    category: "Coffee Utama",
    img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300",
  },
  {
    name: "Peluk Hangat",
    price: 20000,
    category: "Coffee Utama",
    img: "https://images.unsplash.com/photo-1544787210-2211d74fc59c?w=300",
  },
  {
    name: "Coffee Latte",
    price: 23000,
    category: "Coffee Utama",
    img: "https://images.unsplash.com/photo-1570968015849-0497e07f393d?w=300",
  },
  {
    name: "Berricano",
    price: 14000,
    category: "Black Series",
    img: "berryxano.jpeg",
  },
  {
    name: "Cireng Isi, kuah keju",
    price: 15000,
    category: "Makanan",
    img: "cireng.jpeg",
  },
];

// Inisialisasi awal
products = defaultMenu.map((p, i) => ({ ...p, id: "init-" + i }));

// 3. Inisialisasi Database
async function initMenu() {
  try {
    const snap = await get(menuRef);
    if (!snap.exists()) {
      await Promise.all(defaultMenu.map((i) => push(menuRef, i)));
    }
  } catch (err) {
    console.error("Gagal inisialisasi menu:", err);
  }
}

// 4. Sinkronisasi Realtime
onValue(menuRef, (snap) => {
  const data = snap.val();
  if (data) {
    products = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
  }
  document.getElementById("loadingMenu")?.remove();
  renderProductGrid();
  renderAdminList();
});

// 5. Katalog & Render
function renderCard(p) {
  const image =
    p.img ||
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=300";
  return `
    <div class="card">
        <img src="${escapeAttr(image)}" alt="${escapeHtml(p.name)}" loading="lazy">
        <div class="card-info">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="price">Rp ${parseInt(p.price).toLocaleString()}</p>
            <button class="btn-add" data-add-cart="${escapeAttr(p.id)}" type="button">
              <i class="fas fa-cart-plus"></i> + Keranjang
            </button>
        </div>
    </div>`;
}

function renderProductGrid() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const filtered = products.filter((p) => {
    const matchCat = activeCat === "All" || p.category === activeCat;
    const matchSearch = (p.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const groups = activeCat === "All" ? KNOWN_CATEGORIES : [activeCat];
  grid.innerHTML = "";
  let hasAny = false;

  groups.forEach((groupName) => {
    const list = filtered.filter(
      (p) => (p.category || "").trim() === groupName,
    );
    if (list.length > 0) {
      hasAny = true;
      if (activeCat === "All") {
        grid.insertAdjacentHTML(
          "beforeend",
          `<h2 class="category-title">${groupName}</h2>`,
        );
      }
      const subGrid = document.createElement("div");
      subGrid.className = "sub-grid";
      subGrid.innerHTML = list.map((p) => renderCard(p)).join("");
      grid.appendChild(subGrid);
    }
  });

  if (!hasAny)
    grid.innerHTML =
      '<div class="empty-results"><p>Menu tidak ditemukan.</p></div>';
}

window.filterCategory = (cat) => {
  activeCat = cat;
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) =>
      b.classList.toggle(
        "active",
        b.innerText === cat || (cat === "All" && b.innerText === "Semua"),
      ),
    );
  renderProductGrid();
};

// 6. Keranjang
window.addToCart = (id) => {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  currentSelectItem = p;

  // Fitur tambahan: Sembunyikan opsi es jika kategori "Hot"
  const iceGroup = document.getElementById("optIce").closest(".option-group");
  if (p.category === "Hot") {
    iceGroup.style.display = "none";
    document.getElementById("optIce").value = "Hot (No Ice)";
  } else {
    iceGroup.style.display = "block";
    document.getElementById("optIce").value = "Normal Ice";
  }

  document.getElementById("optItemId").value = id;
  document.getElementById("optItemName").textContent = p.name;
  document.getElementById("optionsModal").style.display = "flex";
};

window.closeOptionsModal = () =>
  (document.getElementById("optionsModal").style.display = "none");

window.confirmAddToCart = () => {
  const sugar = document.getElementById("optSugar").value;
  const ice = document.getElementById("optIce").value;
  const note = document.getElementById("optNote").value;
  const p = currentSelectItem;

  const cartId = `${p.id}-${sugar}-${ice}-${note}`;
  const existing = cart.find((x) => x.cartId === cartId);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...p, cartId, qty: 1, options: { sugar, ice, note } });
  }

  updateUI();
  closeOptionsModal();
  showToast(p.name + " masuk keranjang!");
};

function updateUI() {
  let tot = 0;
  const itemsContainer = document.getElementById("cartItems");
  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-bag" style="font-size: 3rem; opacity: 0.1; margin-bottom: 15px; display: block;"></i>
        <p>Keranjangmu masih kosong</p>
      </div>`;
  } else {
    itemsContainer.innerHTML = cart
      .map((i, idx) => {
        tot += i.price * i.qty;
        return `
        <div class="cart-item-row">
            <div class="cart-item-header">
                <div class="cart-item-info">
                    <div class="cart-item-name">${escapeHtml(i.name)}</div>
                    <small>${i.qty} x Rp ${parseInt(i.price).toLocaleString()}</small>
                </div>
                <div class="cart-item-price">Rp ${(i.price * i.qty).toLocaleString()}</div>
                <button type="button" class="cart-item-del" onclick="delCart(${idx})">
                  <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div class="cart-item-options">
              <i class="fas fa-info-circle" style="margin-right: 5px; opacity: 0.5;"></i>
              ${i.options.sugar}, ${i.options.ice} 
              ${i.options.note ? `<div style="margin-top:4px; color: var(--brown);"><strong>Note:</strong> ${escapeHtml(i.options.note)}</div>` : ""}
            </div>
        </div>`;
      })
      .join("");
  }

  // Update Total Harga dengan animasi/style rapi
  const totalPriceEl = document.getElementById("totalPrice");
  if (totalPriceEl) {
    totalPriceEl.innerText = `Rp ${tot.toLocaleString()}`;
  }

  // Update Counter Badge
  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    const totalItems = cart.reduce((acc, curr) => acc + curr.qty, 0);
    cartCount.innerText = totalItems;
    cartCount.style.display = totalItems > 0 ? "flex" : "none";
  }
}

window.delCart = (i) => {
  cart.splice(i, 1);
  updateUI();
};

window.toggleCart = () => {
  document.getElementById("cartPanel")?.classList.toggle("active");
};

// 7. Checkout Logic (Tunai vs QRIS)
function toggleQrisDisplay() {
  const payment = document.querySelector(
    'input[name="checkoutPayment"]:checked',
  )?.value;
  const qris = document.getElementById("qrisContainer");
  if (qris) qris.style.display = payment === "QRIS" ? "block" : "none";
}

function validatePaymentLogic() {
  const pickup = document.querySelector(
    'input[name="checkoutPickup"]:checked',
  )?.value;
  const cashRadio = document.querySelector(
    'input[name="checkoutPayment"][value="Tunai"]',
  );
  const qrisRadio = document.querySelector(
    'input[name="checkoutPayment"][value="QRIS"]',
  );

  if (pickup === "delivery") {
    cashRadio.disabled = true;
    cashRadio.checked = false;
    qrisRadio.checked = true;
  } else {
    cashRadio.disabled = false;
  }
  toggleQrisDisplay();
}

window.openCheckoutModal = () => {
  if (!cart.length) return alert("Keranjang masih kosong!");
  document.getElementById("checkoutModal").style.display = "flex";

  // Default reset saat modal dibuka
  document.querySelector(
    'input[name="checkoutPickup"][value="dine in"]',
  ).checked = true;
  validatePaymentLogic();
};

window.closeCheckoutModal = () =>
  (document.getElementById("checkoutModal").style.display = "none");

// Listener Radio Buttons
document.querySelectorAll('input[name="checkoutPayment"]').forEach((r) => {
  r.addEventListener("change", toggleQrisDisplay);
});
document.querySelectorAll('input[name="checkoutPickup"]').forEach((r) => {
  r.addEventListener("change", validatePaymentLogic);
});

window.confirmSendWhatsApp = () => {
  const name = document.getElementById("checkoutName").value?.trim();
  if (!name) return alert("Mohon masukkan nama pembeli!");

  const pickup = document.querySelector(
    'input[name="checkoutPickup"]:checked',
  )?.value;
  const payment = document.querySelector(
    'input[name="checkoutPayment"]:checked',
  )?.value;

  let msg = `*PESANAN TERANA CAFFE*\n---------------------------\n`;
  msg += `*Nama:* ${name}\n*Ambil:* ${pickup}\n*Bayar:* ${payment}\n---------------------------\n\n`;

  cart.forEach((i) => {
    msg += `• ${i.name} (${i.qty}x)\n  [${i.options.sugar}, ${i.options.ice}]\n  ${i.options.note ? `Note: ${i.options.note}\n` : ""}  Subtotal: Rp ${(i.price * i.qty).toLocaleString()}\n\n`;
  });
  msg += `---------------------------\n*TOTAL: ${document.getElementById("totalPrice").innerText}*`;

  if (payment === "QRIS")
    msg += "\n\n *Saya akan kirim bukti pembayaran setelah ini.*";

  window.open(
    `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`,
  );
  closeCheckoutModal();
  cart = [];
  updateUI();
};

// 8. Admin
window.openAdminModal = () =>
  (document.getElementById("adminModal").style.display = "flex");
window.closeAdminModal = () => {
  document.getElementById("adminModal").style.display = "none";
  document.getElementById("adminPass").value = "";
};

window.doLogin = () => {
  if (document.getElementById("adminPass").value === CONFIG.adminPassword) {
    document
      .getElementById("loginSection")
      .classList.add("admin-action-hidden");
    document
      .getElementById("adminAction")
      .classList.remove("admin-action-hidden");
  } else {
    alert("Password Salah!");
  }
};

document.getElementById("addForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const file = document.getElementById("pImg").files[0];
  const name = document.getElementById("pName").value;
  const price = document.getElementById("pPrice").value;
  const category = document.getElementById("pCategory").value;

  const save = (imgData = null) => {
    push(menuRef, {
      name,
      price: parseInt(price),
      category,
      img: imgData,
    }).then(() => {
      e.target.reset();
      showToast("Menu ditambahkan!");
    });
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => save(reader.result);
    reader.readAsDataURL(file);
  } else {
    save();
  }
});

function renderAdminList() {
  const list = document.getElementById("adminList");
  if (!list) return;
  list.innerHTML = products
    .map(
      (p) => `
    <div class="admin-list-item">
        <div><b>${escapeHtml(p.name)}</b><br><small>${p.category}</small></div>
        <button onclick="delDB('${escapeAttr(p.id)}')">Hapus</button>
    </div>`,
    )
    .join("");
}

window.delDB = (id) => {
  if (confirm("Hapus menu ini?")) remove(ref(db, `menu/${id}`));
};

// 9. Search & Event Delegation
document.getElementById("searchInput")?.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderProductGrid();
});

document.getElementById("productGrid")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add-cart]");
  if (btn) addToCart(btn.dataset.addCart);
});

window.showToast = (msg) => {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
};

// Start
initMenu();
updateUI();
