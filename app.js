import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDoc,
  addDoc, deleteDoc, onSnapshot, orderBy, query
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVmsiSzszfgCEk5qqnX57pGigoQtUafAU",
  authDomain: "food-tracker-fca47.firebaseapp.com",
  projectId: "food-tracker-fca47",
  storageBucket: "food-tracker-fca47.appspot.com",
  messagingSenderId: "769456892190",
  appId: "1:769456892190:web:9c2a2e7d676f1f2d85010f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const itemsRef = collection(db, "foodItems");
const namesRef = collection(db, "productNames");

const appDiv = document.getElementById("app");

function html(strings, ...values) {
  return strings.map((str, i) => str + (values[i] || "")).join("");
}

function renderLogin() {
  appDiv.innerHTML = html`
    <div class="login-box">
      <h2>🔐 Accesso Amministratore</h2>
      <input id="username" placeholder="Username" />
      <input id="password" type="password" placeholder="Password" />
      <button onclick="checkLogin()">Accedi</button>
    </div>
  `;
}

function renderApp() {
  appDiv.innerHTML = html`
    <div class="container">
      <h2>🍲 Tracciatore Alimenti</h2>
      <form onsubmit="event.preventDefault(); addItem();">
        <input id="itemName" list="productList" placeholder="Nome prodotto" />
        <datalist id="productList"></datalist>
        <input id="datePrepared" type="date" />
        <input id="expiryDate" type="date" />
        <button type="submit">Aggiungi Prodotto</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Nome</th><th>Preparato</th><th>Scadenza</th><th>Stato</th><th>Azioni</th>
          </tr>
        </thead>
        <tbody id="itemTable"></tbody>
      </table>
    </div>
    <button class="logout-btn" onclick="logout()">Esci</button>
  `;

  loadItems();
  loadProductNames();
}

window.checkLogin = function () {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();

  if (u === "Admin" && p === "Miraggio@46") {
    localStorage.setItem("loggedIn", "yes");
    renderApp();
  } else {
    alert("Credenziali non valide");
  }
};

window.logout = function () {
  localStorage.clear();
  location.reload();
};

window.addItem = async function () {
  const name = document.getElementById("itemName").value.trim();
  const prepared = document.getElementById("datePrepared").value;
  const expiry = document.getElementById("expiryDate").value;
  if (!name || !prepared || !expiry) {
    alert("Compila tutti i campi.");
    return;
  }
  await addDoc(itemsRef, { name, prepared, expiry });
  await setDoc(doc(namesRef, name), { name });
  document.getElementById("itemName").value = "";
  document.getElementById("datePrepared").value = "";
  document.getElementById("expiryDate").value = "";
};

window.editItem = async function (id) {
  const docSnap = await getDoc(doc(itemsRef, id));
  if (!docSnap.exists()) {
    alert("Prodotto non trovato");
    return;
  }
  const item = docSnap.data();
  const name = prompt("Modifica nome:", item.name);
  const prepared = prompt("Modifica data preparazione:", item.prepared);
  const expiry = prompt("Modifica data scadenza:", item.expiry);
  if (name && prepared && expiry) {
    await setDoc(doc(itemsRef, id), { name, prepared, expiry });
    await setDoc(doc(namesRef, name), { name });
  }
};

window.deleteItem = function (id) {
  if (confirm("Eliminare questo prodotto?")) {
    deleteDoc(doc(itemsRef, id));
  }
};

function formatDate(d) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function loadItems() {
  const q = query(itemsRef, orderBy("expiry"));
  onSnapshot(q, snapshot => {
    const tbody = document.getElementById("itemTable");
    tbody.innerHTML = "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const id = docSnap.id;
      const expiry = new Date(d.expiry);
      expiry.setHours(0, 0, 0, 0);
      const diff = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
      let status = "", cls = "";
      if (expiry < today) {
        status = "Scaduto"; cls = "expired";
      } else if (diff <= 1) {
        status = "In Scadenza"; cls = "expiring-soon";
      } else {
        status = `${diff} giorni`;
      }
      const row = document.createElement("tr");
      row.className = cls;
      row.innerHTML = `
        <td>${d.name}</td>
        <td>${formatDate(d.prepared)}</td>
        <td>${formatDate(d.expiry)}</td>
        <td>${status}</td>
        <td>
          <button onclick="editItem('${id}')">✏️</button>
          <button onclick="deleteItem('${id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  });
}

function loadProductNames() {
  onSnapshot(query(namesRef, orderBy("name")), snap => {
    const list = document.getElementById("productList");
    list.innerHTML = "";
    snap.forEach(doc => {
      const opt = document.createElement("option");
      opt.value = doc.data().name;
      list.appendChild(opt);
    });
  });
}

// Init
if (localStorage.getItem("loggedIn") === "yes") {
  renderApp();
} else {
  renderLogin();
}
