const API = window.location.origin + "/api/patients";
let allPatients = [];
let editingId = null;

// ── LOAD ALL PATIENTS ──
async function loadPatients() {
  try {
    const res = await fetch(API);
    allPatients = await res.json();
    updateStats();
    filterPatients();
  } catch (err) {
    showToast("Could not connect to server.", "error");
  }
}

// ── STATS ──
function updateStats() {
  document.getElementById("total-count").textContent = allPatients.length;
  document.getElementById("waiting-count").textContent = allPatients.filter(p => p.status === "Waiting").length;
  document.getElementById("treated-count").textContent = allPatients.filter(p => p.status === "Treated").length;
}

// ── FILTER & SEARCH ──
function filterPatients() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const status = document.getElementById("status-filter").value;

  const filtered = allPatients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search) || p.condition.toLowerCase().includes(search);
    const matchStatus = status === "all" || p.status === status;
    return matchSearch && matchStatus;
  });

  renderTable(filtered);
}

// ── RENDER TABLE ──
function renderTable(patients) {
  const tbody = document.getElementById("patient-tbody");
  const noMsg = document.getElementById("no-patients");
  tbody.innerHTML = "";

  if (patients.length === 0) {
    noMsg.style.display = "block";
    return;
  }

  noMsg.style.display = "none";

  patients.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.age}</td>
      <td>${p.condition}</td>
      <td><span class="badge ${p.status.toLowerCase()}">${p.status}</span></td>
      <td>
        <div class="action-btns">
          ${p.status === "Waiting" ? `<button class="btn-treat" onclick="treatPatient(${p.id})">✔ Treat</button>` : ""}
          <button class="btn-edit" onclick="editPatient(${p.id})">✏ Edit</button>
          <button class="btn-delete" onclick="deletePatient(${p.id})">🗑 Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ── SUBMIT (ADD or UPDATE) ──
async function submitPatient() {
  const name = document.getElementById("name").value.trim();
  const age = document.getElementById("age").value.trim();
  const condition = document.getElementById("condition").value.trim();
  const msg = document.getElementById("form-message");

  if (!name || !age || !condition) {
    msg.textContent = "⚠ All fields are required.";
    msg.className = "error";
    return;
  }

  if (isNaN(age) || parseInt(age) <= 0) {
    msg.textContent = "⚠ Age must be a valid positive number.";
    msg.className = "error";
    return;
  }

  const payload = { name, age: parseInt(age), condition };

  try {
    let res;
    if (editingId) {
      res = await fetch(`${API}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();

    if (res.ok) {
      msg.textContent = editingId ? "✅ Patient updated!" : "✅ Patient added!";
      msg.className = "success";
      showToast(editingId ? "Patient updated successfully!" : "Patient added successfully!", "success");
      clearForm();
      loadPatients();
    } else {
      msg.textContent = "❌ " + data.error;
      msg.className = "error";
    }
  } catch (err) {
    msg.textContent = "❌ Server error.";
    msg.className = "error";
  }
}

// ── EDIT ──
function editPatient(id) {
  const patient = allPatients.find(p => p.id === id);
  if (!patient) return;

  document.getElementById("name").value = patient.name;
  document.getElementById("age").value = patient.age;
  document.getElementById("condition").value = patient.condition;
  document.getElementById("form-title").textContent = "✏ Edit Patient";
  document.getElementById("submit-btn").textContent = "Update Patient";
  document.getElementById("cancel-btn").classList.remove("hidden");
  document.getElementById("form-message").textContent = "";

  editingId = id;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEdit() {
  clearForm();
}

function clearForm() {
  document.getElementById("name").value = "";
  document.getElementById("age").value = "";
  document.getElementById("condition").value = "";
  document.getElementById("form-title").textContent = "➕ Register New Patient";
  document.getElementById("submit-btn").textContent = "Add Patient";
  document.getElementById("cancel-btn").classList.add("hidden");
  document.getElementById("form-message").textContent = "";
  editingId = null;
}

// ── TREAT ──
async function treatPatient(id) {
  try {
    const res = await fetch(`${API}/${id}/treat`, { method: "PUT" });
    if (res.ok) {
      showToast("Patient marked as Treated!", "success");
      loadPatients();
    }
  } catch (err) {
    showToast("Error updating patient.", "error");
  }
}

// ── DELETE ──
async function deletePatient(id) {
  if (!confirm("Are you sure you want to delete this patient?")) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Patient deleted.", "success");
      loadPatients();
    }
  } catch (err) {
    showToast("Error deleting patient.", "error");
  }
}

// ── TOAST ──
function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}-toast`;
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ── INIT ──
loadPatients();