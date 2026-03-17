const API_URL = "https://rudraaaa76-kavach-endpoints.hf.space/api/analyze";
const DEBUG = true;

const logDebug = (...args) => {
  if (DEBUG) {
    console.log("[SENTINEL]", ...args);
  }
};

const normalizeSeverity = (result) => {
  return (
    result?.severity ||
    result?.fusion?.severity ||
    result?.analysis?.severity ||
    "UNKNOWN"
  );
};

const postForAnalysis = async (payload) => {
  try {
    logDebug("Posting for analysis", payload);
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      logDebug("Backend response not ok", response.status);
      return null;
    }

    const data = await response.json();
    logDebug("Backend response", data);
    return data;
  } catch (error) {
    logDebug("Fetch failed", error);
    return null;
  }
};

const setBadgeForSeverity = async (tabId, severity) => {
  const level = String(severity || "").toUpperCase();

  if (level === "CRITICAL" || level === "HIGH") {
    await chrome.action.setBadgeText({ tabId, text: "!" });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#DC2626" });
    return;
  }

  if (level === "MEDIUM") {
    await chrome.action.setBadgeText({ tabId, text: "!" });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#F59E0B" });
    return;
  }

  await chrome.action.setBadgeText({ tabId, text: "" });
};

const processedDownloadIds = new Set();

const processDownloadItem = async (downloadItem) => {
  logDebug("Processing download", downloadItem);
  if (!downloadItem || processedDownloadIds.has(downloadItem.id)) {
    return;
  }

  const downloadUrl = downloadItem.finalUrl || downloadItem.url || "";
  const filename = downloadItem.filename || "";
  if (!downloadUrl) {
    logDebug("Download missing URL", downloadItem);
    return;
  }

  processedDownloadIds.add(downloadItem.id);

  const result = await postForAnalysis({
    text: `${downloadUrl} filename: ${filename}`,
    type: "download_url"
  });

  if (!result) {
    logDebug("No download analysis result");
    return;
  }

  const severity = normalizeSeverity(result);
  const upper = String(severity).toUpperCase();

  if (upper === "HIGH" || upper === "CRITICAL") {
    try {
      await chrome.downloads.pause(downloadItem.id);
    } catch (error) {
      // Ignore pause failures silently.
    }

    const threatType = result?.threat_type || result?.fusion?.threat_type || "Unknown threat";
    const confidence = result?.confidence || result?.fusion?.confidence || "N/A";

    try {
      await chrome.notifications.create(`sentinel-download-${downloadItem.id}`, {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "SENTINEL: Suspicious Download",
        message: `${threatType} (confidence: ${confidence})`,
        priority: 2
      });
    } catch (error) {
      // Ignore notification failures silently.
    }

    await chrome.storage.local.set({
      last_download_alert: {
        downloadId: downloadItem.id,
        url: downloadUrl,
        filename,
        severity,
        threat_type: threatType,
        confidence,
        result
      }
    });
    logDebug("Stored download alert", downloadItem.id);
  } else {
    logDebug("Download severity did not meet threshold", severity);
  }
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") {
    return;
  }

  const url = tab?.url || "";
  if (!url) {
    return;
  }

  (async () => {
    logDebug("Tab complete", tabId, url);
    const result = await postForAnalysis({ text: url, type: "url" });
    if (!result) {
      logDebug("No tab analysis result");
      return;
    }
    const severity = normalizeSeverity(result);
    await setBadgeForSeverity(tabId, severity);
  })();
});

chrome.downloads.onCreated.addListener((downloadItem) => {
  logDebug("Download created", downloadItem);
  (async () => {
    await processDownloadItem(downloadItem);
  })();
});

chrome.downloads.onChanged.addListener((delta) => {
  logDebug("Download changed", delta);
  if (!delta?.id) {
    return;
  }

  chrome.downloads.search({ id: delta.id }, (items) => {
    const item = items && items[0] ? items[0] : null;
    if (!item) {
      logDebug("Download item not found", delta.id);
      return;
    }

    (async () => {
      await processDownloadItem(item);
    })();
  });
});

const MENU_ID = "sentinel-scan-selection";

chrome.runtime.onInstalled.addListener(() => {
  logDebug("Extension installed/updated");
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Scan with SENTINEL",
    contexts: ["selection"]
  });
});

chrome.runtime.onStartup.addListener(() => {
  logDebug("Extension startup");
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  const selection = info.selectionText || "";
  if (!selection) {
    return;
  }

  (async () => {
    logDebug("Context menu scan", selection);
    const result = await postForAnalysis({ text: selection, type: "selected_text" });
    if (result) {
      await chrome.storage.local.set({
        last_scan_result: {
          text: selection,
          severity: normalizeSeverity(result),
          result
        }
      });
      logDebug("Stored scan result");
    }

    try {
      await chrome.action.openPopup();
    } catch (error) {
      // Ignore popup failures silently.
    }
  })();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "analyze-email") {
    return false;
  }

  const emailText = typeof message.text === "string" ? message.text.trim() : "";
  if (!emailText) {
    sendResponse({ ok: false, error: "missing-email" });
    return true;
  }

  (async () => {
    const result = await postForAnalysis({ text: emailText, type: "email" });
    if (!result) {
      sendResponse({ ok: false, error: "analysis-failed" });
      return;
    }

    const severity = normalizeSeverity(result);
    const score = result?.fusion?.final_score ?? result?.analysis?.score ?? null;

    if (sender?.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: "show-alert",
        status: severity === "LOW" || severity === "SAFE" ? "ok" : "blocked",
        severity,
        score: typeof score === "number" ? score.toFixed(1) : "N/A"
      });
    }

    sendResponse({ ok: true, result });
  })();

  return true;
});

logDebug("Service worker loaded");
