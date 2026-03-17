const getEmailContent = () => {
  const subjectEl = document.querySelector('h2.hP');
  const senderEl = document.querySelector('span.gD');
  const bodyEl = document.querySelector('div.a3s');

  const subject = subjectEl ? subjectEl.textContent.trim() : '';
  const sender = senderEl ? senderEl.textContent.trim() : '';
  const body = bodyEl ? bodyEl.textContent.trim() : '';

  if (!subject && !body) {
    return null;
  }

  return [
    subject ? `Subject: ${subject}` : '',
    sender ? `From: ${sender}` : '',
    body
  ].filter(Boolean).join('\n\n');
};

const showAlertBanner = (severity, score, status = 'blocked') => {
  const existing = document.getElementById('phish-guard-banner');
  if (existing) {
    existing.remove();
  }

  const isBad = status !== 'ok';
  const banner = document.createElement('div');
  banner.id = 'phish-guard-banner';
  banner.style.position = 'fixed';
  banner.style.top = '16px';
  banner.style.right = '16px';
  banner.style.zIndex = '999999';
  banner.style.background = isBad ? 'rgba(220, 38, 38, 0.95)' : 'rgba(16, 185, 129, 0.95)';
  banner.style.color = '#fff';
  banner.style.padding = '12px 16px';
  banner.style.borderRadius = '12px';
  banner.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
  banner.style.fontFamily = 'Arial, sans-serif';
  banner.style.fontSize = '12px';
  banner.style.maxWidth = '260px';
  banner.style.lineHeight = '1.4';
  banner.textContent = isBad
    ? `Phishing suspected (${severity}, score ${score}). Be cautious.`
    : `Looks safe (${severity}, score ${score}).`;

  const close = document.createElement('button');
  close.textContent = 'Dismiss';
  close.style.marginTop = '8px';
  close.style.background = '#111827';
  close.style.color = '#fff';
  close.style.border = 'none';
  close.style.borderRadius = '8px';
  close.style.padding = '6px 10px';
  close.style.cursor = 'pointer';
  close.addEventListener('click', () => banner.remove());

  banner.appendChild(document.createElement('br'));
  banner.appendChild(close);
  document.body.appendChild(banner);
};

const ensureLoader = () => {
  let loader = document.getElementById('phish-guard-loader');
  if (loader) {
    return loader;
  }

  loader = document.createElement('div');
  loader.id = 'phish-guard-loader';
  loader.style.position = 'fixed';
  loader.style.top = '16px';
  loader.style.left = '50%';
  loader.style.transform = 'translateX(-50%)';
  loader.style.zIndex = '999999';
  loader.style.display = 'none';
  loader.style.background = 'rgba(17, 24, 39, 0.95)';
  loader.style.color = '#fff';
  loader.style.padding = '8px 12px';
  loader.style.borderRadius = '999px';
  loader.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.25)';
  loader.style.fontFamily = 'Arial, sans-serif';
  loader.style.fontSize = '12px';
  loader.style.display = 'flex';
  loader.style.alignItems = 'center';
  loader.style.gap = '8px';

  const spinner = document.createElement('span');
  spinner.style.width = '12px';
  spinner.style.height = '12px';
  spinner.style.border = '2px solid rgba(255, 255, 255, 0.4)';
  spinner.style.borderTopColor = '#fff';
  spinner.style.borderRadius = '50%';
  spinner.style.display = 'inline-block';
  spinner.style.animation = 'phish-guard-spin 0.9s linear infinite';

  const label = document.createElement('span');
  label.textContent = 'Checking this email...';

  const style = document.createElement('style');
  style.textContent = '@keyframes phish-guard-spin { to { transform: rotate(360deg); } }';

  loader.appendChild(spinner);
  loader.appendChild(label);
  document.head.appendChild(style);
  document.body.appendChild(loader);

  return loader;
};

const showLoader = () => {
  const loader = ensureLoader();
  loader.style.display = 'flex';
};

const hideLoader = () => {
  const loader = document.getElementById('phish-guard-loader');
  if (loader) {
    loader.style.display = 'none';
  }
};

const hashText = (value) => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

let lastAnalyzedHash = null;
let pendingTimeout = null;

const scheduleAutoAnalyze = () => {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
  }

  pendingTimeout = setTimeout(async () => {
    if (!chrome.runtime?.id) {
      return;
    }
    const content = getEmailContent();
    if (!content) {
      hideLoader();
      return;
    }

    const hash = hashText(content);
    if (hash === lastAnalyzedHash) {
      hideLoader();
      return;
    }

    lastAnalyzedHash = hash;

    showLoader();

    try {
      await chrome.runtime.sendMessage({
        type: "analyze-email",
        text: content,
        hash
      });
    } catch (error) {
      const message = error?.message || '';
      if (!message.includes('Extension context invalidated')) {
        console.warn("Failed to request email analysis", error);
      }
    } finally {
      hideLoader();
    }
  }, 900);
};

const observer = new MutationObserver(() => {
  scheduleAutoAnalyze();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

scheduleAutoAnalyze();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'extract-email') {
    const content = getEmailContent();
    sendResponse({ ok: Boolean(content), text: content });
    return true;
  }

  if (message?.type === 'show-alert') {
    const severity = message.severity || 'UNKNOWN';
    const score = message.score || 'N/A';
    const status = message.status || 'blocked';
    showAlertBanner(severity, score, status);
  }

  return false;
});
