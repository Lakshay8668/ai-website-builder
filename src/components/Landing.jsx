import { useState, useRef } from 'react';
import { Clock, Trash2 } from 'lucide-react';

const CHIPS = [
  'Make me a logo', 'Web Agency Website', 'Rebuild my site',
  'Restaurant', 'Product Launch', 'Boutique Store',
  'Local Food Truck Landing Page', 'Portfolio',
];

const CARD_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function Landing({ onStart, onOpenSettings, projects = [], onOpenProject, onDeleteProject }) {
  const [input, setInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const textRef = useRef(null);

  function submit() {
    const t = input.trim();
    if (!t) return;
    onStart(t);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  function useChip(c) {
    setInput(c);
    textRef.current?.focus();
  }

  function handleDelete(e, id) {
    e.stopPropagation();
    if (confirmDelete === id) {
      onDeleteProject(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 2500);
    }
  }

  return (
    <div className="landing">
      {/* Logo */}
      <div className="landing-logo">
        <div className="landing-logo-mark">A</div>
        <span className="landing-logo-name">AI Builder</span>
      </div>

      <h1 className="landing-headline">What do you want to build?</h1>
      <p className="landing-sub">Describe your website and watch it come to life — powered by your local AI</p>

      {/* Big input box */}
      <div className="landing-input-wrap">
        <textarea
          ref={textRef}
          className="landing-input"
          placeholder="Describe your website idea..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          autoFocus
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
          }}
        />
        <div className="landing-input-footer">
          <button
            onClick={onOpenSettings}
            style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <div className="model-dot" /> AI status
          </button>
          <button className="landing-send-btn" onClick={submit} disabled={!input.trim()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Build it
          </button>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="chips">
        {CHIPS.map(c => (
          <button key={c} className="chip" onClick={() => useChip(c)}>{c}</button>
        ))}
      </div>

      <p style={{ marginTop: 32, fontSize: 11, color: 'var(--text-4)', textAlign: 'center' }}>
        Powered by Gemini · live for everyone · no setup required
      </p>

      {/* Project gallery */}
      {projects.length > 0 && (
        <div style={{ width: '100%', maxWidth: 880, marginTop: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
            Your Projects ({projects.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {projects.map((p, i) => {
              const pageCount = Object.values(p.pagesHTML || {}).filter(Boolean).length;
              const color = CARD_COLORS[i % CARD_COLORS.length];
              return (
                <div
                  key={p.id}
                  onClick={() => onOpenProject(p.id)}
                  style={{
                    border: '1px solid var(--border)', borderRadius: 12,
                    overflow: 'hidden', cursor: 'pointer', background: 'var(--bg)',
                    transition: 'all 0.15s', position: 'relative',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    height: 110, background: `linear-gradient(135deg, ${color}22, ${color}08)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  }}>
                    {p.logo ? (
                      <div style={{ width: 44, height: 44 }} dangerouslySetInnerHTML={{ __html: p.logo }} />
                    ) : (
                      <div style={{
                        width: 36, height: 36, borderRadius: 9, background: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 16, fontWeight: 700,
                      }}>
                        {p.projectName?.[0]?.toUpperCase() || 'W'}
                      </div>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 24, height: 24, borderRadius: 6,
                        background: confirmDelete === p.id ? '#fee2e2' : 'rgba(255,255,255,0.85)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: confirmDelete === p.id ? '#dc2626' : 'var(--text-3)',
                      }}
                      title={confirmDelete === p.id ? 'Click again to confirm' : 'Delete project'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {/* Info */}
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.projectName || 'Untitled'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}>
                      <Clock size={9} /> {timeAgo(p.updatedAt)}
                      {pageCount > 0 && <><span>·</span><span>{pageCount} page{pageCount !== 1 ? 's' : ''}</span></>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
