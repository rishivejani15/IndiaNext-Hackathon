const params = new URLSearchParams(window.location.search);

const url = params.get("url") || "Unknown";
const severity = params.get("severity") || "Unknown";
const score = params.get("score") || "N/A";

const urlEl = document.getElementById("blocked-url");
const severityEl = document.getElementById("blocked-severity");
const scoreEl = document.getElementById("blocked-score");

if (urlEl) {
  urlEl.textContent = url;
}

if (severityEl) {
  severityEl.textContent = severity;
}

if (scoreEl) {
  scoreEl.textContent = score;
}
