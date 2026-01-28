import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
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

let products = [];
let cart = [];
let activeCat = "All";
let currentSelectItem = null; // Untuk melacak item yang sedang dipilih opsinya

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
    name: "Kopi Pandan",
    price: 21000,
    category: "Coffee Utama",
    img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300",
  },
  {
    name: "Berricano",
    price: 14000,
    category: "Black Series",
    img: "berryxano.jpeg",
  },
  {
    name: "Pancano",
    price: 13000,
    category: "Black Series",
    img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300",
  },
  {
    name: "Espresso",
    price: 7000,
    category: "Black Series",
    img: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=300",
  },
  {
    name: "Double Espresso",
    price: 13000,
    category: "Black Series",
    img: "https://images.unsplash.com/photo-1579992357154-faf4bfeaf505?w=300",
  },
  {
    name: "Manual Brew",
    price: 19000,
    category: "Black Series",
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300",
  },
  {
    name: "Kopi Gula Aren",
    price: 21000,
    category: "Kopsus Series",
    img: "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=300",
  },
  {
    name: "Kopi Caramel",
    price: 20000,
    category: "Kopsus Series",
    img: "https://images.unsplash.com/photo-1572286258217-40142c1c6a70?w=300",
  },
  {
    name: "Spanish Latte",
    price: 19000,
    category: "Kopsus Series",
    img: "https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=300",
  },
  {
    name: "Mocca Latte",
    price: 23000,
    category: "Kopsus Series",
    img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300",
  },
  {
    name: "Sanger Coffee",
    price: 20000,
    category: "Kopsus Series",
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300",
  },
  {
    name: "Matcha Blizz",
    price: 20000,
    category: "Non-Coffee",
    img: "https://images.unsplash.com/photo-1582782630126-b1062ee469f1?w=300",
  },
  {
    name: "Choco Deluxe",
    price: 19000,
    category: "Non-Coffee",
    img: "https://images.unsplash.com/photo-1544787210-2211d74fc59c?w=300",
  },
  {
    name: "Cireng Isi, kuah keju",
    price: 15000,
    category: "Makanan",
    img: "cireng.jpeg",
  },
];

// 3. Inisialisasi Database
async function initMenu() {
  const snap = await get(menuRef);
  if (!snap.exists()) {
    await Promise.all(defaultMenu.map((i) => push(menuRef, i)));
  }
}

// 4. Sinkronisasi Realtime
onValue(menuRef, (snap) => {
  products = [];
  const data = snap.val();
  if (data) {
    Object.keys(data).forEach((k) => products.push({ id: k, ...data[k] }));
  }
  filterCategory(activeCat);
  renderAdminList();
});

// 5. Logika Katalog & Render Card
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

  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const groups =
    cat === "All"
      ? [
          "Coffee Utama",
          "Black Series",
          "Kopsus Series",
          "Botol 200ml",
          "Non-Coffee",
          "Makanan",
          "Extra",
        ]
      : [cat];

  groups.forEach((groupName) => {
    const filtered = products.filter((p) => p.category === groupName);
    if (filtered.length > 0) {
      if (cat === "All") {
        const title = document.createElement("h2");
        title.className = "category-title";
        title.innerText = groupName;
        grid.appendChild(title);
      }
      const subGrid = document.createElement("div");
      subGrid.className = "sub-grid";
      subGrid.innerHTML = filtered.map((p) => renderCard(p)).join("");
      grid.appendChild(subGrid);
    }
  });
};

function renderCard(p) {
  const image =
    p.img ||
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=300";
  return `
    <div class="card">
        <img src="${image}" alt="${p.name}" loading="lazy">
        <div class="card-info">
            <h3>${p.name}</h3>
            <p class="price">Rp ${parseInt(p.price).toLocaleString()}</p>
            <button class="btn-add" onclick="addToCart('${p.id}')">
              <i class="fas fa-cart-plus"></i> + Keranjang
            </button>
        </div>
    </div>`;
}

// 6. Logika Keranjang & Opsi
window.addToCart = (id) => {
  const p = products.find((x) => x.id === id);
  if (!p) return;

  currentSelectItem = p;
  document.getElementById("optItemId").value = id;
  document.getElementById("optItemName").innerText = p.name;
  document.getElementById("optSugar").value = "Normal Sugar";
  document.getElementById("optIce").value = "Normal Ice";
  document.getElementById("optNote").value = "";

  document.getElementById("optionsModal").style.display = "flex";
};

window.closeOptionsModal = () => {
  document.getElementById("optionsModal").style.display = "none";
};

window.confirmAddToCart = () => {
  const id = document.getElementById("optItemId").value;
  const sugar = document.getElementById("optSugar").value;
  const ice = document.getElementById("optIce").value;
  const note = document.getElementById("optNote").value;
  const p = currentSelectItem;

  const cartId = `${id}-${sugar}-${ice}-${note}`;
  const ex = cart.find((x) => x.cartId === cartId);

  if (ex) {
    ex.qty++;
  } else {
    cart.push({ ...p, cartId, qty: 1, options: { sugar, ice, note } });
  }

  updateUI();
  closeOptionsModal();
  showToast(`${p.name} masuk keranjang!`);
};

function updateUI() {
  let tot = 0;
  const itemsContainer = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");

  if (cart.length === 0) {
    itemsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#888;">Keranjang kosong</div>`;
  } else {
    itemsContainer.innerHTML = cart
      .map((i, idx) => {
        tot += i.price * i.qty;
        return `
          <div class="cart-item-row" style="display:flex; flex-direction:column; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1">
                    <div style="font-weight:600; font-size:0.9rem">${i.name}</div>
                    <small style="color:#777">${i.qty} x Rp ${parseInt(i.price).toLocaleString()}</small>
                </div>
                <div style="font-weight:700; margin-right:15px;">Rp ${(i.price * i.qty).toLocaleString()}</div>
                <span onclick="delCart(${idx})" style="color:#e74c3c; cursor:pointer;"><i class="fas fa-trash"></i></span>
              </div>
              <div style="font-size: 0.75rem; color: #888; margin-top: 5px; background: #f9f9f9; padding: 5px; border-radius: 4px;">
                Opsi: ${i.options.sugar}, ${i.options.ice} ${i.options.note ? `<br>Note: ${i.options.note}` : ""}
              </div>
          </div>`;
      })
      .join("");
  }

  document.getElementById("totalPrice").innerText =
    `Rp ${tot.toLocaleString()}`;
  if (cartCount)
    cartCount.innerText = cart.reduce((acc, curr) => acc + curr.qty, 0);
}

window.delCart = (i) => {
  cart.splice(i, 1);
  updateUI();
};

window.toggleCart = () =>
  document.getElementById("cartPanel")?.classList.toggle("active");

// 7. WhatsApp dengan Detail Opsi
window.sendWhatsApp = () => {
  if (!cart.length) return alert("Keranjang masih kosong!");
  let t = "*PESANAN TERANA CAFFE*\n---------------------------\n";
  cart.forEach((i) => {
    t += `• ${i.name} (${i.qty}x)\n`;
    t += `  [${i.options.sugar}, ${i.options.ice}]\n`;
    if (i.options.note) t += `  Catatan: ${i.options.note}\n`;
    t += `  Subtotal: Rp ${(i.price * i.qty).toLocaleString()}\n\n`;
  });
  t += `---------------------------\n*TOTAL: ${document.getElementById("totalPrice").innerText}*`;
  window.open(`https://wa.me/62859106960106?text=${encodeURIComponent(t)}`);
};

// 8. Admin & Cloud Sync
window.openAdminModal = () =>
  (document.getElementById("adminModal").style.display = "flex");
window.closeAdminModal = () =>
  (document.getElementById("adminModal").style.display = "none");
window.doLogin = () => {
  if (document.getElementById("adminPass").value === "TERANA") {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("adminAction").style.display = "block";
  } else {
    alert("Password Admin Salah!");
  }
};

const addForm = document.getElementById("addForm");
if (addForm) {
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = document.getElementById("pImg").files[0];
    const name = document.getElementById("pName").value;
    const price = document.getElementById("pPrice").value;
    const category = document.getElementById("pCategory").value;

    const save = (imgBase64 = null) => {
      push(menuRef, {
        name,
        price: parseInt(price),
        category,
        img: imgBase64,
      }).then(() => {
        e.target.reset();
        alert(`Berhasil! ${name} ditambahkan.`);
      });
    };
    if (f) {
      const r = new FileReader();
      r.onload = () => save(r.result);
      r.readAsDataURL(f);
    } else {
      save();
    }
  });
}

function renderAdminList() {
  const list = document.getElementById("adminList");
  if (!list) return;
  list.innerHTML = products
    .map(
      (p) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee; font-size:0.85rem">
        <div><b>${p.name}</b><br><small style="color:#c8a27c;">${p.category}</small></div>
        <button onclick="delDB('${p.id}')" style="color:white; border:none; background:#e74c3c; padding:5px 10px; border-radius:4px; cursor:pointer">Hapus</button>
    </div>`,
    )
    .join("");
}

window.delDB = (id) => {
  if (confirm("Hapus selamanya?")) remove(ref(db, `menu/${id}`));
};

// 9. Search & Toast
const sInput = document.getElementById("searchInput");
if (sInput) {
  sInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = products.filter((p) => p.name.toLowerCase().includes(val));
    document.getElementById("productGrid").innerHTML =
      `<div class="sub-grid">${filtered.map((p) => renderCard(p)).join("")}</div>`;
  });
}

window.showToast = (msg) => {
  const t = document.getElementById("toast");
  if (!t) return;
  t.innerText = msg;
  t.classList.add("show");
  t.style.opacity = "1";
  setTimeout(() => {
    t.style.opacity = "0";
    t.classList.remove("show");
  }, 2000);
};

initMenu();
