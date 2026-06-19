/* =============================================
   OmniLang — Universal Translator
   app.js
   ============================================= */

// ── Config ────────────────────────────────────
// Replace with your Anthropic API key
const API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-sonnet-4-6';

// ── Language map ──────────────────────────────
const langNames = {
  auto:'Auto-detect',en:'English',hi:'Hindi',zh:'Chinese',es:'Spanish',ar:'Arabic',
  fr:'French',de:'German',ja:'Japanese',ko:'Korean',pt:'Portuguese',ru:'Russian',
  it:'Italian',tr:'Turkish',nl:'Dutch',pl:'Polish',sv:'Swedish',th:'Thai',
  vi:'Vietnamese',id:'Indonesian',fa:'Persian',uk:'Ukrainian',bn:'Bengali',
  ta:'Tamil',te:'Telugu',mr:'Marathi',gu:'Gujarati',pa:'Punjabi',ur:'Urdu',
  ms:'Malay',sw:'Swahili',he:'Hebrew',ro:'Romanian',hu:'Hungarian',cs:'Czech',
  el:'Greek',fi:'Finnish',no:'Norwegian',da:'Danish',sk:'Slovak',hr:'Croatian',
  bg:'Bulgarian',sr:'Serbian',lt:'Lithuanian',lv:'Latvian',et:'Estonian',
  sl:'Slovenian',ka:'Georgian',hy:'Armenian',az:'Azerbaijani',kk:'Kazakh',
  uz:'Uzbek',mn:'Mongolian',ne:'Nepali',si:'Sinhala',km:'Khmer',lo:'Lao',
  my:'Burmese',am:'Amharic',yo:'Yoruba',ig:'Igbo',ha:'Hausa',zu:'Zulu',
  af:'Afrikaans',cy:'Welsh',ga:'Irish',eu:'Basque',ca:'Catalan',gl:'Galician',
  la:'Latin',eo:'Esperanto'
};

// ── DOM refs ──────────────────────────────────
const inputText   = document.getElementById('inputText');
const outputText  = document.getElementById('outputText');
const srcLang     = document.getElementById('srcLang');
const tgtLang     = document.getElementById('tgtLang');
const charCount   = document.getElementById('charCount');
const outCharCount= document.getElementById('outCharCount');
const statusDot   = document.getElementById('statusDot');
const statusMsg   = document.getElementById('statusText');
const micConf     = document.getElementById('micConf');
const confFill    = document.getElementById('confFill');
const confPct     = document.getElementById('confPct');
const translateBtn= document.getElementById('translateBtn');
const micBtn      = document.getElementById('micBtn');
const speakBtn    = document.getElementById('speakBtn');
const copyBtn     = document.getElementById('copyBtn');
const clearBtn    = document.getElementById('clearBtn');
const swapBtn     = document.getElementById('swapBtn');

let history     = [];
let recognition = null;
let isSpeaking  = false;

// ── Helpers ───────────────────────────────────
function setStatus(type, msg) {
  statusMsg.textContent = msg;
  statusDot.className = 'dot' +
    (type === 'loading' ? ' loading' : type === 'listening' ? ' listening' : '');
}

// ── Char counter ──────────────────────────────
inputText.addEventListener('input', () => {
  const l = inputText.value.length;
  if (l > 5000) inputText.value = inputText.value.slice(0, 5000);
  charCount.textContent = Math.min(l, 5000) + ' / 5000';
});

// ── Swap languages ────────────────────────────
swapBtn.addEventListener('click', () => {
  const sv = srcLang.value === 'auto' ? 'en' : srcLang.value;
  const tv = tgtLang.value;
  const inV = inputText.value;
  const outV = outputText.value;
  srcLang.value = tv;
  tgtLang.value = sv;
  inputText.value = outV;
  outputText.value = inV;
  charCount.textContent    = inputText.value.length + ' / 5000';
  outCharCount.textContent = outputText.value.length + ' chars';
});

// ── Clear ─────────────────────────────────────
clearBtn.addEventListener('click', () => {
  inputText.value  = '';
  outputText.value = '';
  charCount.textContent    = '0 / 5000';
  outCharCount.textContent = '0 chars';
  micConf.style.display    = 'none';
  setStatus('ready', 'Ready — type, speak, or paste text to begin');
});

// ── Translate ─────────────────────────────────
translateBtn.addEventListener('click', doTranslate);

inputText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) doTranslate();
});

async function doTranslate() {
  const text = inputText.value.trim();
  if (!text) {
    setStatus('ready', 'Please enter or speak some text first');
    return;
  }

  const src     = srcLang.value;
  const tgt     = tgtLang.value;
  const srcName = langNames[src] || src;
  const tgtName = langNames[tgt] || tgt;

  setStatus('loading', 'Translating with AI…');
  translateBtn.disabled = true;
  outputText.value = '';

  const prompt = src === 'auto'
    ? `You are a professional translator. Detect the source language and translate the following text to ${tgtName}. Return ONLY the translated text with no explanation, no preamble, no language label.\n\nText: ${text}`
    : `You are a professional translator. Translate the following text from ${srcName} to ${tgtName}. Return ONLY the translated text with no explanation, no preamble, no language label.\n\nText: ${text}`;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data        = await res.json();
    const translation = data.content.map(b => b.text || '').join('').trim();

    outputText.value         = translation;
    outCharCount.textContent = translation.length + ' chars';
    setStatus('ready', `Translation complete — ${srcName} → ${tgtName}`);
    addHistory(text, translation, srcName, tgtName);

  } catch (err) {
    console.error(err);
    setStatus('ready', 'Translation failed: ' + err.message);
  }

  translateBtn.disabled = false;
}

// ── Speech-to-Text ────────────────────────────
micBtn.addEventListener('click', () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    setStatus('ready', 'Speech recognition not supported — try Chrome or Edge');
    return;
  }

  if (recognition) {
    recognition.stop();
    return;
  }

  recognition = new SR();
  recognition.lang            = srcLang.value === 'auto' ? 'en-US' : srcLang.value;
  recognition.interimResults  = true;
  recognition.maxAlternatives = 1;
  recognition.continuous      = false;

  micBtn.classList.add('active', 'mic-active');
  setStatus('listening', 'Listening… speak now');

  recognition.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        final += e.results[i][0].transcript;
        const conf = Math.round(e.results[i][0].confidence * 100);
        micConf.style.display = 'flex';
        confFill.style.width  = conf + '%';
        confPct.textContent   = conf + '%';
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    inputText.value        = final || interim;
    charCount.textContent  = inputText.value.length + ' / 5000';
  };

  recognition.onend = () => {
    micBtn.classList.remove('active', 'mic-active');
    recognition = null;
    setStatus('ready', 'Speech captured — click Translate to continue');
  };

  recognition.onerror = (e) => {
    micBtn.classList.remove('active', 'mic-active');
    recognition = null;
    setStatus('ready', 'Microphone error: ' + e.error);
  };

  recognition.start();
});

// ── Text-to-Speech ────────────────────────────
speakBtn.addEventListener('click', () => {
  const text = outputText.value.trim();
  if (!text) {
    setStatus('ready', 'No translation to speak yet');
    return;
  }

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    speakBtn.classList.remove('active');
    return;
  }

  const utt  = new SpeechSynthesisUtterance(text);
  utt.lang   = tgtLang.value;
  utt.rate   = 0.95;
  utt.pitch  = 1;

  utt.onstart = () => {
    isSpeaking = true;
    speakBtn.classList.add('active');
    setStatus('ready', 'Speaking translation…');
  };

  utt.onend = () => {
    isSpeaking = false;
    speakBtn.classList.remove('active');
    setStatus('ready', 'Playback complete');
  };

  utt.onerror = () => {
    isSpeaking = false;
    speakBtn.classList.remove('active');
  };

  window.speechSynthesis.speak(utt);
});

// ── Copy ──────────────────────────────────────
copyBtn.addEventListener('click', () => {
  const text = outputText.value;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.innerHTML = '<i class="ti ti-check"></i>';
    setTimeout(() => copyBtn.innerHTML = '<i class="ti ti-copy"></i>', 1600);
  }).catch(() => {
    // fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
});

// ── History ───────────────────────────────────
function addHistory(src, tgt, srcName, tgtName) {
  history.unshift({ src, tgt, srcName, tgtName });
  if (history.length > 5) history.pop();
  renderHistory();
}

function renderHistory() {
  const sec  = document.getElementById('historySection');
  const list = document.getElementById('historyList');
  sec.style.display = 'block';
  list.innerHTML = '';
  history.forEach((h) => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `
      <div class="hist-langs">${h.srcName} → ${h.tgtName}</div>
      <div class="hist-text">${h.src.slice(0, 90)}${h.src.length > 90 ? '…' : ''}</div>
    `;
    el.addEventListener('click', () => {
      inputText.value          = h.src;
      outputText.value         = h.tgt;
      charCount.textContent    = h.src.length + ' / 5000';
      outCharCount.textContent = h.tgt.length + ' chars';
    });
    list.appendChild(el);
  });
}
