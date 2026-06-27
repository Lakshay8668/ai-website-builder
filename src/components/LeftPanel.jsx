import { useState } from 'react';
import { Plus, Clock, RotateCcw, Check } from 'lucide-react';

export default function LeftPanel({
  collapsed, pages, activePage, onSelectPage, onAddPage,
  knowledge, onKnowledgeChange,
  versions, activeVersionHTML, onRestoreVersion,
  pagesHTML,
}) {
  const [tab, setTab] = useState('pages'); // pages | knowledge | versions

  if (collapsed) return null;

  return (
    <div className="left-panel">
      {/* Tabs */}
      <div className="left-panel-tabs">
        <div className={`lp-tab ${tab === 'pages' ? 'active' : ''}`} onClick={() => setTab('pages')}>Pages</div>
        <div className={`lp-tab ${tab === 'knowledge' ? 'active' : ''}`} onClick={() => setTab('knowledge')}>Knowledge</div>
        <div className={`lp-tab ${tab === 'versions' ? 'active' : ''}`} onClick={() => setTab('versions')}>History</div>
      </div>

      {/* ── Pages tab ── */}
      {tab === 'pages' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '10px 8px' }}>
          <div className="lp-section-label" style={{ padding: '0 4px', marginBottom: 8 }}>Pages</div>
          {pages.map(p => {
            const hasContent = !!pagesHTML?.[p.id];
            return (
              <div
                key={p.id}
                className={`page-item ${activePage === p.id ? 'active' : ''}`}
                onClick={() => onSelectPage(p.id)}
              >
                <div className="page-item-icon">
                  {p.name === 'Home' ? '🏠' : p.name === 'About' ? '👤' : p.name === 'Contact' ? '✉️' : '📄'}
                </div>
                <span style={{ flex: 1 }}>{p.name}</span>
                {hasContent && <Check size={11} color="var(--green)" />}
              </div>
            );
          })}
          <button
            onClick={onAddPage}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', borderRadius: 8, marginTop: 4 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text-1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}
          >
            <Plus size={13} /> Add page
          </button>

          <p style={{ fontSize: 11, color: 'var(--text-4)', padding: '10px 6px 0', lineHeight: 1.6 }}>
            Each page is generated separately and shares your site's branding via the Knowledge tab.
          </p>

          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div className="lp-section-label" style={{ padding: '0 4px', marginBottom: 8 }}>Files</div>
            {pages.map(p => (
              <div key={p.id} className="page-item">
                <div className="page-item-icon" style={{ fontSize: 9 }}>📄</div>
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.name.toLowerCase().replace(/\s+/g, '-')}.html</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Knowledge tab ── */}
      {tab === 'knowledge' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 12px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.6 }}>
            Add context about your project. AI remembers this and applies it across every page and edit.
          </p>
          <textarea
            className="knowledge-textarea"
            placeholder="Business name, brand colors, target audience, tone of voice, special requirements..."
            value={knowledge}
            onChange={e => onKnowledgeChange(e.target.value)}
            rows={10}
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 8 }}>
            Everything here is included in every AI request automatically.
          </p>
        </div>
      )}

      {/* ── Versions tab ── */}
      {tab === 'versions' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 10px' }}>
          <div className="lp-section-label" style={{ marginBottom: 10, padding: '0 4px' }}>
            Version History
          </div>
          {versions.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-4)', textAlign: 'center', marginTop: 20 }}>
              Versions appear here after each generation on this page
            </p>
          ) : (
            versions.map((v, i) => {
              const isActive = v.html === activeVersionHTML;
              return (
                <div key={v.id} className={`ver-item ${isActive ? 'active' : ''}`} onClick={() => onRestoreVersion(v)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? 'var(--text-1)' : 'var(--bg-3)',
                      color: i === 0 ? 'white' : 'var(--text-3)',
                      fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {versions.length - i}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.prompt}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <Clock size={9} />
                        {new Date(v.createdAt).toLocaleTimeString()}
                        {isActive && <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>· Current</span>}
                      </div>
                    </div>
                    {!isActive && <RotateCcw size={11} color="var(--text-3)" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
