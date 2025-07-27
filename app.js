// Firebase imports (Firestore only)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc,
  setDoc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAVmsiSzszfgCEk5qqnX57pGigoQtUafAU",
  authDomain: "food-tracker-fca47.firebaseapp.com",
  projectId: "food-tracker-fca47",
  storageBucket: "food-tracker-fca47.appspot.com",
  messagingSenderId: "769456892190",
  appId: "1:769456892190:web:9c2a2e7d676f1f2d85010f"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const itemsRef = collection(db, "foodItems");
const namesRef = collection(db, "productNames");

// Helper to get elements by id
function $(id) { return document.getElementById(id); }

// Show login form HTML
function showLogin() {
  document.body.innerHTML = `
    <h2 style="text-align:center; color:#4CAF50;">🔐 Accesso Amministratore</h2>
    <div style="max-width: 400px; margin: 0 auto;">
      <input id="username" placeholder="Username" style="width:100%; padding:10px; margin:10px 0;" />
      <input id="password" placeholder="Password" type="password" style="width:100%; padding:10px; margin:10px 0;" />
      <button id="loginBtn" style="width:100%; padding:10px; background:#4CAF50; color:white; border:none;">Accedi</button>
    </div>
  `;

  // Attach login click handler
  $("loginBtn").onclick = checkLogin;
}

// Show logout button on top right
function showLogout() {
  const btn = document.createElement("button");
  btn.textContent = "Logout";
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

// Check login credentials (hardcoded)
function checkLogin() {
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
}

// Format date from yyyy-mm-dd to dd/mm/yyyy
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y,m,d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// Render product names datalist
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

// Render food items table
function renderItems(snapshot) {
  const table = $("itemTable");
  table.innerHTML = "";
  const today = new Date();
  today.setHours(0,0,0,0);

  snapshot.forEach(docSnap => {
    const item = docSnap.data();
    const id = docSnap.id;
    const expiryDate = new Date(item.expiry);
    const daysLeft = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

    let status = "", rowClass = "";
    if (expiryDate < today) {
      status = "Scaduto"; rowClass = "background-color:#ffcccc;";
    } else if (daysLeft <= 1) {
      status = "In Scadenza"; rowClass = "background-color:#fff3cd;";
    } else {
      status = `${daysLeft} giorni rimasti`;
    }

    const row = document.createElement("tr");
    row.style = rowClass;
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${formatDate(item.prepared)}</td>
      <td>${formatDate(item.expiry)}</td>
      <td>${status}</td>
      <td>
        <button onclick='editItem("${id}")'>✏️</button>
        <button onclick='deleteItem("${id}")'>🗑️</button>
      </td>`;
    table.appendChild(row);
  });
}

// Add new food item
async function addItem() {
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
}

// Delete food item by id
async function deleteItem(id) {
  if (confirm("Vuoi eliminare questo prodotto?")) {
    await deleteDoc(doc(itemsRef, id));
  }
}

// Edit food item by id
async function editItem(id) {
  const docSnap = await doc(itemsRef, id).get();
  const current = (await doc(itemsRef, id).get()).data();

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
}

// Start main app UI after login
function startApp() {
  document.body.innerHTML = `
    <h1 style="text-align:center; color:#4CAF50;">Food Tracker Admin</h1>
    <div style="max-width: 600px; margin: 0 auto;">
      <form onsubmit="event.preventDefault(); addItem();">
        <input list="productList" id="itemName" placeholder="Nome prodotto" style="width: 100%; padding: 8px; margin-bottom: 10px;" />
        <datalist id="productList"></datalist>
        <input id="datePrepared" type="date" style="width: 100%; padding: 8px; margin-bottom: 10px;" />
        <input id="expiryDate" type="date" style="width: 100%; padding: 8px; margin-bottom: 10px;" />
        <button type="submit" style="width: 100%; padding: 10px; background:#4CAF50; color:white; border:none;">Aggiungi Prodotto</button>
      </form>
      <table border="1" cellspacing="0" cellpadding="6" style="width: 100%; margin-top: 20px;">
        <thead>
          <tr>
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

  // Re-add logout button
  showLogout();

  // Setup Firestore listeners
  onSnapshot(query(itemsRef, orderBy("expiry")), renderItems);
  onSnapshot(query(namesRef, orderBy("name")), renderProductNames);
}

// On page load, check login status
if (localStorage.getItem("loggedIn") === "yes" &&
    localStorage.getItem("username") === "Admin" &&
    localStorage.getItem("password") === "Miraggio@46") {
  startApp();
} else {
  showLogin();
}

// Expose needed functions globally (because used in inline HTML)
window.checkLogin = checkLogin;
window.addItem = addItem;
window.deleteItem = deleteItem;
window.editItem = editItem;
