const AGORA_SDK_URL = 'https://download.agora.io/sdk/release/AgoraRTC_N.js';
const AGORA_STORAGE_KEY = 'sana:agora-config';

let sdkPromise = null;

function appendAgoraScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Agora solo está disponible en el navegador.'));
      return;
    }

    if (window.AgoraRTC) {
      resolve(window.AgoraRTC);
      return;
    }

    const existingScript = document.querySelector(`script[src="${AGORA_SDK_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.AgoraRTC), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar Agora SDK.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = AGORA_SDK_URL;
    script.async = true;
    script.onload = () => resolve(window.AgoraRTC);
    script.onerror = () => reject(new Error('No se pudo cargar Agora SDK.'));
    document.head.appendChild(script);
  });
}

export async function loadAgoraRTC() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.AgoraRTC) {
    return window.AgoraRTC;
  }

  if (!sdkPromise) {
    sdkPromise = appendAgoraScript();
  }

  return sdkPromise;
}

export function loadStoredAgoraConfig() {
  if (typeof window === 'undefined') {
    return {
      appId: process.env.REACT_APP_AGORA_APP_ID || '',
      token: process.env.REACT_APP_AGORA_TOKEN || '',
    };
  }

  try {
    const raw = window.localStorage.getItem(AGORA_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    return {
      appId: process.env.REACT_APP_AGORA_APP_ID || stored.appId || '',
      token: process.env.REACT_APP_AGORA_TOKEN || stored.token || '',
    };
  } catch (error) {
    return {
      appId: process.env.REACT_APP_AGORA_APP_ID || '',
      token: process.env.REACT_APP_AGORA_TOKEN || '',
    };
  }
}

export function saveAgoraConfig(config) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    AGORA_STORAGE_KEY,
    JSON.stringify({
      appId: config.appId || '',
      token: config.token || '',
    })
  );
}

function normalizeParticipantId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
}

export function buildDefaultAgoraChannel({ user, callPeer }) {
  const parts = [normalizeParticipantId(user?.id), normalizeParticipantId(callPeer?.id)]
    .filter(Boolean)
    .sort();

  const base = parts.length > 0 ? parts.join('-') : 'general';
  return `doctor365-${base}`.slice(0, 64);
}
