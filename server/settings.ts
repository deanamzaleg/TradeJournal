import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR ?? './data';
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

interface Settings {
  finnhubApiKey?: string;
}

function load(): Settings {
  if (!fs.existsSync(SETTINGS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8')) as Settings;
  } catch {
    return {};
  }
}

function save(s: Settings): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2), 'utf-8');
}

// Returns the API key from settings file first, then .env fallback
export function getApiKey(): string | undefined {
  return load().finnhubApiKey || process.env.FINNHUB_API_KEY || undefined;
}

export function setApiKey(key: string): void {
  const s = load();
  s.finnhubApiKey = key;
  save(s);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}
