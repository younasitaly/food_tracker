// ✅ Firebase Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc,
  setDoc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ✅ Config
const firebaseConfig = {
  apiKey: "AIzaSyAVmsiSzszfgCEk5qqnX57pGigoQtUafAU",
  authDomain: "food-tracker-fca47.firebaseapp.com",
  projectId: "food-tracker-fca47",
  storageBucket: "food-tracker-fca47.appspot.com",
  messagingSenderId: "769456892190",
  appId: "1:769456892190:web:9c2a2e7d676f1f2d85010f"
};

// ✅ Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const itemsRef = collection(db, "foodItems");
const namesRef = collection(db, "productNames");

function $(id) {
  return document.getElementById(id);
}

// ✅ Login UI
function showLogin() {
  document.body.innerHTML = `
    <div style="max-width: 400px; margin: 80px auto; padding: 20px;">
      <h2 style="text-align:center; color:#4CAF50;">🔐 Accesso Amministratore</h2>
      <input id="username" placeholder="Username" style="width:100%; padding:10px; margin:10px 0;" />
      <input id="password" placeholder="Password" type="password" style="width:100%; padding:10px; margin:10px 0;" />
      <button onclick="checkLogin()" style="width:100%; padding:10px; background:#4CAF50; color:white; border:none;">Accedi</button>
    </div>
  `;
}

// ✅ Logout UI
function showLogout() {
  const btn = document.createElement("button");
  btn.textContent = "Esci";
  btn.style = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 8px 14px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    z-index: 1000;
  `;
  btn.onclick = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    location.reload();
  };
  document.body.appendChild(btn);
}

// ✅ Login check
window.checkLogin = function () {
  const u = $("username").value.trim();
  const p = $("password").value.trim();

  if (u === "Admin" && p === "Miraggio@46") {
    localStorage.setItem("loggedIn", "yes");
    localStorage.setItem("username", u);
    localStorage.setItem("password", p);
    startApp();
  } else {
    alert("Credenziali non valide");
  }
};

// ✅ Add item
window.addItem = async function () {
  const name = $("itemName").value.trim();
  const prepared = $("datePrepared").value;
  const expiry = $("expiryDate").value;

  if (!name || !prepared || !expiry) {
    alert("Per favore, completa tutti i campi.");
    return;
  }

  await addDoc(itemsRef, { name, prepared, expiry });
  await setDoc(doc(namesRef, name), { name });

  $("itemName").value = "";
  $("datePrepared").value = "";
  $("expiryDate").value = "";
};

// ✅ Edit item
function editItem(id, current) {
  const newName = prompt("Modifica nome prodotto:", current.name);
  const newPrepared = prompt("Modifica data di preparazione:", current.prepared);
  const newExpiry = prompt("Modifica data di scadenza:", current.expiry);
  if (newName && newPrepared && newExpiry) {
    setDoc(doc(itemsRef, id), { name: newName, prepared: newPrepared, expiry: newExpiry });
    setDoc(doc(namesRef, newName), { name: newName });
  }
}
window.editItem = editItem;

// ✅ Delete item
function deleteItem(id) {
  if (confirm("Vuoi eliminare questo prodotto?")) {
    deleteDoc(doc(itemsRef, id));
  }
}
window.deleteItem = deleteItem;

// ✅ Format date
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ✅ Render items
function renderItems(snapshot) {
  const table = $("itemTable");
  table.innerHTML = "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  snapshot.forEach(docSnap => {
    const item = docSnap.data();
    const id = docSnap.id;
    const expiryDate = new Date(item.expiry);
    const daysLeft = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

    let status = "", rowClass = "";
    if (expiryDate < today) {
      status = "Scaduto"; rowClass = "expired";
    } else if (daysLeft <= 1) {
      status = "In Scadenza"; rowClass = "expiring-soon";
    } else {
      status = `${daysLeft} giorni rimasti`;
    }

    const row = document.createElement("tr");
    row.className = rowClass;
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${formatDate(item.prepared)}</td>
      <td>${formatDate(item.expiry)}</td>
      <td>${status}</td>
      <td>
        <button onclick='editItem("${id}", ${JSON.stringify(item)})'>✏️</button>
        <button onclick='deleteItem("${id}")'>🗑️</button>
      </td>`;
    table.appendChild(row);
  });
}

// ✅ Render product names
function renderProductNames(snapshot) {
  const datalist = $("productList");
  datalist.innerHTML = "";
  snapshot.forEach(docSnap => {
    const name = docSnap.data().name;
    const opt = document.createElement("option");
    opt.value = name;
    datalist.appendChild(opt);
  });
}

// ✅ Start app
function startApp() {
  document.body.innerHTML = `
    <div style="max-width: 600px; margin: 60px auto; padding: 15px;">
      <h2 style="text-align:center; color:#4CAF50;">🍲 Tracciatore Alimenti</h2>
      <form onsubmit="event.preventDefault(); addItem();">
        <input list="productList" id="itemName" placeholder="Nome prodotto" style="width:100%; padding:10px; margin-bottom:10px;" />
        <datalist id="productList"></datalist>
        <input id="datePrepared" type="date" style="width:100%; padding:10px; margin-bottom:10px;" />
        <input id="expiryDate" type="date" style="width:100%; padding:10px; margin-bottom:10px;" />
        <button type="submit" style="width:100%; padding:10px; background:#4CAF50; color:white; border:none;">Aggiungi Prodotto</button>
      </form>
      <table style="width:100%; margin-top:20px; border-collapse:collapse; background:white;">
        <thead>
          <tr style="background:#f0f0f0;">
            <th>Nome</th>
            <th>Preparato</th>
            <th>Scadenza</th>
            <th>Stato</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody id="itemTable"></tbody>
      </table>
    </div>
  `;
  showLogout();
  onSnapshot(query(itemsRef, orderBy("expiry")), renderItems);
  onSnapshot(query(namesRef, orderBy("name")), renderProductNames);
}

// ✅ Init
if (localStorage.getItem("loggedIn") === "yes"
    && localStorage.getItem("username") === "Admin"
    && localStorage.getItem("password") === "Miraggio@46") {
  startApp();
} else {
  showLogin();
}
