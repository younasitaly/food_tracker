import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc,
  setDoc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
const itemsRef = collection(db, "foodItems");
const namesRef = collection(db, "productNames");

function $(id) {
  return document.getElementById(id);
}

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

window.deleteItem = async function (id) {
  if (confirm("Vuoi eliminare questo prodotto?")) {
    await deleteDoc(doc(itemsRef, id));
  }
};

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

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

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

onSnapshot(query(itemsRef, orderBy("expiry")), renderItems);
onSnapshot(query(namesRef, orderBy("name")), renderProductNames);
