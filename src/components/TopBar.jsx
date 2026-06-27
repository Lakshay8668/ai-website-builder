import { PanelLeftClose, PanelLeftOpen, Settings, Save, Sparkles } from 'lucide-react';

export default function TopBar({
  projectName, sidebarOpen, onToggleSidebar, onOpenSettings, onSave, onNewProject,
  isGenerating, logo, onOpenLogoModal, paletteName, accentColor,
}) {
  return (
    <div className="topbar">
      {/* Logo */}
      <div className="topbar-logo">
        <div className="topbar-logo-mark">A</div>
        <span className="topbar-logo-name">AI Builder</span>
      </div>

      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="tb-btn"
        style={{ padding: '5px 8px', border: 'none', background: 'none', color: 'var(--text-3)' }}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
      </button>

      {/* Project logo thumbnail, if generated */}
      {logo && (
        <div
          style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'white', cursor: 'pointer' }}
          onClick={onOpenLogoModal}
          title="Edit logo"
          dangerouslySetInnerHTML={{ __html: logo }}
        />
      )}

      {projectName && (
        <>
          <span className="topbar-sep">›</span>
          <span className="topbar-project-name">{projectName}</span>
        </>
      )}

      {paletteName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 9px' }} title="Unique design identity for this project">
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: accentColor || 'var(--text-3)' }} />
          {paletteName}
        </div>
      )}

      {isGenerating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>
          <div className="spinner" style={{ width: 12, height: 12 }} />
          Generating...
        </div>
      )}

      <div className="topbar-right">
        <div className="model-badge">
          <div className="model-dot" />
          Gemini
        </div>

        <button className="tb-btn" onClick={onOpenLogoModal} title="Generate a logo for your business">
          <Sparkles size={13} /> {logo ? 'Edit Logo' : 'Make a Logo'}
        </button>

        {projectName && (
          <button className="tb-btn" onClick={onSave}>
            <Save size={13} /> Save
          </button>
        )}

        <button className="tb-btn" onClick={onNewProject}>
          + New
        </button>

        <button
          onClick={onOpenSettings}
          className="tb-btn"
          style={{ padding: '5px 9px' }}
          title="Settings"
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
}
