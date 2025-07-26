import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVmsiSzszfgCEk5qqnX57pGigoQtUafAU",
  authDomain: "food-tracker-fca47.firebaseapp.com",
  projectId: "food-tracker-fca47",
  storageBucket: "food-tracker-fca47.firebasestorage.app",
  messagingSenderId: "769456892190",
  appId: "1:769456892190:web:9c2a2e7d676f1f2d85010f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const itemsRef = collection(db, "foodItems");
const namesRef = collection(db, "productNames");

onAuthStateChanged(auth, (user) => {
  const appSection = document.getElementById("appSection");
  if (user) {
    document.getElementById("authStatus").textContent = `Logged in as: ${user.email}`;
    appSection.style.display = "block";
    loadApp();
  } else {
    document.getElementById("authStatus").textContent = "Not logged in.";
    appSection.style.display = "none";
  }
});

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, password)
    .catch(e => alert("Login failed: " + e.message));
}

function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  createUserWithEmailAndPassword(auth, email, password)
    .catch(e => alert("Registration failed: " + e.message));
}

function logout() {
  signOut(auth);
}

function addItem() {
  const name = document.getElementById("itemName").value.trim();
  const prepared = document.getElementById("datePrepared").value;
  const expiry = document.getElementById("expiryDate").value;

  if (!name || !prepared || !expiry) {
    alert("Per favore, completa tutti i campi.");
    return;
  }

  addDoc(itemsRef, { name, prepared, expiry })
    .then(() => setDoc(doc(namesRef, name), { name }))
    .then(() => {
      document.getElementById("itemName").value = "";
      document.getElementById("datePrepared").value = "";
      document.getElementById("expiryDate").value = "";
    })
    .catch(e => alert("Errore durante il salvataggio: " + e.message));
}

function deleteItem(id) {
  if (confirm("Vuoi eliminare questo prodotto?")) {
    deleteDoc(doc(itemsRef, id));
  }
}

function editItem(id, current) {
  const newName = prompt("Modifica nome prodotto:", current.name);
  const newPrepared = prompt("Modifica data di preparazione:", current.prepared);
  const newExpiry = prompt("Modifica data di scadenza:", current.expiry);
  if (newName && newPrepared && newExpiry) {
    setDoc(doc(itemsRef, id), { name: newName, prepared: newPrepared, expiry: newExpiry });
    setDoc(doc(namesRef, newName), { name: newName });
  }
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function renderItems(snapshot) {
  const table = document.getElementById("itemTable");
  table.innerHTML = "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  snapshot.forEach(docSnap => {
    const item = docSnap.data();
    const id = docSnap.id;
    const expiryDate = new Date(item.expiry);
    const daysLeft = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

    let status = "", rowClass = "";
    if (expiryDate < today) { status = "Scaduto"; rowClass = "expired"; }
    else if (daysLeft <= 1) { status = "In Scadenza"; rowClass = "expiring-soon"; }
    else { status = `${daysLeft} giorni rimasti`; }

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

function renderProductNames(snapshot) {
  const datalist = document.getElementById("productList");
  datalist.innerHTML = "";
  snapshot.forEach(docSnap => {
    const name = docSnap.data().name;
    const opt = document.createElement("option");
    opt.value = name;
    datalist.appendChild(opt);
  });
}

function loadApp() {
  const itemQuery = query(itemsRef, orderBy("expiry"));
  const nameQuery = query(namesRef, orderBy("name"));
  onSnapshot(itemQuery, renderItems);
  onSnapshot(nameQuery, renderProductNames);
}
