import { useState } from 'react';
import { X, Sparkles, Download, RefreshCw } from 'lucide-react';

const STYLES = ['Minimal', 'Modern', 'Playful', 'Elegant', 'Bold', 'Geometric'];

export default function LogoModal({ businessName, currentLogo, onGenerate, onClose }) {
  const [name, setName] = useState(businessName || '');
  const [style, setStyle] = useState('Minimal');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState(currentLogo || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleGenerate() {
    if (!name.trim()) return;
    setLoading(true);
    setError(false);
    const svg = await onGenerate(name.trim(), style, description.trim() || name.trim());
    if (svg) {
      setLogo(svg);
    } else {
      setError(true);
    }
    setLoading(false);
  }

  function handleDownload() {
    if (!logo) return;
    const blob = new Blob([logo], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(name || 'logo').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} /> Make a Logo
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Logo preview */}
        <div style={{
          width: '100%', height: 160, borderRadius: 12, border: '1px solid var(--border)',
          background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16, overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="spinner" style={{ width: 24, height: 24 }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Designing your logo...</span>
            </div>
          ) : logo ? (
            <div style={{ width: 100, height: 100 }} dangerouslySetInnerHTML={{ __html: logo }} />
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>
              {error ? 'Generation failed — try again' : 'Your logo will appear here'}
            </span>
          )}
        </div>

        {/* Business name */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>
            Business Name
          </label>
          <input
            type="text" className="text-input"
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Bloom & Co"
          />
        </div>

        {/* Style picker */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>
            Style
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STYLES.map(s => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className="chip"
                style={s === style ? { background: 'var(--text-1)', color: 'white', borderColor: 'var(--text-1)' } : {}}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>
            Industry / Description <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="text" className="text-input"
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="e.g. flower shop, tech startup, law firm"
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="tb-btn" style={{ flex: 1, justifyContent: 'center', padding: '9px' }}>
            Close
          </button>
          {logo && (
            <button onClick={handleDownload} className="tb-btn" style={{ flex: 1, justifyContent: 'center', padding: '9px' }}>
              <Download size={13} /> Download SVG
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={!name.trim() || loading}
            className="tb-btn primary"
            style={{ flex: 1, justifyContent: 'center', padding: '9px' }}
          >
            {loading ? <div className="spinner" style={{ width: 13, height: 13, borderTopColor: 'white' }} /> : <RefreshCw size={13} />}
            {logo ? 'Regenerate' : 'Generate'}
          </button>
        </div>

        <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 14, lineHeight: 1.6 }}>
          Generated locally by your Ollama model as an SVG. Quality depends on your selected model — coding-capable models (codellama, qwen2.5-coder) tend to produce cleaner SVGs.
        </p>
      </div>
    </div>
  );
}
