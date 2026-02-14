// =========================
// DIDx Reporting — Clean JS (localStorage prototype; Supabase-ready)
// =========================

// === Embedded logo (portable across browsers/machines) ===
window.addEventListener("error", (e) => {
  console.error("🔥 Global error caught:", e.error || e.message);
});

const SUPABASE_URL = "https://vhbbrzmptbmlacowsqwe.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYmJyem1wdGJtbGFjb3dzcXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDYwNTgsImV4cCI6MjA4NjMyMjA1OH0.9rYVGmAyj_L4YqwEmitcxFzGzWnitoHrF5nA7lfc1pY";

const { createClient } = supabase;

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { "x-dev-key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYmJyem1wdGJtbGFjb3dz" } }
});


function isMissingColumnError(err) {
  // Postgres undefined_column
  return !!err && (err.code === "42703" || String(err.message || "").includes("does not exist"));
}


/***********************
 * USERS / ROLES (prototype)
 ***********************/
const USERS = [
  { id: "matesi", name: "Dr. Matesi", role: "superadmin" },
  { id: "tsu", name: "Dr. Tsu", role: "associate" },
  // later: interns rotate
  { id: "intern1", name: "Intern (rotating)", role: "intern" },
];
const STUDY_DETAIL_OPTIONS = [
  "Limited",
  "Medium",
  "Large",
  "Bilateral TMJ limited",
];

function isRadiologist(u) {
  return !!u && (u.role === "superadmin" || u.role === "associate");
}
function isIntern(u) {
  return !!u && u.role === "intern";
}
function isAdmin(u) {
  return !!u && u.role === "superadmin";
}

const app = {
  tab: "pending", // "pending" | "completed"
  currentUserId: "matesi",
  assignedFilter: "all", // "all" | "matesi" | "tsu"
};

function currentUser() {
  return USERS.find((u) => u.id === app.currentUserId) || USERS[0];
}
function didxConfirm({
  title,
  message,
  okText = "OK",
  cancelText = "Cancel",
  danger = false,
}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal show";
    overlay.setAttribute("aria-hidden", "false");

    const card = document.createElement("div");
    card.className = "modalCard";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");

    const h = document.createElement("div");
    h.className = "modalTitle";
    h.textContent = title || "Confirm";

    const body = document.createElement("div");
    body.className = "modalBody";
    body.innerHTML = `<div style="line-height:1.4; padding:6px 2px;">${String(message || "")}</div>`;

    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.gap = "10px";
    footer.style.justifyContent = "flex-end";
    footer.style.marginTop = "14px";

    const btnCancel = document.createElement("button");
    btnCancel.className = "btn";
    btnCancel.type = "button";
    btnCancel.textContent = cancelText;

    const btnOk = document.createElement("button");
    btnOk.className = danger ? "btn danger" : "btn";
    btnOk.type = "button";
    btnOk.textContent = okText;

    footer.appendChild(btnCancel);
    footer.appendChild(btnOk);
    body.appendChild(footer);

    card.appendChild(h);
    card.appendChild(body);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    function close(val) {
      overlay.remove();
      resolve(val);
    }

    btnCancel.onclick = () => close(false);
    btnOk.onclick = () => close(true);

    overlay.onclick = (e) => {
      if (e.target === overlay) close(false);
    };

    document.addEventListener(
      "keydown",
      function onKey(e) {
        if (e.key === "Escape") {
          document.removeEventListener("keydown", onKey);
          close(false);
        }
      },
      { once: true },
    );
  });
}

/***********************
 * TEST CASES (demo only; no API)
 ***********************/
const TEST_CASES = {
  "UID-0001": {
    uid: "UID-0001",
    patient: "Doe, Jane",
    dob: "1987-04-12",
    sex: "F",
    studyDate: "2026-02-03",
    race: "—",
    history: "—",
    indications: "—",
    medicalHistory: "—",
    referring: "Napa Smiles - Dr. Patel",
  },
  "UID-0002": {
    uid: "UID-0002",
    patient: "Smith, John",
    dob: "1975-09-08",
    sex: "M",
    studyDate: "2026-02-03",
    race: "—",
    history: "—",
    indications: "—",
    medicalHistory: "—",
    referring: "Oak Dental - Dr. Nguyen",
  },
  "UID-0003": {
    uid: "UID-0003",
    patient: "Lee, Min",
    dob: "1992-01-22",
    sex: "U",
    studyDate: "2026-02-04",
    race: "—",
    history: "—",
    indications: "—",
    medicalHistory: "—",
    referring: "Marin OMS - Dr. Cohen",
  },
};

const DEMO_UIDS = ["UID-0001", "UID-0002", "UID-0003"];

/***********************
 * FOV options
 ***********************/
const FROM_OPTIONS = [
  "the left maxillary tuberosity",
  "the right maxillary tuberosity",
  "the left pterygoid plate",
  "the right pterygoid plate",
  "the left mandibular ramus",
  "the right mandibular ramus",
  "near the level of the skull vertex",
  "the level of the frontal bone",
  "the level of the frontal sinuses",
  "the level of the nasal bones",
  "the level of the ethmoid air cells",
  "the level of the sella turcica",
  "the level of the sphenoid sinuses",
  "the level of the clivus",
  "the level of basion",
  "the level of the middle nasal conchae",
  "the level of the inferior nasal conchae",
  "the level of the occipital condyles",
  "the level of C1",
  "the level of the odontoid process of C2",
  "the level of C2",
  "the level of the anterior nasal spine",
  "the level of the inferior meatuses",
  "the level of the hard palate",
  "the level of the apices of the maxillary teeth",
  "the level of the midroot of the maxillary teeth",
  "the level of the CEJ of the maxillary teeth",
  "the level of the crowns of the maxillary teeth",
  "the level of the occlusal plane",
  "the temporal bone",
];

const TO_OPTIONS = [
  "the occlusal plane",
  "the crowns of the mandibular teeth",
  "the CEJ of the mandibular teeth",
  "the midroot of the mandibular teeth",
  "the apices of the mandibular teeth",
  "C1",
  "the odontoid process of C2",
  "C2",
  "C3",
  "C4",
  "the inferior border of the mandible",
  "the epiglottis",
  "the hyoid bone",
  "C5",
  "C6",
  "C7",
  "T1",
  "the subcondylar region in a closed mouth position",
  "the subcondylar region in a partial open mouth position",
  "the subcondylar region in an open mouth position",
];

/***********************
 * ADD-ONS (mutual exclusion)
 ***********************/
const ADD_ONS = [
  "Rush (24-hr TAT)",
  "STAT (3-hr TAT)",
  "CBCT Cephalometric Analysis",
  "Detailed Airway Assessment",
  "Comparison Study",
  "Skeletal Maturity Assessment (Cervical Spine)",
  "Detailed Implant Site Assessment",
  "Each Additional Site",
  "Add Literature References",
];
const ADDON_MUTUAL_EXCLUSIVE = [["Rush (24-hr TAT)", "STAT (3-hr TAT)"]];

/***********************
 * STORAGE KEYS
 ***********************/
const SIGNATURE_KEY = "didx_signature_dataurl_v1";
const LOGO_KEY = "didx_logo_dataurl_v1";

// Per-UID entries (Supabase-ready)
const CASE_PREFIX = "didx_case_v1_";
const REPORT_PREFIX = "didx_report_v6_";
const MIGRATE_FLAG = "didx_reports_v6_migrated_to_per_uid_v1";
const LEGACY_BLOB_KEY = "didx_reports_v6"; // old blob (if present)

/***********************
 * DOM helpers
 ***********************/
function $(id) {
  return document.getElementById(id);
}

function toast(msg, kind) {
  const el = $("toast");
  if (!el) {
    console.log(`[toast${kind ? ":" + kind : ""}]`, msg);
    return;
  }
  el.className =
    "toast show" + (kind === "ok" ? " ok" : kind === "bad" ? " bad" : "");
  el.textContent = msg;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.className = "toast"), 2600);
}
function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)[1];
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function downscaleDataUrl(dataUrl, maxW = 900, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const c = document.createElement("canvas");
      c.width = img.width * scale;
      c.height = img.height * scale;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
async function uploadScreenshot(caseUid, blob, title) {
  const ext = (blob.type || "image/png").split("/")[1] || "png";
  const safe = String(title || "screenshot")
    .replace(/[^a-z0-9]+/gi, "_")
    .toLowerCase()
    .slice(0, 60);
  const path = `pasted/${Date.now()}_${safe}.${ext}`;

  // 1) Upload to Storage
  const up = await sb.storage.from("Screenshots").upload(path, blob, {
    contentType: blob.type || "image/png",
    upsert: false,
  });
  if (up.error) throw up.error;

  // 2) Write metadata to DB
  // Your table might use either case_uid OR uid to link screenshots → cases.
  // We try case_uid first, then fallback to uid if the column doesn't exist.
  const baseRow = {
    title,
    storage_bucket: "Screenshots",
    storage_path: path,
    mime_type: blob.type,
    sort_order: 999,
  };

  let ins = await sb
    .from("case_screenshots")
    .insert([{ ...baseRow, case_uid: caseUid }])
    .select()
    .single();

  if (ins.error && isMissingColumnError(ins.error)) {
    ins = await sb
      .from("case_screenshots")
      .insert([{ ...baseRow, uid: caseUid }])
      .select()
      .single();
  }

  if (ins.error) throw ins.error;
  return ins.data;
}

async function loadScreenshots(caseUid) {
  // Try case_uid first, fallback to uid
  let q = await sb
    .from("case_screenshots")
    .select("*")
    .eq("case_uid", caseUid)
    .order("sort_order")
    .order("created_at");

  if (q.error && isMissingColumnError(q.error)) {
    q = await sb
      .from("case_screenshots")
      .select("*")
      .eq("uid", caseUid)
      .order("sort_order")
      .order("created_at");
  }

  if (q.error) throw q.error;

  const data = q.data || [];
  for (const s of data) {
    const { data: signed, error } = await sb.storage
      .from(s.storage_bucket || "Screenshots")
      .createSignedUrl(s.storage_path, 3600);
    if (!error) s.url = signed.signedUrl;
  }
  return data;
}


async function clearAllScreenshotsForCase() {
  const uid = state.selectedUid;
  if (!uid) return;

  const ok = await didxConfirm({
    title: "Clear all screenshots?",
    message: "This will permanently remove all screenshots for this case.",
    okText: "Clear",
    cancelText: "Cancel",
    danger: true,
  });

  if (!ok) return;
  await doClearAllScreenshotsForCase();
}

async function doClearAllScreenshotsForCase() {
  const shots = (state.screenshots || []).slice();
  if (!shots.length) return;

  try {
    for (const s of shots) {
      await deleteScreenshot(s.id, s.storage_bucket, s.storage_path);
    }

    state.screenshots = [];
    renderShots();
    render();
    toast("Screenshots cleared.", "ok");
  } catch (e) {
    console.error("Clear screenshots failed", e);
    toast("Failed to clear screenshots.", "bad");
  }
}
async function updateScreenshotTitle(id, title) {
  await sb.from("case_screenshots").update({ title }).eq("id", id);
}

async function deleteScreenshot(id, bucket, path) {
  await sb.storage.from(bucket).remove([path]);
  await sb.from("case_screenshots").delete().eq("id", id);
}

async function saveScreenshotOrder(screenshots) {
  const updates = screenshots.map((s, i) => ({
    id: s.id,
    sort_order: i,
  }));
  await sb.from("case_screenshots").upsert(updates);
}
function initScreenshots() {
  if (window.__SCREENSHOTS_INIT__) return;
  window.__SCREENSHOTS_INIT__ = true;

  const drop = $("shotDrop");
  const catcher = $("pasteCatcher"); // ✅ matches your HTML id
  const fileInput = $("fileShot");

  const modal = $("modal");
  const modalInput = $("modalInput");
  const modalPreset = $("modalPreset");
  const modalCancel = $("modalCancel");
  const modalSave = $("modalSave");

  let armed = false,
    armTimer = null;

  function armPaste(ms = 60000) {
    armed = true;
    clearTimeout(armTimer);
    armTimer = setTimeout(() => (armed = false), ms);
  }

  function openModal() {
    modal.classList.add("show");
    modalInput.value = "";
    modalPreset.value = "";
    modalInput.focus();
  }

  function closeModal() {
    modal.classList.remove("show");
    state.pendingShotBlob = null;
    catcher?.focus();
  }
  // 1) Init preset combo (must come first)
  initComboBox({
    wrapId: "comboShotPreset",
    inputId: "modalPreset",
    menuId: "menuShotPreset",
    options: SHOT_PRESETS,
    onChange: () => {}, // we don't autosave on preset typing
  });

  // 2) Mirror preset selection into the real title field
  (function wirePresetToTitle() {
    const presetInput = $("modalPreset");
    const titleInput = $("modalInput");
    if (!presetInput || !titleInput) return;

    presetInput.addEventListener("input", () => {
      // If you want: only mirror when preset exactly matches a preset:
      // if (!SHOT_PRESETS.includes(presetInput.value)) return;

      titleInput.value = presetInput.value;
      titleInput.focus({ preventScroll: true });
      // put cursor at end
      try {
        titleInput.setSelectionRange(
          titleInput.value.length,
          titleInput.value.length,
        );
      } catch {}
    });
  })();

  // ✅ Case switch: load shots for that UID
  document.addEventListener("case:changed", async (e) => {
    const uid = e?.detail?.uid;
    if (!uid) return;

    state.selectedUid = uid;

    state.screenshots = [];
    renderShots();

    try {
      state.screenshots = await loadScreenshots(uid);
      renderShots();
    } catch (err) {
      console.error(err);
      toast("Failed to load screenshots for this case", "bad");
    }
  });

  async function handleImageFile(file) {
    if (!state.selectedUid) return toast("Select a case first", "bad");

    const raw = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

    const scaled = await downscaleDataUrl(raw);
    state.pendingShotBlob = dataUrlToBlob(scaled);
    openModal();
  }

  async function saveShot() {
    if (!state.selectedUid) return toast("No case selected", "bad");

    const uid = state.selectedUid;
    const title =
      modalInput.value.trim() || modalPreset.value.trim() || "Screenshot";

    try {
      await uploadScreenshot(uid, state.pendingShotBlob, title);
      state.screenshots = await loadScreenshots(uid);
      renderShots();
      closeModal();
      toast("Screenshot saved", "ok");
    } catch (e) {
      console.error(e);
      toast("Failed to save screenshot", "bad");
    }
  }

  // Paste into hidden catcher
  catcher?.addEventListener("paste", (e) => {
    armPaste();
    const item = [...(e.clipboardData?.items || [])].find((i) =>
      i.type.startsWith("image/"),
    );
    if (!item) return;
    e.preventDefault();
    handleImageFile(item.getAsFile());
  });

  // Global paste (when armed)
  document.addEventListener(
    "paste",
    (e) => {
      if (!armed || modal.classList.contains("show")) return;
      const item = [...(e.clipboardData?.items || [])].find((i) =>
        i.type.startsWith("image/"),
      );
      if (!item) return;
      e.preventDefault();
      handleImageFile(item.getAsFile());
    },
    true,
  );

  drop &&
    (drop.onclick = () => {
      armPaste();
      catcher?.focus();
    });

  fileInput &&
    (fileInput.onchange = () => {
      const f = fileInput.files?.[0];
      fileInput.value = "";
      if (f) handleImageFile(f);
    });

  modalCancel && (modalCancel.onclick = closeModal);
  modalSave && (modalSave.onclick = saveShot);

  modalPreset &&
    (modalPreset.onchange = () => {
      modalInput.value = modalPreset.value;
      modalInput.focus();
    });
  document.addEventListener("case:changed", async (e) => {
    const uid = e?.detail?.uid;
    if (!uid) return;

    state.selectedUid = uid;

    state.screenshots = [];
    renderShots();

    try {
      state.screenshots = await loadScreenshots(uid);
      renderShots();
    } catch (err) {
      console.error(err);
      toast("Failed to load screenshots for this case", "bad");
    }
  });
}

/***********************
 * Storage adapter (local now; swap later for Supabase)
 ***********************/
const StorageAdapter = {
  getCase(uid) {
    try {
      return JSON.parse(localStorage.getItem(CASE_PREFIX + uid) || "null");
    } catch {
      return null;
    }
  },
  setCase(uid, obj) {
    try {
      localStorage.setItem(CASE_PREFIX + uid, JSON.stringify(obj));
      return true;
    } catch (err) {
      console.error("setCase failed:", err);
      toast("Save failed (storage).", "bad");
      return false;
    }
  },
  deleteCase(uid) {
    try {
      localStorage.removeItem(CASE_PREFIX + uid);
      return true;
    } catch {
      return false;
    }
  },
  listAllCases() {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(CASE_PREFIX)) continue;
      const uid = k.slice(CASE_PREFIX.length);
      const c = this.getCase(uid);
      if (c && c.uid) out.push(c);
    }
    out.sort((a, b) =>
      String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
    );
    return out;
  },

  getReport(uid) {
    try {
      return JSON.parse(localStorage.getItem(REPORT_PREFIX + uid) || "null");
    } catch {
      return null;
    }
  },
  setReport(uid, obj) {
    try {
      localStorage.setItem(REPORT_PREFIX + uid, JSON.stringify(obj));
      return true;
    } catch (err) {
      console.error("setReport failed:", err);
      if (String(err?.name || "").includes("QuotaExceeded")) {
        toast(
          "Storage full. Reduce screenshot size or clear screenshots.",
          "bad",
        );
      } else {
        toast("Save failed (report).", "bad");
      }
      return false;
    }
  },
};

/***********************
 * Legacy migration (old blob -> per UID)
 ***********************/
function migrateLegacyBlobOnce() {
  if (localStorage.getItem(MIGRATE_FLAG)) return;

  let legacy = {};
  try {
    legacy = JSON.parse(localStorage.getItem(LEGACY_BLOB_KEY) || "{}") || {};
  } catch {
    legacy = {};
  }

  const uids = Object.keys(legacy);
  for (const uid of uids) {
    try {
      localStorage.setItem(REPORT_PREFIX + uid, JSON.stringify(legacy[uid]));
    } catch (e) {
      console.warn("Legacy migrate failed for", uid, e);
      break;
    }
  }

  localStorage.setItem(MIGRATE_FLAG, "1");
}

/***********************
 * App state
 ***********************/
const state = {
  selectedUid: null,
  uids: [],
  casesByUid: {},
  pendingShot: null, // <-- global pending shot for modal save
  dragShotId: null, // <-- for drag reorder
};

function nowIso() {
  return new Date().toISOString();
}

/***********************
 * Formatting helpers
 ***********************/
function normalizeDateLike(s) {
  return String(s || "").trim();
}

function calcAgeYears(dobStr) {
  const m = String(dobStr || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = +m[1],
    mo = +m[2],
    d = +m[3];
  const dob = new Date(y, mo - 1, d);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hadBirthday =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

function fmtCaseLine(c) {
  if (!c) return "—";
  const assigned = c.assignedToName ? ` • Assigned: ${c.assignedToName}` : "";
  const sd = c.studyDate || "—";
  const dob = c.dob || "—";
  return `${c.patient || "—"} • DOB ${dob} • Study ${sd}${assigned}`;
}

/***********************
 * Report model (base + merge)
 ***********************/
function getReport(uid) {
  const base = {
    studyDetails: "",
    fov: "",
    from: "",
    to: "",
    history: "",
    indications: "",
    refNote: "",
    addOns: [],
    dictation: "",
    impression: "",
    dentoalveolar: "",
    occlusion: "",
    tmjs: "",
    sinuses: "",
    airway: "",
    cspine: "",
    other: "",
    screenshots: [],
    updatedAt: null,
  };
  const r = StorageAdapter.getReport(uid);
  return r ? { ...base, ...r } : { ...base };
}

function setReport(uid, patch) {
  const cur = getReport(uid);
  const next = { ...cur, ...patch, updatedAt: nowIso() };

  // keep your local adapter write if you want (optional):
  StorageAdapter.setReport?.(uid, next);

  // ✅ persist to Supabase (async)
  sbUpsertReport(uid, next).catch(e => {
    console.error("Cloud save (report) failed:", e);
    toast("Cloud save failed (report).", "bad");
  });

  return next;
}

/***********************
 * Case model
 ***********************/
function getCase(uid) {
  return StorageAdapter.getCase(uid);
}
function setCase(uid, obj) {
  return StorageAdapter.setCase(uid, obj);
}
function listAllCases() {
  return StorageAdapter.listAllCases();
}

/***********************
 * Select placeholder styling
 ***********************/
function syncSelectPlaceholder(selectEl) {
  if (!selectEl) return;
  selectEl.classList.toggle("is-placeholder", !selectEl.value);
}

function populateSelect(selectEl, options, placeholderText) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholderText || "—";
  selectEl.appendChild(opt0);

  for (const text of options) {
    const opt = document.createElement("option");
    opt.value = text;
    opt.textContent = text;
    selectEl.appendChild(opt);
  }
  syncSelectPlaceholder(selectEl);
}

/***********************
 * Tabs + User dropdowns
 ***********************/
function setActiveTabUI() {
  const p = $("tabPending");
  const c = $("tabCompleted");

  if (p) p.classList.toggle("active", app.tab === "pending");
  if (c) c.classList.toggle("active", app.tab === "completed");

  // ✅ Update subtitle under "Worklist"
  const sub = $("worklistSubtitle");
  if (sub) {
    const map = {
      pending: "Pending",
      completed: "Completed",
      finalized: "Finalized",
      archived: "Archived",
    };
    sub.textContent = map[app.tab] || "Pending";
  }
}

function populateUsers() {
  const sel = $("selUser");
  if (!sel) return;

  sel.innerHTML = "";
  for (const u of USERS) {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.name} (${u.role})`;
    sel.appendChild(opt);
  }
  sel.value = app.currentUserId;
  syncSelectPlaceholder(sel);
}

function populateAssignTo() {
  const sel = $("selAssignTo");
  if (!sel) return;

  sel.innerHTML = "";
  for (const u of USERS.filter(isRadiologist)) {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    sel.appendChild(opt);
  }
  sel.value = "matesi";
  syncSelectPlaceholder(sel);
}

function populateAssignedFilter() {
  const sel = $("selAssignedFilter");
  if (!sel) return;

  sel.innerHTML = "";

  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = "All";
  sel.appendChild(optAll);

  for (const u of USERS.filter(isRadiologist)) {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = u.name;
    sel.appendChild(opt);
  }

  sel.value = app.assignedFilter || "all";
  syncSelectPlaceholder(sel);
}

/***********************
 * Intake panel (Add to Worklist)
 ***********************/
function clearIntake() {
  const ids = [
    "inUid",
    "inPatient",
    "inDob",
    "inStudyDate",
    "inSubmittedDate",
    "inRace",
    "inHistory",
    "inIndications",
    "inMedHx",
  ];
  for (const id of ids) {
    const el = $(id);
    if (el) el.value = "";
  }

  const sel = $("selAssignTo");
  if (sel) {
    sel.value = "matesi";
    syncSelectPlaceholder(sel);
  }
}

function addToWorklist() {
  const uid = String($("inUid")?.value || "").trim();
  const submitted_at = new Date().toISOString();
  const submittedDate = String($("inSubmittedDate")?.value || "").trim();
  const patient = String($("inPatient")?.value || "").trim();
  const dob = normalizeDateLike($("inDob")?.value);
  const studyDate = $("inStudyDate")?.value || null;

  const race = String($("inRace")?.value || "").trim();
  const history = String($("inHistory")?.value || "").trim();
  const indications = String($("inIndications")?.value || "").trim();
  const medHx = String($("inMedHx")?.value || "").trim();

  const assignedTo = String($("selAssignTo")?.value || "matesi");
  const assignedUser = USERS.find((u) => u.id === assignedTo) || USERS[0];

  // ✅ Validate first
  if (!uid || !patient || !dob || !studyDate || !history || !indications) {
    toast(
      "Missing required fields (UID, Patient, DOB, Study Date, History, Indications).",
      "bad",
    );
    return;
  }

  const existing = getCase(uid);
  if (existing) {
    toast(`Case ${uid} already exists in worklist.`, "bad");
    state.selectedUid = uid; // optional: jump to it
    loadEditorForSelected?.(); // optional
    return;
  }
  const createdAt = existing?.createdAt || nowIso();

  const c = {
    uid,
    patient,
    dob,
    studyDate,
    race,
    history,
    indications,
    medicalHistory: medHx,
    referring: existing?.referring || "",
    sex: existing?.sex || "",

    assignedToId: assignedUser.id,
    assignedToName: assignedUser.name,

    status: "pending",
    priority: "", // "", "rush", or "stat"

    finalizedAt: existing?.finalizedAt || null,
    finalizedById: existing?.finalizedById || null,
    finalizedByName: existing?.finalizedByName || null,

    addenda: Array.isArray(existing?.addenda) ? existing.addenda : [],

    submitted_at,
    createdAt,
    updatedAt: nowIso(),
  };

  if (!setCase(uid, c)) return;

  // ✅ Seed report history/indications without overwriting existing report text
  const r = getReport(uid) || {};
  setReport(uid, {
    ...r,
    history: (r.history || "").trim() ? r.history : history,
    indications: (r.indications || "").trim() ? r.indications : indications,
  });

  state.selectedUid = uid;
  document.dispatchEvent(new CustomEvent("case:changed", { detail: { uid } }));

  rerenderWorklist(); // ✅ sorted paint
  initWorklistSearch();
  loadEditorForSelected();

  clearIntake(); // ✅ ADD THIS LINE

  toast(`Added ${uid} to worklist`, "ok");
}

/***********************
 * Worklist filter + refresh
 ***********************/
function refreshWorklistFromStorage() {
  const all = listAllCases();

  const wantStatus = app.tab === "pending" ? "pending" : "final";
  let filtered = all.filter((c) => (c.status || "pending") === wantStatus);

  const u = currentUser();

  const showFilter = isIntern(u) || isAdmin(u);
  const tools = $("worklistTools");
  if (tools) tools.style.display = showFilter ? "" : "none";

  if (showFilter) {
    const f = app.assignedFilter || "all";
    if (f !== "all") filtered = filtered.filter((c) => c.assignedToId === f);
  } else {
    filtered = filtered.filter((c) => c.assignedToId === u.id);
  }

  state.uids = filtered.map((c) => c.uid);
  state.casesByUid = {};
  for (const c of filtered) state.casesByUid[c.uid] = c;

  if (state.selectedUid && !state.uids.includes(state.selectedUid)) {
    state.selectedUid = state.uids[0] || null;
  }

  // ❌ DO NOT call render() here
}

/***********************
 * Worklist selection
 ***********************/
function setSelected(uid) {
  state.selectedUid = uid;

  // 🔥 this is what makes screenshots swap per case
  document.dispatchEvent(new CustomEvent("case:changed", { detail: { uid } }));

  loadEditorForSelected();
  render();
}

/***********************
 * Render worklist + button permissions
 ***********************/
function canFinalize() {
  return isRadiologist(currentUser());
}
function canUnfinalize() {
  return isRadiologist(currentUser());
}

/* -------------------------
   🔧 FIX #1: renderShots must be GLOBAL (loadEditorForSelected calls it)
   Also add drag reorder here so it always stays in sync.
------------------------- */
function renderShots() {
  const list = $("shotList");
  const btnClear = $("btnClearShots");
  if (!list) return;

  list.innerHTML = "";

  const uid = state.selectedUid;
  const shots = state.screenshots || [];

  if (btnClear) btnClear.disabled = shots.length === 0;
  if (!uid) return;

  for (const s of shots) {
    const card = document.createElement("div");
    card.className = "shotCard";
    card.draggable = true;
    card.dataset.shotId = s.id;

    /* ---------- DRAG ---------- */
    card.addEventListener("dragstart", (e) => {
      state.dragShotId = s.id;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", s.id);
      } catch {}
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      state.dragShotId = null;
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    card.addEventListener("drop", async (e) => {
      e.preventDefault();

      const fromId = state.dragShotId;
      const toId = s.id;
      if (!fromId || fromId === toId) return;

      const arr = state.screenshots.slice();

      const fromIdx = arr.findIndex((x) => x.id === fromId);
      const toIdx = arr.findIndex((x) => x.id === toId);
      if (fromIdx < 0 || toIdx < 0) return;

      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);

      state.screenshots = arr;

      renderShots(); // instant UI update
      await saveScreenshotOrder(arr); // persist to Supabase
    });

    /* ---------- HEADER ---------- */
    const top = document.createElement("div");
    top.className = "shotTop";

    /* Title (editable) */
    const title = document.createElement("div");
    title.className = "shotName";
    title.contentEditable = true;
    title.spellcheck = false;
    title.textContent = s.title || "Screenshot";

    title.addEventListener("blur", () => {
      const newTitle = title.textContent.trim() || "Screenshot";
      if (newTitle !== s.title) {
        s.title = newTitle;
        updateScreenshotTitle(s.id, newTitle);
      }
    });

    /* Delete */
    const rm = document.createElement("button");
    rm.className = "shotBtn danger";
    rm.type = "button";
    rm.textContent = "Remove";

    rm.onclick = async () => {
      await deleteScreenshot(s.id, s.storage_bucket, s.storage_path);
      state.screenshots = state.screenshots.filter((x) => x.id !== s.id);
      renderShots();
      render();
    };

    top.appendChild(title);
    top.appendChild(rm);

    /* ---------- IMAGE ---------- */
    const img = document.createElement("img");
    img.className = "shotImg";
    img.src = s.url || s.localUrl || "";
    img.onerror = () => {
      // If the real URL fails, fall back to the local preview
      if (s.localUrl && img.src !== s.localUrl) img.src = s.localUrl;
    };

    card.appendChild(top);
    card.appendChild(img);
    list.appendChild(card);
  }
}

function render() {
  const list = $("worklist");
  if (list) {
    list.innerHTML = "";
    for (const uid of state.uids) {
      const c = state.casesByUid[uid] || null;

      const card = document.createElement("div");

      card.className = "card" + (uid === state.selectedUid ? " selected" : "");

      applyPriorityClass(card, uid);

      const main = document.createElement("div");
      main.className = "card-main";

      const title = document.createElement("div");
      title.className = "card-title";

      const uidEl = document.createElement("div");
      uidEl.className = "uid";
      uidEl.textContent = uid;

      const statusBadge = document.createElement("span");
      statusBadge.className =
        c?.status === "final" ? "badge ok" : "badge missing";
      statusBadge.textContent = c?.status === "final" ? "final" : "pending";

      title.appendChild(uidEl);
      title.appendChild(statusBadge);

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = fmtCaseLine(c);

      main.appendChild(title);
      main.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "card-actions";

      const openBtn = document.createElement("button");
      openBtn.className = "smallbtn";
      openBtn.type = "button";
      openBtn.textContent = "Open";
      openBtn.onclick = () => setSelected(uid);

      const rmBtn = document.createElement("button");
      rmBtn.className = "smallbtn danger";
      rmBtn.type = "button";
      rmBtn.textContent = "Remove";
      rmBtn.onclick = () => {
        StorageAdapter.deleteCase(uid);
        if (state.selectedUid === uid) state.selectedUid = null;

        rerenderWorklist(); // ✅ sorted paint
        initWorklistSearch();
        loadEditorForSelected();
      };

      actions.appendChild(openBtn);
      actions.appendChild(rmBtn);

      card.appendChild(main);
      card.appendChild(actions);

      card.onclick = (e) => {
        if (e.target?.tagName?.toLowerCase() === "button") return;
        setSelected(uid);
      };

      list.appendChild(card);
    }
  }

  const hasSel = !!state.selectedUid;
  const uid = state.selectedUid;
  const c = uid ? state.casesByUid[uid] || getCase(uid) : null;
  const status = c?.status || "pending";

  const inPending = app.tab === "pending";
  const inCompleted = app.tab === "completed";

  const btnExport = $("btnExportPdf");
  const btnAiSort = $("btnAiSort");
  const btnFinalize = $("btnFinalize");
  const btnUnfinalize = $("btnUnfinalize");
  const btnAddAddendum = $("btnAddAddendum");
  const btnUploadShot = $("btnUploadShot");
  if (btnUploadShot) btnUploadShot.disabled = !hasSel;

  if (btnExport) btnExport.disabled = !hasSel;
  if (btnAiSort) btnAiSort.disabled = !hasSel;

  if (btnFinalize) {
    btnFinalize.style.display = inPending ? "" : "none";
    btnFinalize.disabled = !hasSel || status !== "pending" || !canFinalize();
  }
  if (btnUnfinalize) {
    btnUnfinalize.style.display = inCompleted ? "" : "none";
    btnUnfinalize.disabled = !hasSel || status !== "final" || !canUnfinalize();
  }
  if (btnAddAddendum) {
    btnAddAddendum.style.display = inCompleted ? "" : "none";
    btnAddAddendum.disabled =
      !hasSel || status !== "final" || !isRadiologist(currentUser());
  }

  const r = hasSel ? getReport(uid) : null;
  const shots = r?.screenshots || [];
  const btnClearShots = $("btnClearShots");
  if (btnClearShots) btnClearShots.disabled = !hasSel || shots.length === 0;
}

/***********************
 * Editor load/save
 ***********************/
let autosaveTimer = null;

function bulletBoxIds() {
  return [
    "txtImpression",
    "txtDentoalveolar",
    "txtOcclusion",
    "txtTMJs",
    "txtSinuses",
    "txtAirway",
    "txtCSpine",
    "txtOther",
  ];
}

const BULLET = "• ";
const SUB_BULLET = "    ◦ ";

/* ... (your bullet helpers unchanged) ... */
function normalizeBullets(text) {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n");
  const out = [];
  for (let line of lines) {
    line = line.trimEnd();
    if (!line.trim()) {
      out.push("");
      continue;
    }
    const leading = line.match(/^[\t ]+/)?.[0] || "";
    const isSub = leading.length >= 2;
    line = line.replace(/^[\t ]*(\u2022|\u25E6|\-|\*|\u25CF)\s*/, "");
    out.push((isSub ? SUB_BULLET : BULLET) + line.trimStart());
  }
  while (out.length && out[0] === "") out.shift();
  return out.join("\n");
}

function isOnlyBullet(text) {
  const t = String(text || "").trim();
  if (!t) return true;
  const lines = t.split("\n").map((l) => l.trim());
  return lines.every((l) => l === "" || l === "•" || l === BULLET.trim());
}

function ensureSingleBulletIfEmpty(textarea) {
  const t = String(textarea.value || "").trim();
  if (!t) {
    textarea.value = BULLET;
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    return;
  }
  if (t === "•" || t === BULLET.trim()) {
    textarea.value = BULLET;
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
}

function handleBulletKeydown(e) {
  const ta = e.currentTarget;
  const value = ta.value || "";

  if (e.key === "Tab") {
    e.preventDefault();
    const pos = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
    const lineEndIdx = value.indexOf("\n", pos);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

    const line = value.slice(lineStart, lineEnd);
    let nextLine = line;

    if (e.shiftKey) {
      if (line.startsWith(SUB_BULLET))
        nextLine = BULLET + line.slice(SUB_BULLET.length);
    } else {
      if (line.startsWith(BULLET))
        nextLine = SUB_BULLET + line.slice(BULLET.length);
    }

    if (nextLine !== line) {
      ta.value = value.slice(0, lineStart) + nextLine + value.slice(lineEnd);
      const delta = nextLine.length - line.length;
      const newPos = pos + delta;
      ta.setSelectionRange(newPos, newPos);
      scheduleAutosave();
    }
    return;
  }

  if (e.key === "Backspace" && ta.selectionStart === ta.selectionEnd) {
    const pos = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
    const lineEndIdx = value.indexOf("\n", pos);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
    const line = value.slice(lineStart, lineEnd);

    const isEmptyBulletLine =
      line === BULLET ||
      line === BULLET.trim() ||
      line === SUB_BULLET ||
      line === SUB_BULLET.trim();

    if (isEmptyBulletLine) {
      e.preventDefault();
      const before = value.slice(0, lineStart);
      const after = value.slice(lineEndIdx === -1 ? value.length : lineEnd + 1);

      let newVal = before;
      if (newVal.endsWith("\n")) newVal = newVal.slice(0, -1);
      if (after.length) newVal = newVal.length ? newVal + "\n" + after : after;

      ta.value = newVal;
      ta.setSelectionRange(newVal.length, newVal.length);
      scheduleAutosave();
      return;
    }
  }

  if (e.key !== "Enter") return;
  e.preventDefault();

  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const before = value.slice(0, start);
  const after = value.slice(end);

  const curLineStart = before.lastIndexOf("\n") + 1;
  const curLine = before.slice(curLineStart);
  const prefix = curLine.startsWith(SUB_BULLET) ? SUB_BULLET : BULLET;

  const insert = "\n" + prefix;
  ta.value = before + insert + after;
  const newPos = (before + insert).length;
  ta.setSelectionRange(newPos, newPos);
  scheduleAutosave();
}

function handleBulletPaste(e) {
  const ta = e.currentTarget;
  const txt = (e.clipboardData || window.clipboardData).getData("text");
  if (!txt) return;

  e.preventDefault();

  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const before = ta.value.slice(0, start);
  const after = ta.value.slice(end);

  const pasted = normalizeBullets(txt);
  const insert =
    (before && !before.endsWith("\n") && before.trim() !== "" ? "\n" : "") +
    pasted;

  ta.value = before + insert + after;
  const pos = (before + insert).length;
  ta.setSelectionRange(pos, pos);
  scheduleAutosave();
}

function attachBulletBehavior(id) {
  const el = $(id);
  if (!el) return;

  el.addEventListener("focus", () => ensureSingleBulletIfEmpty(el));
  el.addEventListener("keydown", handleBulletKeydown);

  el.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items
      ? Array.from(e.clipboardData.items)
      : [];
    const hasImage = items.some(
      (it) => it.type && it.type.startsWith("image/"),
    );
    if (hasImage) return; // screenshot paste handled elsewhere
    handleBulletPaste(e);
  });

  el.addEventListener("input", scheduleAutosave);

  el.addEventListener("blur", () => {
    const t = String(el.value || "").trim();
    if (!t) {
      el.value = "";
      scheduleAutosave();
      return;
    }
    if (t === "•" || t === BULLET.trim()) {
      el.value = BULLET;
      scheduleAutosave();
      return;
    }
    el.value = normalizeBullets(el.value);
    scheduleAutosave();
  });
}

function loadEditorForSelected() {
  ensureReportFormHTML();
  wireAutoGrowTextareas();

  const uid = state.selectedUid;
  const c = state.casesByUid[uid] || getCase(uid) || {};
  $("selStudyDetails") &&
    ($("selStudyDetails").value =
      c.study && c.study.details ? c.study.details : "");

  $("selFrom") &&
    ($("selFrom").value = c.study && c.study.from ? c.study.from : "");
  $("selTo") && ($("selTo").value = c.study && c.study.to ? c.study.to : "");

  // --- No selection: clear UI and exit ---
  if (!uid) {
    if ($("caseDetails")) $("caseDetails").textContent = "";

    if ($("selStudyDetails")) $("selStudyDetails").value = "";
    if ($("selFrom")) $("selFrom").value = "";
    if ($("selTo")) $("selTo").value = "";
    syncSelectPlaceholder($("selStudyDetails"));
    syncSelectPlaceholder($("selFrom"));
    syncSelectPlaceholder($("selTo"));

    if ($("txtHistory")) $("txtHistory").value = "";
    if ($("txtIndications")) $("txtIndications").value = "";
    autosizeTA($("txtHistory"));
    autosizeTA($("txtIndications"));
    if ($("txtRefNote")) $("txtRefNote").value = "";
    if ($("txtDictation")) $("txtDictation").value = "";
    for (const id of bulletBoxIds()) if ($(id)) $(id).value = "";

    if ($("autosaveStatus")) $("autosaveStatus").textContent = "Autosave: —";

    renderAddOnPills();
    renderAddOnList();
    renderShots();
    render();

    return;
  }

  // --- Has selection ---
  const r = getReport(uid);

  // Header line under "Report"
  renderReportSubhead(c);

  if ($("caseDetails")) {
    $("caseDetails").textContent = JSON.stringify(
      c || { uid, missing: true },
      null,
      2,
    );
  }

  // Top block controls
  if ($("selStudyDetails")) $("selStudyDetails").value = r.studyDetails || "";
  syncSelectPlaceholder($("selStudyDetails"));

  if ($("selFrom")) $("selFrom").value = r.from || "";
  if ($("selTo")) $("selTo").value = r.to || "";
  syncSelectPlaceholder($("selFrom"));
  syncSelectPlaceholder($("selTo"));

  // If you still store full fov text anywhere, keep it in r.fov only (no selFov)
  // (nothing to set here unless you have another control)

  // Text fields
  if ($("txtHistory")) $("txtHistory").value = r.history || "";
  if ($("txtIndications")) $("txtIndications").value = r.indications || "";
  if ($("txtRefNote")) $("txtRefNote").value = r.refNote || "";
  if ($("txtDictation")) $("txtDictation").value = r.dictation || "";

  // Bullet boxes
  if ($("txtImpression")) $("txtImpression").value = r.impression || "";
  if ($("txtDentoalveolar"))
    $("txtDentoalveolar").value = r.dentoalveolar || "";
  if ($("txtOcclusion")) $("txtOcclusion").value = r.occlusion || "";
  if ($("txtTMJs")) $("txtTMJs").value = r.tmjs || "";
  if ($("txtSinuses")) $("txtSinuses").value = r.sinuses || "";
  if ($("txtAirway")) $("txtAirway").value = r.airway || "";
  if ($("txtCSpine")) $("txtCSpine").value = r.cspine || "";
  if ($("txtOther")) $("txtOther").value = r.other || "";

  for (const id of bulletBoxIds()) {
    const el = $(id);
    if (!el) continue;
    if (el.value && el.value.trim() && !isOnlyBullet(el.value)) {
      el.value = normalizeBullets(el.value);
    }
    if (isOnlyBullet(el.value)) el.value = BULLET;
  }

  // Autosave stamp
  if ($("autosaveStatus")) {
    $("autosaveStatus").textContent = r.updatedAt
      ? `Autosave: ${new Date(r.updatedAt).toLocaleString()}`
      : "Autosave: —";
  }

  renderAddOnPills();
  renderAddOnList();
  renderShots();
  render();
}

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    const uid = state.selectedUid;
    if (!uid) return;

    const patch = {
      studyDetails: $("selStudyDetails")?.value || "",
      fov: $("selFov")?.value || "",
      from: $("selFrom")?.value || "",
      to: $("selTo")?.value || "",
      history: $("txtHistory")?.value || "",
      indications: $("txtIndications")?.value || "",
      refNote: $("txtRefNote")?.value || "",
      addOns: getReport(uid).addOns || [],
      dictation: $("txtDictation")?.value || "",
      impression: $("txtImpression")?.value || "",
      dentoalveolar: $("txtDentoalveolar")?.value || "",
      occlusion: $("txtOcclusion")?.value || "",
      tmjs: $("txtTMJs")?.value || "",
      sinuses: $("txtSinuses")?.value || "",
      airway: $("txtAirway")?.value || "",
      cspine: $("txtCSpine")?.value || "",
      other: $("txtOther")?.value || "",
    };

    const next = setReport(uid, patch);
    if ($("autosaveStatus") && next?.updatedAt)
      $("autosaveStatus").textContent =
        `Autosave: ${new Date(next.updatedAt).toLocaleString()}`;
    render();
  }, 250);
}

/***********************
 * Add-ons popover
 ***********************/
function violatesMutualExclusion(nextList) {
  for (const [a, b] of ADDON_MUTUAL_EXCLUSIVE) {
    if (nextList.includes(a) && nextList.includes(b)) return [a, b];
  }
  return null;
}

function openAddOnPop() {
  renderAddOnList();
  $("addOnPop")?.classList.add("show");
  $("addOnPop")?.setAttribute("aria-hidden", "false");
}
function closeAddOnPop() {
  $("addOnPop")?.classList.remove("show");
  $("addOnPop")?.setAttribute("aria-hidden", "true");
  scheduleAutosave();
}

function renderAddOnPills() {
  const uid = state.selectedUid;
  const pills = $("addOnPills");
  if (!pills) return;
  pills.innerHTML = "";
  if (!uid) return;

  const r = getReport(uid);
  const selected = r.addOns || [];

  for (const label of selected) {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = label;

    const x = document.createElement("button");
    x.className = "pillX";
    x.type = "button";
    x.textContent = "×";
    x.onclick = () => {
      const next = selected.filter((a) => a !== label);
      setReport(uid, { addOns: next });

      // Keep UI in sync
      renderAddOnPills();
      renderAddOnList();

      // ✅ THIS is the missing piece for your ask
      rerenderWorklist();

      // If your report panel also depends on a full render, keep this:
      // render();
    };

    pill.appendChild(x);
    pills.appendChild(pill);
  }
}

function renderAddOnList() {
  const uid = state.selectedUid;
  const wrap = $("addOnList");
  if (!wrap) return;
  wrap.innerHTML = "";
  if (!uid) return;

  const r = getReport(uid);
  const selected = new Set(r.addOns || []);

  for (const label of ADD_ONS) {
    const row = document.createElement("label");
    row.className = "chkRow";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = selected.has(label);

    cb.onchange = () => {
      const cur = new Set(getReport(uid).addOns || []);
      if (cb.checked) cur.add(label);
      else cur.delete(label);

      const nextArr = Array.from(cur);
      const bad = violatesMutualExclusion(nextArr);
      if (bad) {
        cb.checked = false;
        toast(`Cannot select both "${bad[0]}" and "${bad[1]}"`, "bad");
        return;
      }

      setReport(uid, { addOns: nextArr });

      rerenderWorklist();
      renderAddOnPills();
    };

    const txt = document.createElement("div");
    txt.className = "chkText";
    txt.textContent = label;

    row.appendChild(cb);
    row.appendChild(txt);
    wrap.appendChild(row);
  }
}

/***********************
 * Finalize / Unfinalize / Addendum
 ***********************/
function finalizeReport() {
  const uid = state.selectedUid;
  if (!uid) return;

  if (!canFinalize()) {
    toast("You do not have permission to finalize.", "bad");
    return;
  }

  const u = currentUser();
  const c = getCase(uid);
  if (!c) return;

  c.status = "final";
  c.finalizedAt = nowIso();
  c.finalizedById = u.id;
  c.finalizedByName = u.name;
  c.updatedAt = nowIso();
  setCase(uid, c);

  app.tab = "completed";
  setActiveTabUI();

  loadCasesFromSupabase();
  rerenderWorklist();
  loadEditorForSelected();
  toast("Report finalized and moved to Completed.", "ok");
}

function unfinalizeReport() {
  const uid = state.selectedUid;
  if (!uid) return;

  if (!canUnfinalize()) {
    toast("You do not have permission to unfinalize.", "bad");
    return;
  }

  const c = getCase(uid);
  if (!c) return;

  c.status = "pending";
  c.updatedAt = nowIso();
  setCase(uid, c);

  app.tab = "pending";
  setActiveTabUI();
  rerenderWorklist();

  loadEditorForSelected();
  toast("Report moved back to Pending.", "ok");
}

function openAddendumModal() {
  $("addendumModal")?.classList.add("show");
  $("addendumModal")?.setAttribute("aria-hidden", "false");
  if ($("addendumText")) $("addendumText").value = "";
  setTimeout(() => $("addendumText")?.focus(), 0);
}
function closeAddendumModal() {
  $("addendumModal")?.classList.remove("show");
  $("addendumModal")?.setAttribute("aria-hidden", "true");
}

function saveAddendum() {
  const uid = state.selectedUid;
  if (!uid) return;

  const u = currentUser();
  if (!isRadiologist(u)) {
    toast("You do not have permission to add addenda.", "bad");
    return;
  }

  const txt = String($("addendumText")?.value || "").trim();
  if (!txt) {
    toast("Addendum text is required.", "bad");
    return;
  }

  const c = getCase(uid);
  if (!c || c.status !== "final") {
    toast("Addenda are only for Completed (final) cases.", "bad");
    return;
  }

  c.addenda = Array.isArray(c.addenda) ? c.addenda : [];
  c.addenda.push({
    id: "add_" + Date.now() + "_" + Math.random().toString(16).slice(2),
    createdAt: nowIso(),
    createdById: u.id,
    createdByName: u.name,
    text: txt,
  });
  c.updatedAt = nowIso();
  setCase(uid, c);

  closeAddendumModal();
  toast("Addendum saved.", "ok");
}

/* ---------- Supabase API ---------- */

async function uploadScreenshot(caseUid, blob, title) {
  const ext = blob.type.split("/")[1] || "png";
  const safe = title.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  const path = `pasted/${Date.now()}_${safe}.${ext}`;

  await sb.storage.from("Screenshots").upload(path, blob);

  const { data, error } = await sb
    .from("case_screenshots")
    .insert([
      {
        case_uid: caseUid,
        title,
        storage_bucket: "Screenshots",
        storage_path: path,
        mime_type: blob.type,
        sort_order: 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function loadScreenshots(caseUid) {
  const { data, error } = await sb
    .from("case_screenshots")
    .select("*")
    .eq("case_uid", caseUid)
    .order("sort_order", { ascending: true })
    .order("created_at");

  if (error) throw error;

  for (const s of data) {
    const { data: signed } = await sb.storage
      .from(s.storage_bucket)
      .createSignedUrl(s.storage_path, 3600);
    s.url = signed.signedUrl;
  }
  return data;
}
function renderReportSubhead(c) {
  const el = $("reportSubhead");
  if (!el) return;

  if (!c) {
    el.textContent = "";
    return;
  }

  const name = c.patient || "—";
  const dob = (c.dob || "—").toString().slice(0, 10);
  const age = calcAgeYears(c.dob);
  const sex = (c.sex || "U").toString().trim().toUpperCase().slice(0, 1) || "U";
  const ageSex = `${age != null ? age : "—"}${sex}`;

  const referring = c.referring || "—";
  el.textContent = `${name} • DOB ${dob} • ${ageSex} • ${referring}`;
}
/***********************
 * SUPABASE DB (cases + reports tables)
 ***********************/
async function sbUpsertCase(uid, caseObj) {
  // Your current Supabase "cases" table (per your screenshot) is:
  // uid (text), data (jsonb), assigned_to (text), created_at, updated_at
  // So we keep *everything* (including status) inside data JSON,
  // and only write the columns that definitely exist.
  const payload = {
    uid,
    data: caseObj,
    assigned_to: caseObj.assignedToId || caseObj.assigned_to || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await sb.from("cases").upsert(payload, { onConflict: "uid" });
  if (error) throw error;
}


async function sbDeleteCase(uid) {
  const { error } = await sb.from("cases").delete().eq("uid", uid);
  if (error) throw error;
}

async function sbListCases() {
  const { data, error } = await sb
    .from("cases")
    .select("data")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => r.data).filter(Boolean);
}

async function sbGetReport(uid) {
  const { data, error } = await sb
    .from("reports")
    .select("data")
    .eq("uid", uid)
    .maybeSingle();
  if (error) throw error;
  return data?.data || null;
}

function slimReportForDb(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };

  // prevent storing signed URLs/data URLs/blobs in DB
  if (Array.isArray(out.screenshots)) {
    out.screenshots = out.screenshots.map((s) => {
      if (!s || typeof s !== "object") return s;
      const t = { ...s };
      delete t.url;
      delete t.dataUrl;
      delete t.blob;
      delete t.file;
      delete t.preview;
      return t;
    });
  }

  return out;
}

async function sbUpsertReport(uid, reportObj) {
  const payload = {
    uid,
    data: slimReportForDb(reportObj),
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb
    .from("reports")
    .upsert(payload, { onConflict: "uid" });
  if (error) throw error;
}

async function sbTouchReportUpdatedAt(uid) {
  const { error } = await sb
    .from("reports")
    .update({ updated_at: new Date().toISOString() })
    .eq("uid", uid);
  if (error) throw error;
}

/* ---------- UI Pipeline ---------- */

function initScreenshots() {
  if (window.__SCREENSHOTS_INIT__) return;
  window.__SCREENSHOTS_INIT__ = true;

  const drop = $("shotDrop");
  const catcher = $("shotPasteCatcher");
  const fileInput = $("fileShot");

  const modal = $("modal");
  const modalInput = $("modalInput");
  const modalPreset = $("modalPreset");
  // Build presets array (if you currently hard-coded <option> in HTML,
  // just copy them into an array once and use this going forward)
  const SHOT_PRESETS = [
    "Reformatted Panoramic",
    "Periapical Lesion Tooth #:",
    "Reformatted Panoramic with IAC Tracing",
    "Reformatted Panoramic with preliminary implant planning.",
    "Reformatted Panoramic with IAC Tracing and Preliminary Implant Planning",
    "Reformatted lateral ceph with soft tissue outline.",
    "Reformatted lateral ceph with soft tissue outline and tracing.",
    "Cephalometric analysis. Analysis is provided for reference only and should be confirmed clinically.",
    "Bone Volume Render AP View",
    "Volume Render AP View",
    "Volume Render AP View and tracing. Tracing is provided for reference only and should be confirmed clinically.",
    "TMJ Analysis",
    "Airway Analysis",
  ];

  // Turn the preset into the same combo UI
  initComboBox({
    wrapId: "comboShotPreset",
    inputId: "modalPreset",
    menuId: "menuShotPreset",
    options: SHOT_PRESETS,
    onChange: () => {}, // typing in preset box doesn't autosave; we only use click selection
  });

  const modalCancel = $("modalCancel");
  const modalSave = $("modalSave");

  let armed = false;
  let armTimer = null;

  function armPaste(ms = 60000) {
    armed = true;
    clearTimeout(armTimer);
    armTimer = setTimeout(() => (armed = false), ms);
  }

  function openModal() {
    modal.classList.add("show");
    modalInput.value = "";
    modalPreset.value = "";
    modalInput.focus();
  }

  function closeModal() {
    modal.classList.remove("show");
    state.pendingShotBlob = null;
    catcher.focus();
  }

  async function handleImageFile(file) {
    if (!state.selectedUid) return toast("Select a case first", "bad");

    const raw = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

    const scaled = await downscaleDataUrl(raw);
    state.pendingShotBlob = dataUrlToBlob(scaled);
    openModal();
  }

  async function saveShot() {
    const uid = state.selectedUid;
    const title =
      modalInput.value.trim() || modalPreset.value.trim() || "Screenshot";

    // 1) Instant UI update
    const file = state.pendingShotBlob;
    if (!file) return;

    const tempId = "temp_" + Date.now();
    const localUrl = await blobToDataUrl(file); // data:image/... (won’t crash)

    state.screenshots = state.screenshots || [];

    const maxOrder = state.screenshots.reduce(
      (m, s) => Math.max(m, Number(s.sort_order ?? -1)),
      -1,
    );
    const nextOrder = maxOrder + 1;

    state.screenshots.push({
      id: tempId,
      title,
      url: localUrl,
      created_at: new Date().toISOString(),
      sort_order: nextOrder, // ✅ important
      __optimistic: true,
    });

    renderShots();
    closeModal();

    // 2) Background upload (no waiting)
    (async () => {
      try {
        const res = await uploadScreenshot(uid, file, title);
        // res MUST include: { id, url } (or { id, publicUrl })

        replaceShotById(tempId, {
          id: res.id || tempId,
          url: res.url || res.publicUrl,
          title,
        });

        toast("Screenshot saved", "ok");
      } catch (e) {
        console.error(e);
        toast("Failed to save screenshot", "bad");
      } finally {
        state.pendingShotBlob = null;
      }
    })();
  }

  /* Paste handling */
  catcher.addEventListener("paste", (e) => {
    armPaste();
    const item = [...(e.clipboardData?.items || [])].find((i) =>
      i.type.startsWith("image/"),
    );
    if (!item) return;
    e.preventDefault();
    handleImageFile(item.getAsFile());
  });
  // Click-anywhere to arm paste (without stealing focus from inputs)
  document.addEventListener(
    "mousedown",
    (e) => {
      if (!catcher) return;

      const t = e.target;
      const typing =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable ||
          t.closest(".modalCard")); // avoid fighting the title modal

      if (typing) return;

      // Focus the paste catcher so Ctrl+V / Cmd+V works immediately
      catcher.focus({ preventScroll: true });

      // If you use an "armed" timeout, re-arm it here too:
      if (typeof armPaste === "function") armPaste();
    },
    true,
  );
  window.addEventListener(
    "paste",
    (e) => {
      // If your existing paste handler is on catcher only,
      // you can forward it by focusing catcher then letting your handler run.
      if (catcher && document.activeElement !== catcher) {
        catcher.focus({ preventScroll: true });
      }
    },
    true,
  );

  document.addEventListener(
    "paste",
    (e) => {
      if (!armed || modal.classList.contains("show")) return;
      const item = [...(e.clipboardData?.items || [])].find((i) =>
        i.type.startsWith("image/"),
      );
      if (!item) return;
      e.preventDefault();
      handleImageFile(item.getAsFile());
    },
    true,
  );

  drop.onclick = () => {
    armPaste();
    catcher.focus();
  };

  fileInput.onchange = () => {
    const f = fileInput.files?.[0];
    fileInput.value = "";
    if (f) handleImageFile(f);
  };

  modalCancel.onclick = closeModal;
  modalSave.onclick = saveShot;

  modalPreset.onchange = () => {
    modalInput.value = modalPreset.value;
    modalInput.focus();
  };
  document.addEventListener("case:changed", async (e) => {
    const uid = e?.detail?.uid;

    console.log("case:changed fired, uid =", uid);

    if (!uid) return; // ignore init/null events

    state.selectedUid = uid; // keep state consistent

    state.screenshots = [];
    renderShots();

    try {
      state.screenshots = await loadScreenshots(uid);
      renderShots();
    } catch (err) {
      console.error(err);
      toast("Failed to load screenshots for this case", "bad");
    }
  });
}

/***********************
 * Demo loader
 ***********************/
function loadDemoCases() {
  for (const uid of DEMO_UIDS) {
    const d = TEST_CASES[uid];
    if (!d) continue;

    const existing = getCase(uid);
    const assigned = existing?.assignedToId || "matesi";
    const assignedUser = USERS.find((u) => u.id === assigned) || USERS[0];

    const c = {
      uid: d.uid,
      patient: d.patient,
      dob: d.dob,
      sex: d.sex || "",
      studyDate: d.studyDate || "",
      race: d.race || "",
      history: d.history || "",
      indications: d.indications || "",
      medicalHistory: d.medicalHistory || "",
      referring: d.referring || "",

      assignedToId: assignedUser.id,
      assignedToName: assignedUser.name,

      status: existing?.status || "pending",
      finalizedAt: existing?.finalizedAt || null,
      finalizedById: existing?.finalizedById || null,
      finalizedByName: existing?.finalizedByName || null,

      addenda: Array.isArray(existing?.addenda) ? existing.addenda : [],

      createdAt: existing?.createdAt || nowIso(),
      updatedAt: nowIso(),
    };
    setCase(uid, c);

    const r = getReport(uid);
    setReport(uid, {
      history: r.history || d.history || "",
      indications: r.indications || d.indications || "",
    });
  }

  toast("Loaded demo cases into worklist.", "ok");
  rerenderWorklist();

  loadEditorForSelected();
  setSelected(DEMO_UIDS[0]);
}

/***********************
 * Add Case modal
 ***********************/
function openAddCaseModal() {
  const m = $("addCaseModal");
  if (!m) return;
  m.classList.add("show");
  m.setAttribute("aria-hidden", "false");
  populateAssignTo();

  const today = new Date().toISOString().slice(0, 10);

  const studyEl = $("inStudyDate");
  const subEl = $("inSubmittedDate"); // must match your HTML id exactly

  if (studyEl && !studyEl.value) studyEl.value = today;
  if (subEl && !subEl.value) subEl.value = today;
  // ✅ END ADD

  setTimeout(() => $("inUid")?.focus(), 0);
}

function closeAddCaseModal() {
  const m = $("addCaseModal");
  if (!m) return;
  m.classList.remove("show");
  m.setAttribute("aria-hidden", "true");
}
document.addEventListener("case:changed", async () => {
  console.log("✅ case:changed fired, uid =", state.selectedUid);

  if (!state.selectedUid) {
    state.screenshots = [];
    renderShots();
    return;
  }

  try {
    state.screenshots = await loadScreenshots(state.selectedUid);
    renderShots();
  } catch (e) {
    console.error("Failed to load screenshots", e);
    state.screenshots = [];
    renderShots();
  }
});
function armGlobalPasteFocus() {
  document.addEventListener(
    "pointerdown",
    (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (["input", "textarea", "select", "button"].includes(tag)) return;
      if (e.target.isContentEditable) return;

      document.getElementById("pasteCatcher")?.focus({ preventScroll: true });
    },
    true,
  );
}
function optimisticAddShot(title, fileOrBlob) {
  const tempId =
    "temp_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  const localUrl = URL.createObjectURL(state.pendingShotBlob);

  state.screenshots.push({
    id: tempId,
    title,
    url: localUrl,
    localUrl: localUrl,
    created_at: new Date().toISOString(),
    sort_order:
      state.screenshots.reduce(
        (m, s) => Math.max(m, Number(s.sort_order ?? -1)),
        -1,
      ) + 1,
    __optimistic: true,
  });

  renderScreenshots(); // your existing UI render
  return { tempId, localUrl };
}

function optimisticReplaceShot(tempId, realShot) {
  state.screenshots = state.screenshots || [];
  const idx = state.screenshots.findIndex((s) => s.id === tempId);
  if (idx === -1) return;

  const old = state.screenshots[idx];
  //if (old.url && old.url.startsWith("blob:")) URL.revokeObjectURL(old.url);

  state.screenshots[idx] = {
    ...old,
    ...realShot,
    __optimistic: false,
  };

  renderScreenshots();
}

function optimisticFailShot(tempId, msg) {
  state.screenshots = state.screenshots || [];
  const idx = state.screenshots.findIndex((s) => s.id === tempId);
  if (idx === -1) return;

  state.screenshots[idx].__error = msg || "Upload failed";
  renderScreenshots();
}
function replaceShotById(tempId, patch) {
  const idx = state.screenshots.findIndex((s) => s.id === tempId);
  if (idx === -1) return;

  const old = state.screenshots[idx];

  // Only replace url if it's a non-empty string
  const next = { ...old, ...patch };
  if (!patch || typeof patch.url !== "string" || patch.url.trim() === "") {
    next.url = old.url; // keep the working local preview
  }

  next.__optimistic = false;
  state.screenshots[idx] = next;
  renderShots();
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
function ensureReportFormHTML() {
  const host = document.getElementById("reportFormHost");
  if (!host) return;

  // If it's already there, do nothing
  if (host.dataset.ready === "1") return;

  host.innerHTML = `
    <div class="reportSection">

      <div class="row">
        <div class="label">Study Details:</div>
        <input id="studyDetails" class="input" type="text" placeholder="—" />
      </div>

      <div class="row">
        <input id="fovPrefix" class="pillInput" type="text" value="field of view CBCT extending from" />
        <input id="fovSuperior" class="input flex1" type="text" placeholder="(superior extent)" />
        <div class="pill">to</div>
        <input id="fovInferior" class="input flex1" type="text" placeholder="(inferior extent)" />
      </div>

      <div class="row">
        <div class="label">History:</div>
        <input id="history" class="input" type="text" placeholder="—" />
      </div>

      <div class="row">
        <div class="label">Indications:</div>
        <input id="indications" class="input" type="text" placeholder="—" />
      </div>

      <div class="row">
        <div class="label">Add Ons:</div>
        <select id="addOns" class="select">
          <option value="">Select...</option>
        </select>
      </div>

      <div class="row col">
        <div class="label">Note from referring doctor:</div>
        <textarea id="refNote" class="textarea" placeholder="Enter note (not included in exported PDF)..."></textarea>
      </div>

    </div>
  `;

  host.dataset.ready = "1";
}
function autosizeTA(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 220) + "px"; // cap if you want
}

function wireAutoGrowTextareas() {
  ["txtHistory", "txtIndications"].forEach((id) => {
    const el = $(id);
    if (!el || el.__autogrow__) return;
    el.__autogrow__ = true;
    el.addEventListener("input", () => autosizeTA(el));
    // initial sizing
    setTimeout(() => autosizeTA(el), 0);
  });
}
function initWorklistSearch() {
  const input = document.getElementById("wlSearchInput");
  const clearBtn = document.getElementById("wlSearchClear");
  if (!input) return;

  // Adjust this selector to your actual worklist row elements:
  // Common patterns: .workRow, .caseRow, .wlRow, li, etc.
  function getWorklistRoot() {
    return (
      document.getElementById("worklist") ||
      document.getElementById("workList") ||
      document.getElementById("worklistList") ||
      document.querySelector("[data-worklist]") ||
      document.querySelector(".worklist") ||
      document.querySelector("#leftPane .list") ||
      document.querySelector("#queue") ||
      document.querySelector("#queueList")
    );
  }

  function getRows() {
    const root = getWorklistRoot();
    if (!root) return [];

    // pick rows that actually look like items (buttons/divs/li) and have some text
    const candidates = Array.from(
      root.querySelectorAll(
        "li, .row, .item, .case, .caseRow, .workRow, button, a, div",
      ),
    );

    // filter out containers; keep things that have text and are not the root
    return candidates.filter((el) => {
      const t = (el.textContent || "").trim();
      if (!t) return false;
      if (el === root) return false;
      // avoid grabbing the search UI itself
      if (el.id === "wlSearchInput" || el.closest(".wlSearch")) return false;
      return true;
    });
  }

  function normalize(s) {
    return (s || "").toLowerCase().trim();
  }

  function applyFilter() {
    const q = normalize(input.value);

    const rows = getRows();
    for (const row of rows) {
      if (!row.dataset._origDisplay) {
        row.dataset._origDisplay =
          getComputedStyle(row).display === "none"
            ? ""
            : getComputedStyle(row).display;
      }

      if (!q) {
        row.style.display = row.dataset._origDisplay || "";
        continue;
      }

      const hay = normalize(row.textContent);
      row.style.display = hay.includes(q)
        ? row.dataset._origDisplay || ""
        : "none";
    }
  }

  // per-keystroke
  input.addEventListener("input", applyFilter);

  // clear button
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      input.focus();
      applyFilter();
    });
  }

  // optional: ESC clears
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      applyFilter();
      input.blur();
    }
  });

  // initial
  applyFilter();
}
async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // important
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
function initComboBox({ wrapId, inputId, menuId, options, onChange }) {
  const wrap = document.getElementById(wrapId);
  const input = document.getElementById(inputId);
  const menu = document.getElementById(menuId);
  if (!wrap || !input || !menu) return;

  const btn = wrap.querySelector(".comboBtn");

  function render(list) {
    menu.innerHTML = "";
    const arr = Array.isArray(list) ? list : [];
    if (!arr.length) {
      const empty = document.createElement("div");
      empty.className = "comboItem";
      empty.style.opacity = "0.6";
      empty.textContent = "No matches";
      empty.style.cursor = "default";
      menu.appendChild(empty);
      return;
    }
    for (const v of arr) {
      const item = document.createElement("div");
      item.className = "comboItem";
      item.textContent = String(v);
      item.addEventListener("mousedown", (e) => {
        e.preventDefault(); // keep focus
        input.value = String(v);
        hide();
        onChange && onChange(input.value);
      });
      menu.appendChild(item);
    }
  }

  function filterAndShow() {
    const q = (input.value || "").toLowerCase().trim();
    const filtered = !q
      ? options
      : options.filter((v) => String(v).toLowerCase().includes(q));
    render(filtered);
    show();
  }

  function show() {
    menu.classList.add("show");
  }
  function hide() {
    menu.classList.remove("show");
  }
  function toggle() {
    if (menu.classList.contains("show")) hide();
    else {
      render(options);
      show();
      input.focus({ preventScroll: true });
    }
  }

  // Button opens/closes
  btn &&
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggle();
    });

  // Typing filters live
  input.addEventListener("input", () => {
    filterAndShow();
    onChange && onChange(input.value);
  });

  // Keyboard
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      render(options);
      show();
    } else if (e.key === "Escape") {
      hide();
    } else if (e.key === "Enter") {
      // If menu open and there is a first real option, select it
      if (menu.classList.contains("show")) {
        const first = menu.querySelector(".comboItem");
        if (first && first.textContent !== "No matches") {
          input.value = first.textContent;
          hide();
          onChange && onChange(input.value);
          e.preventDefault();
        }
      }
    }
  });

  // Close on outside click
  document.addEventListener("mousedown", (e) => {
    if (!wrap.contains(e.target)) hide();
  });

  // Expose “getValue” for saving
  input.getEffectiveValue = () => (input.value || "").trim();
}
function setFovValue(which, val) {
  const uid = state.selectedUid;
  if (!uid) return;

  const c = state.casesByUid[uid] || getCase(uid);
  if (!c) return;

  const v = (val || "").trim();

  // store wherever you want; simplest:
  if (!c.study) c.study = {};
  if (which === "from") c.study.from = v;
  if (which === "to") c.study.to = v;

  scheduleAutosave();
}

function getSubmittedTs(caseObj) {
  const raw =
    caseObj?.submittedAt ||
    caseObj?.submitted_at ||
    caseObj?.createdAt || // ✅ YOU NEED THIS
    caseObj?.created_at ||
    caseObj?.created ||
    caseObj?.timestamp ||
    caseObj?.studyDate || // optional fallback
    caseObj?.study_date;

  const t = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(t) ? t : 0;
}
function sortWorklistCases(cases) {
  return [...cases].sort((a, b) => {
    const pa = getPriorityForUid(a.uid);
    const pb = getPriorityForUid(b.uid);
    if (pa !== pb) return pb - pa; // STAT > Rush > normal

    const ta = getSubmittedTs(a);
    const tb = getSubmittedTs(b);
    if (ta !== tb) return ta - tb; // oldest first

    // ✅ final tie-breaker (stable, predictable)
    return String(a.uid).localeCompare(String(b.uid));
  });
}

// helper so sortWorklistCases(cases) can call getPriority(a)
function getPriority(caseObj) {
  return getPriorityForUid(caseObj?.uid);
}

function applyPriorityClass(cardEl, caseObj) {
  const uid = caseObj?.uid || caseObj; // supports passing uid or case obj
  const p = getPriorityForUid(uid);

  cardEl.classList.remove("priority-stat", "priority-rush");

  // TEMP DEBUG: force inline border so we know the function is working
  cardEl.style.border = ""; // reset
  cardEl.style.boxShadow = ""; // reset

  if (p === 2) {
    cardEl.classList.add("priority-stat");
    cardEl.style.border = "3px solid #ff5b5b";
  } else if (p === 1) {
    cardEl.classList.add("priority-rush");
    cardEl.style.border = "3px solid #ffc43d";
  }
}

function getAddOnsForUid(uid) {
  // Add-ons might be stored on report or case depending on your build
  const r = getReport(uid) || {};
  const c = getCase(uid) || {};

  const raw =
    r.addOns ??
    r.add_ons ??
    r.addons ??
    r.selectedAddOns ??
    c.addOns ??
    c.add_ons ??
    c.addons ??
    [];

  // normalize to array of strings
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  return [];
}

// 2 = STAT, 1 = RUSH, 0 = none
function getPriorityForUid(uid) {
  const addOns = getAddOnsForUid(uid).map((s) => s.toLowerCase());
  const hasStat = addOns.some((s) => s.includes("stat"));
  const hasRush = addOns.some((s) => s.includes("rush"));
  if (hasStat) return 2;
  if (hasRush) return 1;
  return 0;
}

function rerenderWorklist() {
  // 1) refresh state.uids + casesByUid based on current tab/filter
  refreshWorklistFromStorage();

  // 2) sort uids using priority (STAT 2, RUSH 1, none 0)
  state.uids = [...state.uids].sort((a, b) => {
    const pa = getPriorityForUid(a);
    const pb = getPriorityForUid(b);
    if (pb !== pa) return pb - pa;

    // stable tie-breaker: createdAt/submittedAt old->new (or flip if you want)
    const ta = getSubmittedTs(getCase(a) || state.casesByUid[a] || {});
    const tb = getSubmittedTs(getCase(b) || state.casesByUid[b] || {});
    return ta - tb;
  });

  // 3) paint
  render();
}
function uid() {
  return (
    crypto?.randomUUID?.() ||
    "c_" + Date.now() + "_" + Math.random().toString(16).slice(2)
  );
}
function buildCaseFromForm() {
  const submitted_at = new Date().toISOString();

  return {
    case_uid: uid(),
    status: "Pending",
    priority: "", // "", "rush", "stat"
    submitted_at,

    // whatever fields you collect:
    patient: $("patientName")?.value?.trim() || "",
    office: $("refOffice")?.value?.trim() || "",
    doctor: $("refDoctor")?.value?.trim() || "",
    notes: $("notes")?.value?.trim() || "",
  };
}
function resetAddCaseForm() {
  const ids = ["patientName", "refOffice", "refDoctor", "notes"]; // add your real IDs
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // reset priority UI too (if you have buttons/toggles)
  state.caseDraftPriority = ""; // only if you use it for the form
  updatePriorityButtonsUI?.("");
}
function removeAddonFromCase(caseUid, addonKeyOrId) {
  const c = getCaseByUid(caseUid); // <-- your existing lookup (or implement below)
  if (!c) return false;

  const before = Array.isArray(c.add_ons) ? c.add_ons.length : 0;

  c.add_ons = (c.add_ons || []).filter((a) => {
    // Support either strings or objects
    if (typeof a === "string") return a !== addonKeyOrId;
    return (a.id ?? a.key ?? a.name) !== addonKeyOrId;
  });

  const changed = (c.add_ons?.length || 0) !== before;

  if (changed) {
    // re-render anywhere that depends on add_ons
    renderSelectedCase?.(); // optional: if you show a “selected case” panel
    renderWorklist?.(); // ✅ required: your ask
    saveState?.(); // optional: if you persist locally
    queueSyncCase?.(c); // optional: if you persist to Supabase
  }

  return changed;
}
function setActiveTab(tab) {
  state.activeTab = tab; // "pending" | "completed" | "finalized" | "archived" (future)

  // update tab button styles (optional but usually needed)
  const bPending = $("tabPending");
  const bCompleted = $("tabCompleted");
  if (bPending) bPending.classList.toggle("active", tab === "pending");
  if (bCompleted) bCompleted.classList.toggle("active", tab === "completed");

  // ✅ update subtitle
  const sub = $("worklistSubtitle");
  if (sub) {
    const labelMap = {
      pending: "Pending",
      completed: "Completed",
      finalized: "Finalized",
      archived: "Archived",
    };
    sub.textContent = labelMap[tab] || tab;
  }

  // ✅ rerender list after changing filter
  rerenderWorklist?.();
  renderWorklist?.(); // in case your function is named this
}
async function loadCasesFromSupabase() {
  try {
    const cases = await sbListCases();
    // Fill your existing in-memory map
    state.casesByUid = state.casesByUid || {};
    for (const c of cases) {
      if (c?.uid) state.casesByUid[c.uid] = c;
    }

    // If you have a list/array source too:
    // state.uids = Object.keys(state.casesByUid);

    rerenderWorklist();
  } catch (e) {
    console.error("Failed to load cases from Supabase:", e);
    toast("Failed to load cases from cloud.", "bad");
  }
}

/***********************
 * Init (clean)
 ***********************/

function init() {
  console.log("INIT START");
  if (window.__DIDX_INIT_DONE__) return;
  window.__DIDX_INIT_DONE__ = true;

  migrateLegacyBlobOnce();
  // ✅ Bulletproof: works even if modal HTML is re-rendered later
  document.addEventListener(
    "click",
    (e) => {
      const btn = e.target.closest("#btnAddToWorklist");
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      console.log("AddToWorklist clicked"); // TEMP debug
      addToWorklist();
      closeAddCaseModal();
    },
    true,
  );

  try {
    localStorage.setItem("__didx_probe__", "1");
    localStorage.removeItem("__didx_probe__");
  } catch (e) {
    toast("⚠️ Storage blocked by browser.", "bad");
  }
  function populateDatalist(inputEl, options) {
    if (!inputEl) return;

    const listId = inputEl.getAttribute("list");
    if (!listId) return;

    const listEl = document.getElementById(listId);
    if (!listEl) return;

    listEl.innerHTML = "";
    for (const v of options || []) {
      const opt = document.createElement("option");
      opt.value = String(v);
      listEl.appendChild(opt);
    }
  }

  initComboBox({
    wrapId: "comboStudyDetails",
    inputId: "selStudyDetails",
    menuId: "menuStudyDetails",
    options: STUDY_DETAIL_OPTIONS,
    onChange: (v) => {
      const uid = state.selectedUid;
      if (!uid) return;
      const c = state.casesByUid[uid] || getCase(uid);
      if (!c) return;
      if (!c.study) c.study = {};
      c.study.details = (v || "").trim();
      scheduleAutosave();
    },
  });

  initComboBox({
    wrapId: "comboFrom",
    inputId: "selFrom",
    menuId: "menuFrom",
    options: FROM_OPTIONS,
    onChange: (v) => setFovValue("from", v),
  });

  initComboBox({
    wrapId: "comboTo",
    inputId: "selTo",
    menuId: "menuTo",
    options: TO_OPTIONS,
    onChange: (v) => setFovValue("to", v),
  });

  populateUsers();
  populateAssignTo();
  populateAssignedFilter();
  $("selStudyDetails") && ($("selStudyDetails").onchange = scheduleAutosave);

  $("tabPending") &&
    ($("tabPending").onclick = () => {
      app.tab = "pending";
      setActiveTabUI();

      rerenderWorklist(); // ✅ sorted paint
      initWorklistSearch();
      loadEditorForSelected();
    });

  $("tabCompleted") &&
    ($("tabCompleted").onclick = () => {
      app.tab = "completed";
      setActiveTabUI();

      rerenderWorklist(); // ✅ sorted paint
      initWorklistSearch();
      loadEditorForSelected();
    });

  setActiveTabUI();

  $("selUser") &&
    ($("selUser").onchange = () => {
      app.currentUserId = $("selUser").value || "matesi";
      syncSelectPlaceholder($("selUser"));

      const u = currentUser();
      app.assignedFilter = isIntern(u) ? "all" : u.id;

      populateAssignedFilter();

      rerenderWorklist(); // ✅ sorted paint
      initWorklistSearch();
      loadEditorForSelected();
    });

  $("selAssignedFilter") &&
    ($("selAssignedFilter").onchange = () => {
      app.assignedFilter = $("selAssignedFilter").value || "all";
      syncSelectPlaceholder($("selAssignedFilter"));

      rerenderWorklist(); // ✅ sorted paint
      initWorklistSearch();
      loadEditorForSelected();
    });

  $("btnOpenAddCase") && ($("btnOpenAddCase").onclick = openAddCaseModal);
  $("btnCancelAddCase") && ($("btnCancelAddCase").onclick = closeAddCaseModal);
  // Clear screenshots (Supabase)
  $("btnClearShots") &&
    ($("btnClearShots").onclick = clearAllScreenshotsForCase);

  const addBtn = document.getElementById("btnAddToWorklist");
  if (addBtn) {
    addBtn.onclick = () => {
      console.log("Add clicked");
      addToWorklist();
      closeAddCaseModal();
    };
  } else {
    console.warn("btnAddToWorklist not found at init time");
  }

  $("btnClearIntake") && ($("btnClearIntake").onclick = clearIntake);

  $("addCaseModal") &&
    ($("addCaseModal").onclick = (e) => {
      if (e.target === $("addCaseModal")) closeAddCaseModal();
    });

  $("btnExportPdf") && ($("btnExportPdf").onclick = exportPdf);
  $("btnAiSort") &&
    ($("btnAiSort").onclick = () =>
      toast("AI Sort is a stub in this prototype.", ""));

  $("btnFinalize") && ($("btnFinalize").onclick = finalizeReport);
  $("btnUnfinalize") && ($("btnUnfinalize").onclick = unfinalizeReport);
  $("btnAddAddendum") && ($("btnAddAddendum").onclick = openAddendumModal);

  $("addendumCancel") && ($("addendumCancel").onclick = closeAddendumModal);
  $("addendumSave") && ($("addendumSave").onclick = saveAddendum);

  $("addendumModal") &&
    ($("addendumModal").onclick = (e) => {
      if (e.target === $("addendumModal")) closeAddendumModal();
    });

  $("btnAddOn") && ($("btnAddOn").onclick = openAddOnPop);
  $("btnAddOnClose") && ($("btnAddOnClose").onclick = closeAddOnPop);
  $("addOnPop") &&
    ($("addOnPop").onclick = (e) => {
      if (e.target === $("addOnPop")) closeAddOnPop();
    });

  $("selFov") && ($("selFov").onchange = () => scheduleAutosave());
  $("selFrom") && ($("selFrom").onchange = () => scheduleAutosave());
  $("selTo") && ($("selTo").onchange = () => scheduleAutosave());

  $("txtHistory") && ($("txtHistory").oninput = scheduleAutosave);
  $("txtIndications") && ($("txtIndications").oninput = scheduleAutosave);
  $("txtRefNote") && ($("txtRefNote").oninput = scheduleAutosave);
  $("txtDictation") && ($("txtDictation").oninput = scheduleAutosave);

  for (const id of bulletBoxIds()) attachBulletBehavior(id);

  $("btnLoadDemo") && ($("btnLoadDemo").onclick = loadDemoCases);

  // ✅ FIX #2: screenshots init MUST run once
  initScreenshots();

  rerenderWorklist();

  initWorklistSearch();
  loadEditorForSelected();
  render();
  console.log("INIT END");
  armGlobalPasteFocus();
}

// JSFiddle / browser safe init
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM READY");
  init();
});

// =========================
// PDF HELPERS (Supabase screenshots)
// =========================

async function urlToDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch failed " + res.status);
  const blob = await res.blob();

  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function getShotDataUrl(shot) {
  let url = shot.url;

  if (!url) {
    const { data, error } = await sb.storage
      .from(shot.storage_bucket)
      .createSignedUrl(shot.storage_path, 600);

    if (error) throw error;
    url = data.signedUrl;
  }

  return await urlToDataUrl(url);
}
// External logo (keep JSFiddle small)
const LOGO_URL =
  "https://cdn.jsdelivr.net/gh/cdmDDS/didx-assets@main/Logo%20alt%20round.png";

async function urlToDataUrl(url) {
  const res = await fetch(url, { mode: "cors", cache: "force-cache" });
  if (!res.ok) throw new Error("Logo fetch failed: " + res.status);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/***********************
 * PDF EXPORT
 ***********************/
const BLUE = [0x26, 0x83, 0xc6];

function loadJsPdfIfNeeded() {
  return new Promise((resolve, reject) => {
    if (window.jspdf && window.jspdf.jsPDF) return resolve(true);

    const existing = document.querySelector('script[data-jspdf="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("jsPDF failed")),
        { once: true },
      );
      return;
    }

    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
    s.async = true;
    s.dataset.jspdf = "1";
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error("jsPDF failed"));
    document.head.appendChild(s);
  });
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight, pageH, margin) {
  const lines = doc.splitTextToSize(String(text), maxWidth);
  for (const line of lines) {
    if (y > pageH - 72) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function dataUrlToImageFormat(dataUrl) {
  const s = String(dataUrl || "");
  const m = s.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  const mime = m ? m[1] : "image/png";
  const fmt = mime.includes("jpeg") || mime.includes("jpg") ? "JPEG" : "PNG";
  return { mime, fmt };
}

function getImageNaturalSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        w: img.naturalWidth || img.width,
        h: img.naturalHeight || img.height,
      });
    img.onerror = reject;
    img.src = dataUrl;
  });
}
async function urlToDataUrl(url) {
  const res = await fetch(url, { mode: "cors", cache: "force-cache" });
  if (!res.ok) throw new Error("Logo fetch failed: " + res.status);
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.readAsDataURL(blob);
  });
}

function compactStudyDetails(r) {
  const fov = (r.fov || "").trim();
  const from = (r.from || "").trim();
  const to = (r.to || "").trim();
  const parts = [];
  if (fov) parts.push(fov);
  parts.push("field of view CBCT extending from");
  if (from) parts.push(from);
  parts.push("to");
  if (to) parts.push(to);
  return parts.filter(Boolean).join(" ");
}

function addFooter(doc, pageW, pageH, margin) {
  const pageCount = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BLUE);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = pageH - 24;
    doc.text("Dental Imaging Diagnostics PC", margin, footerY);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, footerY, {
      align: "right",
    });
  }

  doc.setTextColor(0);
}

// Big diagonal draft watermark for ANY non-final export
function addDraftWatermark(doc, pageW, pageH) {
  const pageCount = doc.getNumberOfPages();

  // opacity support (jsPDF GState)
  let gs = null;
  try {
    gs = new doc.GState({ opacity: 0.12 });
  } catch {}

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    if (gs) doc.setGState(gs);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(92);
    doc.setTextColor(150);

    // centered, rotated
    doc.text("DRAFT", pageW / 2, pageH / 2, {
      align: "center",
      angle: 45,
    });

    // reset
    doc.setTextColor(0);
    doc.setFontSize(10);
    if (gs) {
      try {
        doc.setGState(new doc.GState({ opacity: 1 }));
      } catch {}
    }
  }
}

async function exportPdf() {
  const uid = state.selectedUid;
  if (!uid) return;

  try {
    await loadJsPdfIfNeeded();
  } catch {
    toast("PDF library failed to load. Try again.", "bad");
    return;
  }

  scheduleAutosave();

  const c = state.casesByUid[uid] ||
    getCase(uid) || { uid, patient: "Unknown" };
  const r = getReport(uid);
  const isDraft = (c.status || "pending") !== "final";

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const pageW = 612;
  const pageH = 792;
  const margin = 48;
  const maxW = pageW - margin * 2;

  let y = margin;
  const headerTopY = y;

  // logo (prefer stored logo; fallback to hosted URL)
  let logoData = "";

  // 1) Try stored logo (non-fatal if LOGO_KEY/localStorage are unavailable)
  try {
    if (typeof LOGO_KEY !== "undefined") {
      logoData = (localStorage.getItem(LOGO_KEY) || "").trim();
    }
  } catch (e) {
    logoData = "";
  }

  // 2) Fallback: hosted logo -> data URL (non-fatal if fetch fails)
  if (!logoData) {
    try {
      logoData = await urlToDataUrl(LOGO_URL);
    } catch (e) {
      console.warn("Hosted logo fetch failed:", e);
      logoData = "";
    }
  }

  // 3) Render if valid data URL
  if (logoData && logoData.startsWith("data:image/")) {
    try {
      const { fmt } = dataUrlToImageFormat(logoData);

      const headerBlockH = 46;
      const bufferAboveLine = 4;
      const maxLogoH = headerBlockH - bufferAboveLine;
      const logoH = Math.min(Math.round(headerBlockH * 1.2), maxLogoH);

      const nat = await getImageNaturalSize(logoData).catch(() => ({
        w: 1200,
        h: 400,
      }));
      const logoW = Math.round(logoH * (nat.w / Math.max(1, nat.h)));

      const logoX = pageW - margin - logoW;

      const textCenterY = headerTopY + 12.5;
      let logoY = Math.round(textCenterY - logoH / 2);

      const separatorY = headerTopY + 46;
      const maxLogoY = separatorY - logoH - 2;
      if (logoY > maxLogoY) logoY = maxLogoY;

      const minLogoY = headerTopY - 14;
      if (logoY < minLogoY) logoY = minLogoY;

      doc.addImage(logoData, fmt, logoX, logoY, logoW, logoH);
    } catch (e) {
      console.warn("Logo failed:", e);
    }
  }

  // header text
  doc.setTextColor(...BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Dental Imaging Diagnostics", margin, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("Oral and Maxillofacial Radiology Services", margin, y + 19);

  doc.setTextColor(110);
  doc.setFontSize(9);
  doc.text("www.didiagnostics.com", margin, y + 31);
  doc.setTextColor(0);

  y += 38;

  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  y += 16;

  const LABEL_COLOR = BLUE;
  function labelValue(x, yy, label, value) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...LABEL_COLOR);
    doc.text(label, x, yy);

    const lw = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(String(value ?? "—"), x + lw, yy);
    doc.setTextColor(0);
  }

  const age = calcAgeYears(c.dob);
  const ageSex = `${age != null ? age : "—"}${c.sex || "—"}`;

  doc.setFontSize(10);
  labelValue(margin, y, "Patient Name: ", c.patient || "—");
  labelValue(margin + 270, y, "DOB: ", c.dob || "—");
  labelValue(margin + 475, y, "A/S: ", ageSex);
  y += 14;

  labelValue(margin, y, "Referring Doctor: ", c.referring || "—");
  y += 14;

  labelValue(margin, y, "Study Details: ", compactStudyDetails(r));
  y += 14;

  labelValue(margin, y, "Study Date: ", c.studyDate || "—");
  y += 10;

  doc.setDrawColor(180);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 14;

  labelValue(margin, y, "History: ", r.history || "—");
  y += 14;
  labelValue(margin, y, "Indications: ", r.indications || "—");
  y += 14;

  if ((r.addOns || []).length) {
    labelValue(margin, y, "Add Ons: ", (r.addOns || []).join("; "));
    y += 10;
  }

  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  y += 28;

  function addSection(title, body, drawLineBelow = false) {
    if (isOnlyBullet(body)) return;

    if (y > pageH - 96) {
      doc.addPage();
      y = margin;
    }

    doc.setTextColor(...BLUE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${title}:`, margin, y);
    doc.setTextColor(0);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y = addWrappedText(doc, body, margin, y, maxW, 13, pageH, margin);

    if (drawLineBelow) {
      y += 6;
      doc.setDrawColor(180);
      doc.setLineWidth(0.6);
      doc.line(margin, y, pageW - margin, y);
      y += 18;
    } else {
      y += 10;
    }
  }

  addSection("Impression", (r.impression || "").trim(), true);
  addSection("Dentoalveolar", (r.dentoalveolar || "").trim());
  addSection("Occlusion", (r.occlusion || "").trim());
  addSection("TMJs", (r.tmjs || "").trim());
  addSection("Paranasal Sinuses", (r.sinuses || "").trim());
  addSection("Airway", (r.airway || "").trim());
  addSection("Cervical Spine", (r.cspine || "").trim());
  addSection("Other Findings", (r.other || "").trim());

  // Addenda only on final
  if (c.status === "final" && Array.isArray(c.addenda) && c.addenda.length) {
    if (y > pageH - 140) {
      doc.addPage();
      y = margin;
    }

    doc.setTextColor(...BLUE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Addenda:", margin, y);
    doc.setTextColor(0);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    c.addenda.forEach((a, idx) => {
      const header = `Addendum #${idx + 1} • ${new Date(a.createdAt).toLocaleString()} • ${
        a.createdByName || "—"
      }`;
      y = addWrappedText(doc, header, margin, y, maxW, 13, pageH, margin);
      y = addWrappedText(doc, a.text || "", margin, y, maxW, 13, pageH, margin);
      y += 10;
      if (y > pageH - 96) {
        doc.addPage();
        y = margin;
      }
    });
  }

  // Signature area
  y += 20;
  if (y > pageH - 120) {
    doc.addPage();
    y = margin;
  }

  const sigLineX1 = margin + 66;
  const sigLineX2 = margin + 320;

  const sigData = (localStorage.getItem(SIGNATURE_KEY) || "").trim();
  if (sigData && sigData.startsWith("data:image/")) {
    try {
      const { fmt } = dataUrlToImageFormat(sigData);
      const nat = await getImageNaturalSize(sigData).catch(() => ({
        w: 900,
        h: 250,
      }));
      const sigW = 210;
      const sigH = Math.round(sigW * (nat.h / Math.max(1, nat.w)));
      doc.addImage(sigData, fmt, sigLineX1, y - sigH - 6, sigW, sigH);
    } catch {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Signature:", margin, y);
  doc.setDrawColor(0);
  doc.setLineWidth(0.6);
  doc.line(sigLineX1, y + 2, sigLineX2, y + 2);
  y += 16;

  doc.text("Interpreted by Radiologist:", margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(110);
  doc.text(`Verified Date: ${new Date().toLocaleString()}`, margin, y);
  doc.setTextColor(0);

  // Screenshots section
  const shots = (state.screenshots || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (shots.length) {
    doc.addPage();
    let sy = margin;

    doc.setTextColor(...BLUE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Screenshots:", margin, sy);
    doc.setTextColor(120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    sy += 14;
    doc.text(
      "Disclaimer: No measurements should be made from attached images. These images are only representative slices.",
      margin,
      sy,
    );
    doc.setTextColor(0);
    sy += 10;

    doc.setDrawColor(180);
    doc.setLineWidth(0.6);
    doc.line(margin, sy, pageW - margin, sy);
    sy += 16;

    const gapBetweenBlocks = 18;
    const perPageTop = sy;
    const availableH = pageH - margin - perPageTop;
    const boxH = Math.floor((availableH - gapBetweenBlocks) / 2);

    let slot = 0;
    let slotY = perPageTop;

    for (const s of shots) {
      if (slot === 2) {
        doc.addPage();
        sy = margin;

        doc.setTextColor(...BLUE);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Screenshots:", margin, sy);
        doc.setTextColor(120);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        sy += 14;
        doc.text(
          "Disclaimer: No measurements should be made from attached images. These images are only representative slices.",
          margin,
          sy,
        );
        doc.setTextColor(0);
        sy += 10;

        doc.setDrawColor(180);
        doc.setLineWidth(0.6);
        doc.line(margin, sy, pageW - margin, sy);
        sy += 16;

        slot = 0;
        slotY = sy;
      }

      // ✅ NEW: fetch screenshot as dataUrl from Supabase for jsPDF
      let dataUrl;
      try {
        dataUrl = await getShotDataUrl(s);
      } catch (e) {
        console.error("Screenshot fetch failed", s, e);
        slot += 1;
        slotY = slotY + boxH + gapBetweenBlocks + 8;
        continue;
      }

      let natural = { w: 1200, h: 800 };
      try {
        natural = await getImageNaturalSize(dataUrl);
      } catch {}

      const { fmt } = dataUrlToImageFormat(dataUrl);

      const title = String(s.title || "Screenshot");
      const titleH = 13;

      const maxImgW = maxW;
      const maxImgH = Math.max(60, boxH - titleH);

      let drawW = maxImgW;
      let drawH = Math.round(drawW * (natural.h / Math.max(1, natural.w)));
      if (drawH > maxImgH) {
        drawH = maxImgH;
        drawW = Math.round(drawH * (natural.w / Math.max(1, natural.h)));
      }

      const imgX = margin + Math.round((maxImgW - drawW) / 2);
      const imgY = slotY;

      // ✅ NEW: use dataUrl fetched from Supabase
      doc.addImage(dataUrl, fmt, imgX, imgY, drawW, drawH);

      const centerX = pageW / 2;
      const titleLines = doc.splitTextToSize(title, maxW);
      let titleY = imgY + drawH + 12;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      for (const line of titleLines) {
        doc.text(String(line), centerX, titleY, { align: "center" });
        titleY += 12;
      }

      slot += 1;
      slotY = slotY + boxH + gapBetweenBlocks + 8; // extra space after title
    }
  }

  addFooter(doc, pageW, pageH, margin);

  if (isDraft) addDraftWatermark(doc, pageW, pageH);

  doc.save(`Report_${uid}.pdf`);
  toast(`Exported Report_${uid}.pdf`, "ok");
}

/***********************
 * Copy attachment note (optional)
 ***********************/
async function copyAttachmentNote() {
  const uid = state.selectedUid;
  if (!uid) return;

  const filename = `Report_${uid}.pdf`;
  const note = `REPORT READY (manual attach)
UID: ${uid}
File: ${filename}
Generated: ${new Date().toLocaleString()}

Next step: Attach "${filename}" to this work request.`;

  try {
    await navigator.clipboard.writeText(note);
    toast("Attachment note copied to clipboard", "ok");
  } catch {
    window.prompt("Copy this note:", note);
  }
}
(function () {
  function pickBtn() {
    const a = document.getElementById("btnAddToWorklist");
    const b = document.getElementById("addToWorklist");
    return a || b;
  }

  const btn = pickBtn();
  const all = [
    ...document.querySelectorAll("#btnAddToWorklist, #addToWorklist"),
  ];

  console.log(
    "[DIDX] addBtn found=" + !!btn,
    "id=" + (btn ? btn.id : "none"),
    "matches=" + all.length,
  );

  if (!btn) return;

  btn.addEventListener(
    "click",
    () => console.log("[DIDX] addBtn CLICK", new Date().toISOString()),
    true,
  );
})();

