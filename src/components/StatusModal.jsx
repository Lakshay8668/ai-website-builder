import { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { checkConnection } from '../ai.js';

export default function StatusModal({ onClose }) {
  const [status, setStatus] = useState('checking'); // checking | ok | error
  const [error, setError] = useState('');

  async function runCheck() {
    setStatus('checking');
    setError('');
    const result = await checkConnection();
    if (result.ok) {
      setStatus('ok');
    } else {
      setStatus('error');
      setError(result.error || 'Unknown error');
    }
  }

  useEffect(() => { runCheck(); }, []);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} /> AI Status
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div className={`conn-status ${status === 'ok' ? 'conn-ok' : status === 'error' ? 'conn-err' : ''}`}>
          {status === 'ok'
            ? <CheckCircle size={16} color="var(--green)" />
            : status === 'error'
            ? <AlertCircle size={16} color="var(--red)" />
            : <div className="spinner" />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>
              {status === 'ok' ? 'Connected — Gemini is ready'
                : status === 'error' ? 'Not connected'
                : 'Checking connection...'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>via /api/generate</div>
          </div>
          <button onClick={runCheck} disabled={status === 'checking'}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-2)' }}>
            <RefreshCw size={11} /> Retry
          </button>
        </div>

        {status === 'error' && (
          <div style={{ marginTop: 10, padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
            <strong>Error:</strong> {error}
            <br /><br />
            If you're the site owner: make sure <code style={{ background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>GEMINI_API_KEY</code> is set in your hosting provider's environment variables, then redeploy.
          </div>
        )}

        {status === 'ok' && (
          <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
            Powered by Google Gemini. No setup needed on your end — just start describing your website.
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="tb-btn primary" style={{ padding: '8px 18px' }}>Close</button>
        </div>
      </div>
    </div>
  );
}
