import { db, configOk } from "./firebase-config.js";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

// Nombre de la colección: cambia esto (y los campos del form) para crear más sistemas
// a partir de otras hojas, ej. "inventarioSwiss", "dinamica", "pcLaptop", etc.
const COLLECTION = "personal";
const CAMPOS = [
  "dni", "codigo", "nombre", "foto", "fechaIngreso",
  "puestoReal", "ccReal", "unidadReal", "nombreHost", "nuevaTarjetaMicros"
];

const estado = document.getElementById("estado");

function mostrarError(msg, err) {
  if (err) console.error(err);
  estado.textContent = msg + (err ? ` (${err.code || err.message})` : "");
  estado.hidden = false;
}

// Evita que el contenido guardado se interprete como HTML
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

async function guardar(e) {
  e.preventDefault();
  const f = document.forms.f;
  const data = {};
  CAMPOS.forEach(k => { data[k] = f[k].value.trim(); });
  try {
    await addDoc(collection(db, COLLECTION), data);
    f.reset();
    estado.hidden = true;
    cargar();
  } catch (err) {
    mostrarError("No se pudo guardar.", err);
  }
}

async function eliminar(id) {
  if (!confirm("¿Eliminar este registro?")) return;
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    cargar();
  } catch (err) {
    mostrarError("No se pudo eliminar.", err);
  }
}

async function cargar() {
  const tbody = document.getElementById("tbody");
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    tbody.innerHTML = "";
    snap.forEach(d => {
      const p = d.data();
      const tr = document.createElement("tr");
      tr.innerHTML = CAMPOS.map(k => `<td>${esc(p[k])}</td>`).join("") +
        `<td class="del" title="Eliminar">✕</td>`;
      tr.querySelector(".del").addEventListener("click", () => eliminar(d.id));
      tbody.appendChild(tr);
    });
  } catch (err) {
    mostrarError("No se pudieron cargar los datos. Revisa la configuración y las reglas de Firestore.", err);
  }
}

if (!configOk) {
  mostrarError("Falta la configuración de Firebase: copia .env.example a .env, rellena tus claves y reinicia \"npm run dev\".");
  document.querySelector("#form-personal button").disabled = true;
} else {
  document.getElementById("form-personal").addEventListener("submit", guardar);
  cargar();
}
