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
  appId: "1:769456892190:web:9c2a2d676f1f2d85010f"
};

// ✅ Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const itemsRef = collection(db, "foodItems");
const namesRef = collection(db, "productNames");

// ✅ Helper for getElementById
function $(id) { return document.getElementById(id); }

// ========================
// LOGIN UI
// ========================
function showLogin() {
  document.body.innerHTML = `
    <h2 style="text-align:center; color:#4CAF50;">🔐 Accesso Amministratore</h2>
    <div style="max-width: 400px; margin: 30px auto;">
      <input id="username" placeholder="Username" style="width:100%; padding:10px; margin:10px 0;" />
      <input id="password" placeholder="Password" type="password" style="width:100%; padding:10px; margin:10px 0;" />
      <button onclick="checkLogin()" style="width:100%; padding:10px; background:#4CAF50; color:white; border:none;">Accedi</button>
    </div>
  `;
}

// ========================
// LOGOUT BUTTON UI
// ========================
function showLogout() {
  // Avoid duplicate logout button
  if ($("logoutBtn")) return;

  const btn = document.createElement("button");
  btn.id = "logoutBtn";
  btn.textContent = "Esci";
  btn.style.position = "fixed";
  btn.style.top = "10px";
  btn.style.right = "10px";
  btn.style.padding = "8px 14px";
  btn.style.background = "#f44336";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "9999px";
  btn.style.cursor = "pointer";
  btn.style.fontWeight = "600";
  btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
  btn.style.zIndex = "1000";
  btn.onmouseenter = () => btn.style.background = "#d32f2f";
  btn.onmouseleave = () => btn.style.background = "#f44336";
  btn.onclick = () => {
    localStorage.clear();
    location.reload();
  };
  document.body.appendChild(btn);
}

// ========================
// LOGIN CHECK
// ========================
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

// ========================
// ADD ITEM
// ========================
window.addItem = async function () {
  const name = $("itemName").value.trim();
  const prepared = $("datePrepared").value;
  const expiry = $("expiryDate").value;

  if (!name || !prepared || !expiry) {
    alert("Per favore, completa tutti i campi.");
    return;
  }

  try {
    await addDoc(itemsRef, { name, prepared, expiry });
    // Add to product names only if not exists
    await setDoc(doc(namesRef, name), { name });

    $("itemName").value = "";
    $("datePrepared").value = "";
    $("expiryDate").value = "";
  } catch (e) {
    alert("Errore nell'aggiunta del prodotto: " + e.message);
  }
};

// ========================
// DELETE ITEM
// ========================
window.deleteItem = async function (id) {
  if (confirm("Vuoi eliminare questo prodotto?")) {
    try {
      await deleteDoc(doc(itemsRef, id));
    } catch (e) {
      alert("Errore durante l'eliminazione: " + e.message);
    }
  }
};

// ========================
// EDIT ITEM
// ========================
window.editItem = async function (id, current) {
  const newName = prompt("Modifica nome prodotto:", current.name);
  const newPrepared = prompt("Modifica data di preparazione:", current.prepared);
  const newExpiry = prompt("Modifica data di scadenza:", current.expiry);
  if (newName && newPrepared && newExpiry) {
    try {
      await setDoc(doc(itemsRef, id), {
        name: newName,
        prepared: newPrepared,
        expiry: newExpiry
      });
      await setDoc(doc(namesRef, newName), { name: newName });
    } catch (e) {
      alert("Errore durante la modifica: " + e.message);
    }
  }
};

// ========================
// Format date dd/mm/yyyy
// ========================
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ========================
// Render Items in table
// ========================
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

// ========================
// Render product names for datalist
// ========================
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

// ========================
// START APP (after login)
// ========================
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
  showLogout();
  onSnapshot(query(itemsRef, orderBy("expiry")), renderItems);
  onSnapshot(query(namesRef, orderBy("name")), renderProductNames);
}

// ========================
// INITIALIZE
// ========================
if (localStorage.getItem("loggedIn") === "yes" 
    && localStorage.getItem("username") === "Admin" 
    && localStorage.getItem("password") === "Miraggio@46") {
  startApp();
} else {
  showLogin();
}
