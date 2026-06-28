import { useRef, useEffect, useState } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Download, ZoomIn, ZoomOut, Sun, Moon, FolderDown } from 'lucide-react';

function injectDarkMode(html) {
  if (!html) return html;
  const darkStyle = `
<style id="__airo_dark_override">
  html { filter: invert(0.92) hue-rotate(180deg); background: #fff; }
  img, video, picture, svg, [style*="background-image"] { filter: invert(1) hue-rotate(180deg); }
</style>`;
  if (html.includes('</head>')) return html.replace('</head>', `${darkStyle}</head>`);
  return darkStyle + html;
}

// Animated skeleton that mimics a website being built
function SkeletonPreview() {
  return (
    <div style={{ width: '100%', height: '100%', padding: '0', overflow: 'hidden', position: 'relative', background: '#f7f7f8' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .skel {
          background: linear-gradient(90deg, #e8e8ec 25%, #f4f4f6 50%, #e8e8ec 75%);
          background-size: 600px 100%;
          animation: shimmer 1.6s ease-in-out infinite;
          border-radius: 6px;
        }
      `}</style>

      {/* Fake nav */}
      <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <div className="skel" style={{ width: 100, height: 20 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          {[60, 50, 60, 50].map((w, i) => <div key={i} className="skel" style={{ width: w, height: 14 }} />)}
        </div>
      </div>

      {/* Fake hero */}
      <div style={{ padding: '40px 32px 32px', background: '#fff' }}>
        <div className="skel" style={{ width: '65%', height: 48, marginBottom: 16 }} />
        <div className="skel" style={{ width: '45%', height: 48, marginBottom: 24 }} />
        <div className="skel" style={{ width: '55%', height: 18, marginBottom: 10 }} />
        <div className="skel" style={{ width: '40%', height: 18, marginBottom: 28 }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="skel" style={{ width: 140, height: 44, borderRadius: 22 }} />
          <div className="skel" style={{ width: 120, height: 44, borderRadius: 22 }} />
        </div>
      </div>

      {/* Fake cards */}
      <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, background: '#f7f7f8' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 20, animationDelay: `${i * 0.1}s` }}>
            <div className="skel" style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 14 }} />
            <div className="skel" style={{ width: '70%', height: 16, marginBottom: 10 }} />
            <div className="skel" style={{ width: '90%', height: 12, marginBottom: 6 }} />
            <div className="skel" style={{ width: '75%', height: 12 }} />
          </div>
        ))}
      </div>

      {/* Fake footer bar */}
      <div style={{ padding: '20px 32px', background: '#fff', display: 'flex', gap: 16, alignItems: 'center' }}>
        <div className="skel" style={{ width: 80, height: 14 }} />
        <div className="skel" style={{ width: 60, height: 14 }} />
        <div className="skel" style={{ width: 80, height: 14 }} />
        <div style={{ marginLeft: 'auto' }}><div className="skel" style={{ width: 120, height: 14 }} /></div>
      </div>

      {/* Centered status badge */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        background: 'white', border: '1px solid #e2e2e6', borderRadius: 20,
        padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)', whiteSpace: 'nowrap',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
        <span style={{ fontSize: 12, color: '#444450' }}>Gemini is building your page...</span>
      </div>
    </div>
  );
}

export default function PreviewPanel({
  html, isGenerating, viewMode, onViewModeChange,
  onDownload, onDownloadAll, onOpenInTab,
  theme, onToggleTheme, multiPage,
}) {
  const [device, setDevice] = useState('desktop');
  const [zoom, setZoom] = useState(100);
  const iframeRef = useRef(null);

  const renderedHTML = theme === 'dark' ? injectDarkMode(html) : html;

  useEffect(() => {
    if (iframeRef.current && renderedHTML) {
      iframeRef.current.srcdoc = renderedHTML;
    }
  }, [renderedHTML]);

  function refresh() {
    if (iframeRef.current && renderedHTML) {
      iframeRef.current.srcdoc = '';
      setTimeout(() => { iframeRef.current.srcdoc = renderedHTML; }, 50);
    }
  }

  const deviceWidths = { desktop: '100%', tablet: '768px', mobile: '390px' };

  return (
    <div className="preview-panel">
      {/* Toolbar */}
      <div className="preview-toolbar">
        <div className="view-tabs">
          <div className={`vt ${viewMode === 'preview' ? 'active' : ''}`} onClick={() => onViewModeChange('preview')}>Preview</div>
          <div className={`vt ${viewMode === 'code' ? 'active' : ''}`} onClick={() => onViewModeChange('code')}>Code</div>
        </div>

        <div className="dev-tabs" style={{ marginLeft: 8 }}>
          {[['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]].map(([id, Icon]) => (
            <div key={id} className={`dt ${device === id ? 'active' : ''}`} onClick={() => setDevice(id)} title={id}>
              <Icon size={14} />
            </div>
          ))}
        </div>

        <div className="dev-tabs" style={{ marginLeft: 4 }} title="Light / Dark preview">
          <div className={`dt ${theme === 'light' ? 'active' : ''}`} onClick={() => theme !== 'light' && onToggleTheme()}><Sun size={13} /></div>
          <div className={`dt ${theme === 'dark' ? 'active' : ''}`} onClick={() => theme !== 'dark' && onToggleTheme()}><Moon size={13} /></div>
        </div>

        {viewMode === 'preview' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
            <button className="dt" onClick={() => setZoom(z => Math.max(40, z - 10))}><ZoomOut size={13} /></button>
            <span style={{ fontSize: 11, color: 'var(--text-3)', width: 34, textAlign: 'center' }}>{zoom}%</span>
            <button className="dt" onClick={() => setZoom(z => Math.min(150, z + 10))}><ZoomIn size={13} /></button>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {html && <>
            <button className="tb-btn" onClick={refresh} title="Refresh"><RefreshCw size={12} /></button>
            <button className="tb-btn" onClick={onOpenInTab} title="Open in new tab"><ExternalLink size={12} /></button>
            {multiPage && (
              <button className="tb-btn" onClick={onDownloadAll} title="Download all pages">
                <FolderDown size={12} /> Export All
              </button>
            )}
            <button className="tb-btn green" onClick={onDownload}>
              <Download size={12} /> Export
            </button>
          </>}
        </div>
      </div>

      {/* Preview area */}
      {viewMode === 'preview' && (
        <div className="preview-area" style={{ position: 'relative' }}>
          {/* Empty state */}
          {!html && !isGenerating && (
            <div className="preview-empty">
              <div className="preview-empty-icon">⬡</div>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Preview will appear here</p>
              <p style={{ fontSize: 11, color: 'var(--text-4)' }}>Start chatting to generate this page</p>
            </div>
          )}

          {/* Skeleton loading while Gemini generates */}
          {isGenerating && !html && <SkeletonPreview />}

          {/* Actual preview */}
          {html && (
            <div
              style={{
                width: device === 'desktop' ? '100%' : deviceWidths[device],
                height: device === 'desktop' ? '100%' : 'auto',
                minHeight: device !== 'desktop' ? 700 : undefined,
                margin: device !== 'desktop' ? '20px auto' : 0,
                borderRadius: device === 'mobile' ? 20 : device === 'tablet' ? 10 : 0,
                overflow: 'hidden',
                boxShadow: device !== 'desktop' ? '0 8px 40px rgba(0,0,0,0.15)' : 'none',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
            >
              <iframe
                ref={iframeRef}
                className="preview-frame"
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                style={{ width: '100%', height: '100%', border: 'none', minHeight: 700 }}
              />
            </div>
          )}
        </div>
      )}

      {/* Code view */}
      {viewMode === 'code' && (
        <div className="code-view" style={{ flex: 1 }}>
          {html
            ? <pre>{html}</pre>
            : <p style={{ color: 'var(--text-4)', fontSize: 12 }}>No code yet. Generate this page first.</p>
          }
        </div>
      )}

      {/* Status bar */}
      {html && (
        <div className="preview-statusbar">
          <div className="status-green" />
          <span>Ready</span>
          <span>·</span>
          <span>{(html.length / 1024).toFixed(1)} KB</span>
          <span>·</span>
          <span style={{ textTransform: 'capitalize' }}>{device}</span>
          {zoom !== 100 && <><span>·</span><span>{zoom}%</span></>}
          <span>·</span>
          <span style={{ textTransform: 'capitalize' }}>{theme} preview</span>
        </div>
      )}
    </div>
  );
}
