import { useRef, useEffect, useState } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Download, ZoomIn, ZoomOut, Sun, Moon, FolderDown } from 'lucide-react';

// Injects a CSS filter-based dark mode into the generated HTML without altering its source.
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

  const frameClass = `preview-frame-wrap ${device}`;

  return (
    <div className="preview-panel">
      {/* Toolbar */}
      <div className="preview-toolbar">
        {/* View toggle */}
        <div className="view-tabs">
          <div className={`vt ${viewMode === 'preview' ? 'active' : ''}`} onClick={() => onViewModeChange('preview')}>Preview</div>
          <div className={`vt ${viewMode === 'code' ? 'active' : ''}`} onClick={() => onViewModeChange('code')}>Code</div>
        </div>

        {/* Device */}
        <div className="dev-tabs" style={{ marginLeft: 8 }}>
          <div className={`dt ${device === 'desktop' ? 'active' : ''}`} onClick={() => setDevice('desktop')} title="Desktop">
            <Monitor size={14} />
          </div>
          <div className={`dt ${device === 'tablet' ? 'active' : ''}`} onClick={() => setDevice('tablet')} title="Tablet">
            <Tablet size={14} />
          </div>
          <div className={`dt ${device === 'mobile' ? 'active' : ''}`} onClick={() => setDevice('mobile')} title="Mobile">
            <Smartphone size={14} />
          </div>
        </div>

        {/* Light/Dark preview toggle */}
        <div className="dev-tabs" style={{ marginLeft: 4 }} title="Preview theme (visual only, doesn't change source)">
          <div className={`dt ${theme === 'light' ? 'active' : ''}`} onClick={() => theme !== 'light' && onToggleTheme()}>
            <Sun size={13} />
          </div>
          <div className={`dt ${theme === 'dark' ? 'active' : ''}`} onClick={() => theme !== 'dark' && onToggleTheme()}>
            <Moon size={13} />
          </div>
        </div>

        {/* Zoom */}
        {viewMode === 'preview' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
            <button className="dt" onClick={() => setZoom(z => Math.max(40, z - 10))}><ZoomOut size={13} /></button>
            <span style={{ fontSize: 11, color: 'var(--text-3)', width: 34, textAlign: 'center' }}>{zoom}%</span>
            <button className="dt" onClick={() => setZoom(z => Math.min(150, z + 10))}><ZoomIn size={13} /></button>
          </div>
        )}

        {/* Right actions */}
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
        <div className="preview-area">
          {!html && !isGenerating && (
            <div className="preview-empty">
              <div className="preview-empty-icon">⬡</div>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Preview will appear here</p>
              <p style={{ fontSize: 11, color: 'var(--text-4)' }}>Start chatting to generate this page</p>
            </div>
          )}
          {isGenerating && !html && (
            <div className="preview-empty">
              <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 12 }}>Generating your website...</p>
            </div>
          )}
          {html && (
            <div
              className={frameClass}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease',
              }}
            >
              <iframe
                ref={iframeRef}
                className="preview-frame"
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          )}
        </div>
      )}

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
