# OmniLang — Universal Translator

A god-tier AI-powered speech & text translator supporting 70+ languages.
Built with pure HTML, CSS, and JavaScript — no frameworks, no build tools.

---

## Features

- **Speech-to-Text** — Speak into your mic; text appears in real-time
- **AI Translation** — Powered by Claude (claude-sonnet-4-6) for accurate, context-aware translations
- **Text-to-Speech** — Reads the translated text aloud in the correct language voice
- **70+ Languages** — Including Hindi, Arabic, Japanese, Tamil, Swahili, Latin, Esperanto, and more
- **Auto-detect** — Automatically detects your source language
- **Swap** — Instantly swap source ↔ target languages and text
- **History** — Last 5 translations saved, click to restore
- **Dark mode** — Automatic dark/light mode via CSS media query
- **Keyboard shortcut** — `Ctrl + Enter` to translate

---

## Setup

### 1. Get an Anthropic API key
Sign up at https://console.anthropic.com and create an API key.

### 2. Add your API key
Open `app.js` and replace line 8:
```js
const API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';
```
with your actual key:
```js
const API_KEY = 'sk-ant-api03-...';
```

### 3. Open in browser
Simply open `index.html` in **Chrome** or **Edge** (recommended for full speech support).

> **Note:** Speech-to-text uses the Web Speech API which works best in Chromium-based browsers.
> Translation and TTS work in all modern browsers.

---

## File structure

```
omnilang/
├── index.html   — Main UI
├── style.css    — All styles (dark mode included)
├── app.js       — Logic: translation, STT, TTS, history
└── README.md    — This file
```

---

## Usage

| Action | How |
|--------|-----|
| Type text | Type in the left panel |
| Speak | Click the mic icon, speak, click again to stop |
| Translate | Click **Translate** or press `Ctrl + Enter` |
| Listen | Click the speaker icon on the right panel |
| Copy | Click the copy icon |
| Swap | Click the ⇄ button between language selectors |
| Restore history | Click any item in Recent translations |

---

## Tech stack

- Vanilla HTML / CSS / JavaScript
- [Anthropic Claude API](https://docs.anthropic.com) for translation
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for STT & TTS
- [Tabler Icons](https://tabler.io/icons) for UI icons

---

## License
MIT — free to use and modify.
