// ✅ Firebase Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc,
  setDoc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ✅ Firebase Config
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

// ✅ Login check
window.checkLogin = function () {
  const u = $("username").value.trim();
  const p = $("password").value.trim();

  if (u === "Admin" && p === "Miraggio@46") {
    localStorage.setItem("loggedIn", "yes");
    localStorage.setItem("username", u);
    localStorage.setItem("password", p);
    showMainApp();
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

// ✅ Show main app
function showMainApp() {
  $("loginBox").style.display = "none";
  $("mainApp").style.display = "block";
  showLogout();

  onSnapshot(query(itemsRef, orderBy("expiry")), renderItems);
  onSnapshot(query(namesRef, orderBy("name")), renderProductNames);
}

// ✅ Logout Button
function showLogout() {
  const btn = document.createElement("button");
  btn.textContent = "Esci";
  btn.className = "logout-btn";
  btn.onclick = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    location.reload();
  };
  document.body.appendChild(btn);
}

// ✅ Init
if (localStorage.getItem("loggedIn") === "yes"
    && localStorage.getItem("username") === "Admin"
    && localStorage.getItem("password") === "Miraggio@46") {
  showMainApp();
}
