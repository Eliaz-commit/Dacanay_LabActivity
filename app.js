"use strict";

const API_URL = "https://jsonplaceholder.typicode.com/posts";

const notesGrid = document.querySelector("#notes-grid");
const notePreview = document.querySelector("#note-preview");
const statusMessage = document.querySelector("#status-message");
const totalLabel = document.querySelector("#record-total");
const navCount = document.querySelector("#nav-count");
const visibleTotal = document.querySelector("#visible-total");
const searchInput = document.querySelector("#search-input");
const noteDialog = document.querySelector("#note-dialog");
const noteForm = document.querySelector("#note-form");
const aboutDialog = document.querySelector("#about-dialog");
const titleInput = document.querySelector("#note-title");
const bodyInput = document.querySelector("#note-body");
const idInput = document.querySelector("#note-id");
const saveButton = document.querySelector("#save-button");
const saveLabel = document.querySelector(".save-label");

let notes = [];
let selectedNoteId = null;
let messageTimer;

function showMessage(message, type = "info", persistent = false) {
  window.clearTimeout(messageTimer);
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.hidden = false;
  if (!persistent) {
    messageTimer = window.setTimeout(() => {
      statusMessage.hidden = true;
    }, 4500);
  }
}

function hideMessage() {
  window.clearTimeout(messageTimer);
  statusMessage.hidden = true;
}

function setLoading(isLoading) {
  notesGrid.setAttribute("aria-busy", String(isLoading));
  document.querySelector(".notes-workbench").setAttribute("aria-busy", String(isLoading));
  notesGrid.replaceChildren();
  if (isLoading) {
    notePreview.innerHTML = '<div class="preview-placeholder">Loading notes…</div>';
    for (let index = 0; index < 5; index += 1) {
      const skeleton = document.createElement("div");
      skeleton.className = "skeleton";
      skeleton.setAttribute("aria-hidden", "true");
      notesGrid.append(skeleton);
    }
  }
}

async function request(path = "", options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`The API returned ${response.status} ${response.statusText}.`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function renderNotes() {
  const query = searchInput.value.trim().toLowerCase();
  const visibleNotes = notes.filter((note) => `${note.title} ${note.body}`.toLowerCase().includes(query));
  totalLabel.textContent = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
  navCount.textContent = notes.length;
  visibleTotal.textContent = visibleNotes.length === notes.length ? "" : `${visibleNotes.length} shown`;
  notesGrid.setAttribute("aria-busy", "false");
  document.querySelector(".notes-workbench").setAttribute("aria-busy", "false");
  notesGrid.replaceChildren();

  if (visibleNotes.length === 0) {
    selectedNoteId = null;
    const empty = document.createElement("p");
    empty.className = "index-empty";
    empty.textContent = query ? "No matching notes." : "No notes yet.";
    notesGrid.append(empty);
    notePreview.innerHTML = query
      ? '<div class="preview-placeholder">Clear your search to see all notes.</div>'
      : '<div class="preview-placeholder">Create a note to get started.</div>';
    return;
  }

  if (!visibleNotes.some((note) => String(note.id) === String(selectedNoteId))) {
    selectedNoteId = visibleNotes[0].id;
  }

  visibleNotes.forEach((note) => {
    const item = document.createElement("button");
    item.className = `note-row${String(note.id) === String(selectedNoteId) ? " is-selected" : ""}`;
    item.type = "button";
    item.dataset.action = "select";
    item.dataset.id = String(note.id);
    item.setAttribute("aria-pressed", String(String(note.id) === String(selectedNoteId)));
    const title = escapeHtml(note.title);
    const body = escapeHtml(note.body);
    item.innerHTML = `<span class="row-title">${title}</span><span class="row-excerpt">${body}</span><span class="row-id">#${escapeHtml(note.id)}</span>`;
    notesGrid.append(item);
  });

  const selectedNote = visibleNotes.find((note) => String(note.id) === String(selectedNoteId));
  renderPreview(selectedNote);
}

function renderPreview(note) {
  if (!note) {
    notePreview.innerHTML = '<div class="preview-placeholder">Select a note to read it.</div>';
    return;
  }

  const title = escapeHtml(note.title);
  const body = escapeHtml(note.body).replace(/\n/g, "<br>");
  const id = escapeHtml(note.id);
  notePreview.innerHTML = `
    <div class="preview-topline"><span>NOTE #${id}</span><div class="preview-actions">
      <button class="text-button" type="button" data-action="edit" data-id="${id}">Edit</button>
      <button class="text-button delete-action" type="button" data-action="delete" data-id="${id}">Delete</button>
    </div></div>
    <h2>${title}</h2>
    <p class="preview-body">${body}</p>`;
}

async function loadNotes() {
  hideMessage();
  setLoading(true);
  totalLabel.textContent = "Loading…";
  try {
    const data = await request("?_limit=9");
    notes = data.map((record) => ({
      id: record.id,
      title: record.title,
      body: record.body,
    }));
    selectedNoteId = notes[0]?.id ?? null;
    renderNotes();
  } catch (error) {
    notes = [];
    renderNotes();
    showMessage(`Could not load notes. ${error.message} Check your connection and retry.`, "error", true);
    const retry = document.createElement("button");
    retry.className = "secondary-button";
    retry.type = "button";
    retry.textContent = "Retry request";
    retry.addEventListener("click", loadNotes, { once: true });
    statusMessage.append(" ", retry);
  }
}

function openCreateDialog() {
  noteForm.reset();
  idInput.value = "";
  document.querySelector("#dialog-title").textContent = "New note";
  saveLabel.textContent = "Save note";
  noteDialog.showModal();
  window.setTimeout(() => titleInput.focus(), 0);
}

function openEditDialog(note) {
  noteForm.reset();
  idInput.value = String(note.id);
  titleInput.value = note.title;
  bodyInput.value = note.body;
  document.querySelector("#dialog-title").textContent = "Edit note";
  saveLabel.textContent = "Update note";
  noteDialog.showModal();
  window.setTimeout(() => titleInput.focus(), 0);
}

async function saveNote(event) {
  event.preventDefault();
  if (!noteForm.reportValidity()) return;

  const id = idInput.value;
  const payload = {
    title: titleInput.value.trim(),
    body: bodyInput.value.trim(),
    userId: 1,
  };
  saveButton.disabled = true;
  saveLabel.textContent = id ? "Updating…" : "Saving…";
  document.querySelector("#form-hint").textContent = id ? "Updating this note through the API…" : "Creating your note through the API…";

  try {
    if (id) {
      const updated = await request(`/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(payload) });
      notes = notes.map((note) => String(note.id) === id
        ? { ...note, title: updated.title, body: updated.body }
        : note);
      selectedNoteId = updated.id;
      showMessage("Your note was updated successfully.", "success");
    } else {
      const created = await request("", { method: "POST", body: JSON.stringify(payload) });
      notes.unshift({ id: created.id, title: created.title, body: created.body });
      selectedNoteId = created.id;
      showMessage("Your new note was created successfully.", "success");
    }
    noteDialog.close();
    searchInput.value = "";
    renderNotes();
  } catch (error) {
    document.querySelector("#form-hint").textContent = "The request failed. Your note is still here; please try again.";
    saveLabel.textContent = id ? "Try update again" : "Try saving again";
    showMessage(`Could not save your note. ${error.message}`, "error");
  } finally {
    saveButton.disabled = false;
  }
}

async function deleteNote(note) {
  if (!window.confirm(`Delete “${note.title}”? This sends a DELETE request to the API.`)) return;
  showMessage(`Deleting “${note.title}”…`, "info", true);
  try {
    await request(`/${encodeURIComponent(note.id)}`, { method: "DELETE" });
    notes = notes.filter((item) => item.id !== note.id);
    renderNotes();
    showMessage("Your note was deleted successfully.", "success");
  } catch (error) {
    showMessage(`Could not delete your note. ${error.message}`, "error");
  }
}

document.querySelector("#new-note-button").addEventListener("click", openCreateDialog);
document.querySelector("#close-dialog").addEventListener("click", () => noteDialog.close());
noteForm.addEventListener("submit", saveNote);
searchInput.addEventListener("input", renderNotes);
document.querySelector("#about-button").addEventListener("click", () => aboutDialog.showModal());
document.querySelector("#about-done").addEventListener("click", () => aboutDialog.close());
document.querySelector(".about-close").addEventListener("click", () => aboutDialog.close());
notesGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const note = notes.find((item) => String(item.id) === button.dataset.id);
  if (!note) return;
  selectedNoteId = note.id;
  renderNotes();
  if (window.matchMedia("(max-width: 48rem)").matches) {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    notePreview.scrollIntoView({ behavior, block: "nearest" });
  }
});
notePreview.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const note = notes.find((item) => String(item.id) === button.dataset.id);
  if (!note) return;
  if (button.dataset.action === "edit") openEditDialog(note);
  if (button.dataset.action === "delete") deleteNote(note);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !noteDialog.open && !aboutDialog.open && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

loadNotes();
