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

// ✅ Helpers
function $(id) {
  return document.getElementById(id);
}

// ✅ Login UI
function showLogin() {
  document.body.innerHTML = `
    <h2 style="text-align:center; color:#4CAF50;">🔐 Accesso Amministratore</h2>
    <div style="max-width: 400px; margin: 20px auto; padding: 0 10px;">
      <input id="username" placeholder="Username" style="width:100%; padding:10px; margin:10px 0; font-size:16px;" />
      <input id="password" placeholder="Password" type="password" style="width:100%; padding:10px; margin:10px 0; font-size:16px;" />
      <button onclick="checkLogin()" style="width:100%; padding:12px; background:#4CAF50; color:white; border:none; font-weight:bold; font-size:16px; cursor:pointer;">Accedi</button>
    </div>
  `;
}

// ✅ Logout button UI (green and neat)
function showLogout() {
  const btn = document.createElement("button");
  btn.textContent = "Esci";
  btn.style = `
    position: fixed;
    top: 12px;
    right: 12px;
    padding: 8px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
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

// ✅ Check login
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

// ✅ Add Item
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

// ✅ Delete Item
window.deleteItem = async function (id) {
  if (confirm("Vuoi eliminare questo prodotto?")) {
    await deleteDoc(doc(itemsRef, id));
  }
};

// ✅ Edit Item
window.editItem = async function (id, current) {
  const newName = prompt("Modifica nome prodotto:", current.name);
  const newPrepared = prompt("Modifica data di preparazione:", current.prepared);
  const newExpiry = prompt("Modifica data di scadenza:", current.expiry);
  if (newName && newPrepared && newExpiry) {
    await setDoc(doc(itemsRef, id), {
      name: newName,
      prepared: newPrepared,
      expiry: newExpiry
    });
    await setDoc(doc(namesRef, newName), { name: newName });
  }
};

// ✅ Format date
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ✅ Render Items
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
        <button onclick='editItem("${id}", ${JSON.stringify(item)})' style="cursor:pointer;">✏️</button>
        <button onclick='deleteItem("${id}")' style="cursor:pointer;">🗑️</button>
      </td>`;
    table.appendChild(row);
  });
}

// ✅ Render Product Names
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

// ✅ Start app UI after login
function startApp() {
  document.body.innerHTML = `
    <h1 style="text-align:center; color:#4CAF50; margin-top: 20px;">🍲 Food Tracker Admin</h1>
    <div style="max-width: 600px; margin: 20px auto; padding: 0 10px;">
