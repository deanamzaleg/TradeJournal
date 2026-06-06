import { useState, useEffect } from 'react';
import { RefreshCw, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

interface Props {
  onRefresh: () => Promise<void>;
}

export function FinnhubPanel({ onRefresh }: Props) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<'ok' | 'err' | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    api.settings.get().then(r => setHasKey(r.hasApiKey)).catch(() => setHasKey(false));
  }, []);

  async function handleSave() {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.settings.setApiKey(apiKeyInput.trim());
      setHasKey(true);
      setApiKeyInput('');
      setSaveMsg('ok');
      await onRefresh();
    } catch {
      setSaveMsg('err');
    } finally {
      setSaving(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try { await onRefresh(); } finally { setRefreshing(false); }
  }

  return (
    <div className="tj-card p-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2 text-xs text-muted shrink-0">
        <Key size={14} className="text-accent" />
        <span className="uppercase tracking-wide font-medium">Finnhub</span>
        {hasKey === true && <span className="flex items-center gap-1 text-positive"><CheckCircle size={12} /> Key set</span>}
        {hasKey === false && <span className="flex items-center gap-1 text-negative"><AlertCircle size={12} /> No key</span>}
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
        <input
          type="password"
          placeholder={hasKey ? 'Enter new API key to replace…' : 'Enter Finnhub API key…'}
          value={apiKeyInput}
          onChange={e => { setApiKeyInput(e.target.value); setSaveMsg(null); }}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          className="flex-1 bg-panel-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text placeholder:text-muted focus:outline-none focus:border-accent"
        />
        <button
          onClick={handleSave}
          disabled={saving || !apiKeyInput.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-bg hover:bg-accent-hover disabled:opacity-40 cursor-pointer disabled:cursor-default transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saveMsg === 'ok' && <span className="text-xs text-positive">Saved</span>}
        {saveMsg === 'err' && <span className="text-xs text-negative">Failed</span>}
      </div>

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        title="Refresh live prices"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted hover:text-text hover:border-accent/40 disabled:opacity-40 cursor-pointer disabled:cursor-default transition-colors shrink-0"
      >
        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        {refreshing ? 'Refreshing…' : 'Refresh Prices'}
      </button>
    </div>
  );
}
