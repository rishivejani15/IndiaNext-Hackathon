const params = new URLSearchParams(window.location.search);
const url = params.get("url") || "Unknown";

const urlEl = document.getElementById("checking-url");
if (urlEl) {
  urlEl.textContent = url;
}
