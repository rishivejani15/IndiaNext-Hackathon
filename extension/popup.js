document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyze-btn');
  const message = document.getElementById('message');
  const resultEl = document.getElementById('result');

  const API_URL = 'https://rudraaaa76-kavach-endpoints.hf.space/api/analyze';
  const PROFILE = {
    role: 'Developer',
    industry: 'Technology',
    tools: ['Gmail', 'GitHub'],
    team_size: 'Just me'
  };
  const USER_ID = 'demo';
  const SEVERITY_BLOCKLIST = new Set(['MEDIUM', 'HIGH', 'CRITICAL']);
  const SCORE_BLOCK_THRESHOLD = 60;

  const setMessage = (text) => {
    message.classList.remove('show');
    setTimeout(() => {
      message.textContent = text;
      message.classList.add('show');
    }, 100);
  };

  const renderResult = (result) => {
    resultEl.innerHTML = '';

    if (!result) {
      return;
    }

    const severity = result?.fusion?.severity || 'UNKNOWN';
    const score = result?.fusion?.final_score ?? 0;
    const verdict = result?.engines?.phishing?.verdict || 'No verdict';
    const summary = result?.explanation?.executive_summary || 'No summary provided.';
    const isBad = SEVERITY_BLOCKLIST.has(severity) || score >= SCORE_BLOCK_THRESHOLD;

    const badge = document.createElement('span');
    badge.className = `badge ${isBad ? 'badge-bad' : 'badge-good'}`;
    badge.textContent = isBad ? 'PHISHING SUSPECTED' : 'LOOKS SAFE';

    const card = document.createElement('div');
    card.className = 'result-card';

    card.innerHTML = `
      <div class="result-row">
        <span class="label">Severity</span>
        <span class="value">${severity}</span>
      </div>
      <div class="result-row">
        <span class="label">Score</span>
        <span class="value">${Number(score).toFixed(1)}</span>
      </div>
      <div class="result-row">
        <span class="label">Verdict</span>
        <span class="value">${verdict}</span>
      </div>
      <div class="result-row">
        <span class="label">Summary</span>
        <span class="value">${summary}</span>
      </div>
    `;

    resultEl.appendChild(badge);
    resultEl.appendChild(card);
  };

  analyzeBtn.addEventListener('click', async () => {
    resultEl.innerHTML = '';

    setMessage('Reading the current email...');
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add('disabled');

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (!activeTab || !activeTab.id) {
        setMessage('No active tab found.');
        return;
      }

      let extractResponse = null;
      try {
        extractResponse = await chrome.tabs.sendMessage(activeTab.id, {
          type: 'extract-email'
        });
      } catch (error) {
        extractResponse = null;
      }

      if (!extractResponse || !extractResponse.ok || !extractResponse.text) {
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
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
          }
        });

        if (result) {
          extractResponse = { ok: true, text: result };
        }
      }

      if (!extractResponse || !extractResponse.ok || !extractResponse.text) {
        setMessage('Open a Gmail message to analyze.');
        resultEl.innerHTML = '<p class="empty">No email content detected on this page.</p>';
        return;
      }

      const text = extractResponse.text;
      setMessage('Analyzing email...');

      const apiResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          profile: PROFILE,
          user_id: USER_ID
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      setMessage('Analysis complete.');
      renderResult(result);

      const severity = result?.fusion?.severity || 'UNKNOWN';
      const score = result?.fusion?.final_score ?? 0;
      const isBad = SEVERITY_BLOCKLIST.has(severity) || score >= SCORE_BLOCK_THRESHOLD;
      if (isBad) {
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'show-alert',
          severity,
          score: Number(score).toFixed(1)
        });
      }
    } catch (error) {
      setMessage('Unable to analyze right now.');
      resultEl.innerHTML = '<p class="empty">Check your connection and try again.</p>';
      console.error(error);
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove('disabled');
    }
  });
});
