import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg = window.APP_CONFIG;
if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey || cfg.supabaseAnonKey === "REPLACE_WITH_SUPABASE_ANON_KEY") {
  alert("Set web/config.js with your Supabase URL and anon key before using the app.");
  throw new Error("Missing APP_CONFIG");
}

const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

const sessionState = document.getElementById("sessionState");
const toast = document.getElementById("toast");

const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const signUpBtn = document.getElementById("signUpBtn");
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");

const issueForm = document.getElementById("issueForm");
const refreshFeedBtn = document.getElementById("refreshFeedBtn");
const issuesFeed = document.getElementById("issuesFeed");
const imageEl = document.getElementById("image");
const imagePreviewWrap = document.getElementById("imagePreviewWrap");
const imagePreview = document.getElementById("imagePreview");
const uploadProgressBar = document.getElementById("uploadProgressBar");
const uploadProgressText = document.getElementById("uploadProgressText");

const statusFilterEl = document.getElementById("statusFilter");
const severityFilterEl = document.getElementById("severityFilter");
const searchFilterEl = document.getElementById("searchFilter");
const filterLatitudeEl = document.getElementById("filterLatitude");
const filterLongitudeEl = document.getElementById("filterLongitude");
const radiusKmEl = document.getElementById("radiusKm");
const useLocationBtn = document.getElementById("useLocationBtn");
const clearRadiusBtn = document.getElementById("clearRadiusBtn");

const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");

const loadAdminBtn = document.getElementById("loadAdminBtn");
const adminStats = document.getElementById("adminStats");
const adminUpdateForm = document.getElementById("adminUpdateForm");

const defaultCenter = [21.1458, 79.0882];
const map = window.L.map("map").setView(defaultCenter, 12);
window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const feedMarkers = window.L.layerGroup().addTo(map);
let selectedMarker = null;
let allIssues = [];

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getFunctionUrl(name) {
  return `${cfg.supabaseUrl}/functions/v1/${name}`;
}

function encodeStoragePath(path) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function setUploadProgress(percent) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  uploadProgressBar.style.width = `${safePercent}%`;
  uploadProgressText.textContent = `Upload progress: ${safePercent}%`;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function updatePreview() {
  const file = imageEl.files?.[0];
  if (!file) {
    imagePreviewWrap.classList.add("hidden");
    imagePreview.removeAttribute("src");
    return;
  }

  imagePreview.src = URL.createObjectURL(file);
  imagePreviewWrap.classList.remove("hidden");
}

function syncMap(issues) {
  feedMarkers.clearLayers();

  issues.forEach((issue) => {
    const lat = Number(issue.latitude);
    const lng = Number(issue.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const marker = window.L.marker([lat, lng]).addTo(feedMarkers);
    marker.bindPopup(
      `<strong>${escapeHtml(issue.title)}</strong><br/>${escapeHtml(issue.status)} | ${escapeHtml(issue.severity)}`
    );
  });
}

function renderFilteredFeed() {
  const statusFilter = statusFilterEl.value;
  const severityFilter = severityFilterEl.value;
  const query = searchFilterEl.value.trim().toLowerCase();

  const radius = Number(radiusKmEl.value);
  const lat = Number(filterLatitudeEl.value);
  const lng = Number(filterLongitudeEl.value);
  const useRadius = Number.isFinite(radius) && radius > 0 && Number.isFinite(lat) && Number.isFinite(lng);

  const filtered = allIssues
    .filter((issue) => (statusFilter === "all" ? true : issue.status === statusFilter))
    .filter((issue) => (severityFilter === "all" ? true : issue.severity === severityFilter))
    .filter((issue) => {
      if (!query) return true;
      const haystack = `${issue.title} ${issue.description}`.toLowerCase();
      return haystack.includes(query);
    })
    .map((issue) => {
      if (!useRadius) return issue;
      const distanceKm = haversineKm(lat, lng, Number(issue.latitude), Number(issue.longitude));
      return { ...issue, distanceKm };
    })
    .filter((issue) => (useRadius ? issue.distanceKm <= radius : true));

  if (!filtered.length) {
    issuesFeed.innerHTML = "<p>No issues match current filters.</p>";
    syncMap([]);
    return;
  }

  issuesFeed.innerHTML = filtered.map(renderIssue).join("");
  syncMap(filtered);
}

async function getBearerToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function updateSessionLabel() {
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    sessionState.textContent = `${data.user.email}`;
  } else {
    sessionState.textContent = "Signed out";
  }
}

async function signUp() {
  const email = emailEl.value.trim();
  const password = passwordEl.value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    showToast(error.message, true);
    return;
  }
  showToast("Sign-up request submitted. Verify email if enabled.");
}

async function signIn() {
  const email = emailEl.value.trim();
  const password = passwordEl.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    showToast(error.message, true);
    return;
  }
  await updateSessionLabel();
  showToast("Signed in.");
}

async function signOut() {
  await supabase.auth.signOut();
  await updateSessionLabel();
  showToast("Signed out.");
}

function randomFileName(file) {
  const ts = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  return `issue-${ts}.${ext}`;
}

async function uploadIssueImage(file) {
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    throw new Error("Please sign in first.");
  }

  const token = await getBearerToken();
  if (!token) {
    throw new Error("Missing auth token.");
  }

  const userFolder = userResult.user.id;
  const path = `${userFolder}/issues/${randomFileName(file)}`;
  const encodedPath = encodeStoragePath(path);

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${cfg.supabaseUrl}/storage/v1/object/road-issue-images/${encodedPath}`);
    xhr.setRequestHeader("apikey", cfg.supabaseAnonKey);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      setUploadProgress((event.loaded / event.total) * 100);
    };

    xhr.onerror = () => reject(new Error("Image upload failed."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadProgress(100);
        resolve(true);
        return;
      }

      try {
        const body = JSON.parse(xhr.responseText);
        reject(new Error(body.message || body.error || "Image upload failed."));
      } catch {
        reject(new Error("Image upload failed."));
      }
    };

    xhr.send(file);
  });

  return path;
}

async function submitIssue(event) {
  event.preventDefault();

  const token = await getBearerToken();
  if (!token) {
    showToast("Sign in before submitting an issue.", true);
    return;
  }

  const file = document.getElementById("image").files[0];
  if (!file) {
    showToast("Image is required.", true);
    return;
  }

  try {
    setUploadProgress(0);
    const imagePath = await uploadIssueImage(file);

    const payload = {
      title: document.getElementById("title").value.trim(),
      description: document.getElementById("description").value.trim(),
      severity: document.getElementById("severity").value,
      latitude: Number(document.getElementById("latitude").value),
      longitude: Number(document.getElementById("longitude").value),
      address: document.getElementById("address").value.trim(),
      imagePath
    };

    const res = await fetch(getFunctionUrl("create-issue"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: cfg.supabaseAnonKey
      },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || "Failed to create issue.");
    }

    issueForm.reset();
    imagePreviewWrap.classList.add("hidden");
    showToast(`Issue created: ${body.issue.id}`);
    await loadFeed();
  } catch (error) {
    showToast(error.message, true);
    setUploadProgress(0);
  }
}

function renderIssue(issue) {
  return `<article class="issue-item">
    <strong>${escapeHtml(issue.title)}</strong>
    <p>${escapeHtml(issue.description)}</p>
    <div class="issue-meta">
      <span>status: ${escapeHtml(issue.status)}</span>
      <span>severity: ${escapeHtml(issue.severity)}</span>
      <span>reported by: ${escapeHtml(issue.reporter_name || "anonymous")}</span>
      <span>at: ${new Date(issue.created_at).toLocaleString()}</span>
      <span>id: ${escapeHtml(issue.id)}</span>
      ${issue.distanceKm ? `<span>distance: ${issue.distanceKm.toFixed(2)} km</span>` : ""}
    </div>
  </article>`;
}

async function loadFeed() {
  const { data, error } = await supabase
    .from("issue_public_feed")
    .select("id, title, description, status, severity, reporter_name, created_at, latitude, longitude")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    showToast(error.message, true);
    return;
  }

  allIssues = data ?? [];
  renderFilteredFeed();
}

async function loadAdminDashboard() {
  const token = await getBearerToken();
  if (!token) {
    showToast("Sign in as admin first.", true);
    return;
  }

  const res = await fetch(getFunctionUrl("admin-dashboard"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: cfg.supabaseAnonKey
    }
  });

  const body = await res.json();
  if (!res.ok) {
    showToast(body.error || "Failed to load dashboard.", true);
    return;
  }

  adminStats.textContent = JSON.stringify(body, null, 2);
  showToast("Admin dashboard loaded.");
}

async function submitAdminUpdate(event) {
  event.preventDefault();

  const token = await getBearerToken();
  if (!token) {
    showToast("Sign in as admin first.", true);
    return;
  }

  const payload = {
    issueId: document.getElementById("adminIssueId").value.trim(),
    status: document.getElementById("adminStatus").value,
    adminNotes: document.getElementById("adminNotes").value.trim()
  };

  const severity = document.getElementById("adminSeverity").value;
  if (severity) payload.severity = severity;

  const res = await fetch(getFunctionUrl("admin-update-issue"), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: cfg.supabaseAnonKey
    },
    body: JSON.stringify(payload)
  });

  const body = await res.json();
  if (!res.ok) {
    showToast(body.error || "Failed to update issue.", true);
    return;
  }

  adminUpdateForm.reset();
  showToast("Issue updated.");
  await loadFeed();
  await loadAdminDashboard();
}

async function useMyLocation() {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported in this browser.", true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = Number(position.coords.latitude.toFixed(6));
      const lng = Number(position.coords.longitude.toFixed(6));

      filterLatitudeEl.value = String(lat);
      filterLongitudeEl.value = String(lng);
      latitudeInput.value = String(lat);
      longitudeInput.value = String(lng);

      map.setView([lat, lng], 14);
      if (selectedMarker) {
        selectedMarker.setLatLng([lat, lng]);
      } else {
        selectedMarker = window.L.marker([lat, lng]).addTo(map);
      }

      renderFilteredFeed();
      showToast("Location captured.");
    },
    () => {
      showToast("Unable to fetch current location.", true);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function clearRadiusFilter() {
  radiusKmEl.value = "";
  filterLatitudeEl.value = "";
  filterLongitudeEl.value = "";
  renderFilteredFeed();
}

map.on("click", (event) => {
  const { lat, lng } = event.latlng;
  const fixedLat = Number(lat.toFixed(6));
  const fixedLng = Number(lng.toFixed(6));

  latitudeInput.value = String(fixedLat);
  longitudeInput.value = String(fixedLng);

  if (selectedMarker) {
    selectedMarker.setLatLng([fixedLat, fixedLng]);
  } else {
    selectedMarker = window.L.marker([fixedLat, fixedLng]).addTo(map);
  }
});

signUpBtn.addEventListener("click", signUp);
signInBtn.addEventListener("click", signIn);
signOutBtn.addEventListener("click", signOut);
issueForm.addEventListener("submit", submitIssue);
refreshFeedBtn.addEventListener("click", loadFeed);
loadAdminBtn.addEventListener("click", loadAdminDashboard);
adminUpdateForm.addEventListener("submit", submitAdminUpdate);
imageEl.addEventListener("change", updatePreview);

statusFilterEl.addEventListener("change", renderFilteredFeed);
severityFilterEl.addEventListener("change", renderFilteredFeed);
searchFilterEl.addEventListener("input", renderFilteredFeed);
filterLatitudeEl.addEventListener("input", renderFilteredFeed);
filterLongitudeEl.addEventListener("input", renderFilteredFeed);
radiusKmEl.addEventListener("input", renderFilteredFeed);
useLocationBtn.addEventListener("click", useMyLocation);
clearRadiusBtn.addEventListener("click", clearRadiusFilter);

supabase.auth.onAuthStateChange(async () => {
  await updateSessionLabel();
});

await updateSessionLabel();
setUploadProgress(0);
await loadFeed();
