import { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getModels } from '../ollama.js';

export default function SettingsModal({ model, onSave, onClose }) {
  const [models, setModels] = useState([]);
  const [selected, setSelected] = useState(model || '');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');

  async function fetchModels() {
    setLoading(true);
    setStatus('idle');
    const m = await getModels();
    setModels(m);
    setStatus(m.length > 0 ? 'ok' : 'error');
    if (m.length > 0 && !selected) setSelected(m[0].name);
    setLoading(false);
  }

  useEffect(() => { fetchModels(); }, []);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="modal-title" style={{ margin: 0 }}>Settings</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Connection status */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Ollama Connection
          </div>
          <div className={`conn-status ${status === 'ok' ? 'conn-ok' : status === 'error' ? 'conn-err' : ''}`}>
            {status === 'ok'
              ? <CheckCircle size={16} color="var(--green)" />
              : status === 'error'
              ? <AlertCircle size={16} color="var(--red)" />
              : <div className="spinner" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>
                {status === 'ok' ? `Connected — ${models.length} model${models.length !== 1 ? 's' : ''} found`
                  : status === 'error' ? 'Not connected — is Ollama running?'
                  : 'Checking...'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>localhost:11434</div>
            </div>
            <button onClick={fetchModels} disabled={loading}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-2)' }}>
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Retry
            </button>
          </div>

          {status === 'error' && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
              <strong>Start Ollama:</strong> <code style={{ background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>ollama serve</code>
              <br />
              <strong>Pull a model:</strong> <code style={{ background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>ollama pull llama3</code>
            </div>
          )}
        </div>

        {/* Model select */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            AI Model
          </div>
          {models.length === 0
            ? <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: 'var(--text-4)', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-2)' }}>
                No models found. Pull one with: <code style={{ fontFamily: 'monospace', color: 'var(--text-2)' }}>ollama pull llama3</code>
              </div>
            : <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {models.map(m => (
                  <div key={m.name} className={`model-option ${selected === m.name ? 'selected' : ''}`} onClick={() => setSelected(m.name)}>
                    <div className={`model-radio ${selected === m.name ? 'selected' : ''}`}>
                      {selected === m.name && <div className="model-radio-dot" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{m.name}</div>
                      {m.size && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{(m.size / 1e9).toFixed(1)} GB</div>}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Tip */}
        <div style={{ marginBottom: 20, padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-2)' }}>Best models for websites:</strong> llama3, codellama, qwen2.5-coder, deepseek-coder, mistral
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="tb-btn" style={{ flex: 1, justifyContent: 'center', padding: '9px' }}>Cancel</button>
          <button
            onClick={() => { onSave(selected); onClose(); }}
            disabled={!selected}
            className="tb-btn primary"
            style={{ flex: 1, justifyContent: 'center', padding: '9px' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
