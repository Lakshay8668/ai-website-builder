import { useState, useEffect } from 'react';
import Landing from './components/Landing.jsx';
import TopBar from './components/TopBar.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import PreviewPanel from './components/PreviewPanel.jsx';
import StatusModal from './components/StatusModal.jsx';
import LogoModal from './components/LogoModal.jsx';
import {
  streamGenerate, extractHTML, extractSVG,
  buildPagePrompt, buildLogoPrompt,
  deriveDesignDNA, injectAnimationToolkit,
} from './ai.js';

// ── helpers ──────────────────────────────────────────────────────
const STORAGE_KEY = 'airo_projects_v2';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function persistAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const DEFAULT_PAGES = [
  { id: 'home', name: 'Home' },
  { id: 'about', name: 'About' },
  { id: 'contact', name: 'Contact' },
];

function freshProject(name, description) {
  const id = uid();
  return {
    id,
    projectName: name,
    description,
    dna: deriveDesignDNA(id),  // unique visual identity locked in at creation, shared across all pages
    messages: [],              // chat history (shared across pages, tagged by pageId)
    pagesHTML: {},             // { pageId: htmlString }
    pageVersions: {},          // { pageId: [{id, prompt, html, createdAt}] }
    pages: DEFAULT_PAGES,
    activePage: 'home',
    knowledge: '',
    logo: null,                // svg string
    theme: 'light',            // light | dark (preview theme)
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]             = useState('landing'); // landing | editor
  const [showStatus, setShowStatus]     = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  const [allProjects, setAllProjects]   = useState(() => loadAll().projects || {});
  const [project, setProject]           = useState(null); // active project object

  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode]         = useState('preview'); // preview | code
  const [sidebarOpen, setSidebarOpen]   = useState(true);

  // ── derived ──
  const activePageId = project?.activePage;
  const previewHTML = project?.pagesHTML?.[activePageId] || null;
  const messages = (project?.messages || []).filter(m => !m.pageId || m.pageId === activePageId);
  const versions = project?.pageVersions?.[activePageId] || [];

  // ── Persist helper ──
  function persistProject(updated) {
    setProject(updated);
    setAllProjects(prev => {
      const next = { ...prev, [updated.id]: { ...updated, updatedAt: Date.now() } };
      persistAll({ projects: next });
      return next;
    });
  }

  function patchProject(patch) {
    if (!project) return;
    const updated = { ...project, ...(typeof patch === 'function' ? patch(project) : patch) };
    persistProject(updated);
  }

  // ── Start new project from landing ──
  function handleLandingStart(promptText) {
    const name = promptText.length > 45 ? promptText.slice(0, 45) + '…' : promptText;
    const proj = freshProject(name, promptText);
    persistProject(proj);
    setScreen('editor');
    generate(promptText, proj, proj.activePage);
  }

  function handleOpenProject(id) {
    const p = allProjects[id];
    if (!p) return;
    setProject(p);
    setScreen('editor');
  }

  function handleNewProject() {
    setProject(null);
    setScreen('landing');
  }

  function handleDeleteProject(id) {
    setAllProjects(prev => {
      const next = { ...prev };
      delete next[id];
      persistAll({ projects: next });
      return next;
    });
    if (project?.id === id) { setProject(null); setScreen('landing'); }
  }

  // ── Generate (page-aware) ──
  async function generate(userText, baseProject, pageId) {
    const proj = baseProject || project;
    const page = proj.pages.find(p => p.id === pageId) || proj.pages[0];

    const userMsg = { id: uid(), role: 'user', content: userText, pageId };
    let working = { ...proj, messages: [...proj.messages, userMsg] };
    persistProject(working);
    setIsGenerating(true);
    setViewMode('preview');

    const aiId = uid();
    const aiMsg = { id: aiId, role: 'ai', content: '', streaming: true, hasCode: false, pageId };
    working = { ...working, messages: [...working.messages, aiMsg] };
    persistProject(working);

    const existingHTML = proj.pagesHTML?.[pageId] || null;
    const knowledgePrefix = proj.knowledge?.trim()
      ? `PROJECT CONTEXT (always apply this):\n${proj.knowledge.trim()}\n\n`
      : '';

    const sitePrompt = buildPagePrompt({
      userPrompt: userText,
      pageName: page.name,
      siteContext: { id: proj.id, siteName: proj.projectName, description: proj.description, pages: proj.pages, dna: proj.dna },
      existingHTML,
      mode: existingHTML ? 'edit' : 'create',
    });
    const prompt = knowledgePrefix + sitePrompt;

    let detectedHTML = null;

    await streamGenerate({
      prompt,
      onChunk: (_chunk, full) => {
        const html = extractHTML(full);
        if (html && html !== detectedHTML) {
          detectedHTML = html;
          const withMotion = injectAnimationToolkit(html);
          setProject(prev => prev ? { ...prev, pagesHTML: { ...prev.pagesHTML, [pageId]: withMotion } } : prev);
        }
        const display = html ? `✓ ${page.name} page generated! Check the preview →` : (full.length > 250 ? full.slice(0, 250) + '…' : full);
        setProject(prev => prev ? {
          ...prev,
          messages: prev.messages.map(m => m.id === aiId ? { ...m, content: display } : m),
        } : prev);
      },
      onDone: (full) => {
        const rawHtml = extractHTML(full) || detectedHTML;
        const html = rawHtml ? injectAnimationToolkit(rawHtml) : null;
        setProject(prev => {
          if (!prev) return prev;
          let next = { ...prev };
          if (html) {
            next.pagesHTML = { ...next.pagesHTML, [pageId]: html };
            const ver = { id: uid(), prompt: userText, html, createdAt: Date.now() };
            const prevVers = next.pageVersions?.[pageId] || [];
            next.pageVersions = { ...next.pageVersions, [pageId]: [ver, ...prevVers] };
          }
          next.messages = next.messages.map(m => m.id === aiId ? {
            ...m, streaming: false, hasCode: !!html,
            content: html
              ? `Your "${page.name}" page is ready! You can see it in the preview. Ask me to make changes — colors, layout, content, new sections — anything.`
              : (full || 'Something went wrong. Please try again with a more specific description.'),
          } : m);
          persistAll({ projects: { ...allProjects, [next.id]: next } });
          setAllProjects(ap => ({ ...ap, [next.id]: next }));
          return next;
        });
        setIsGenerating(false);
      },
      onError: (err) => {
        setProject(prev => prev ? {
          ...prev,
          messages: prev.messages.map(m => m.id === aiId ? { ...m, streaming: false, content: `Error: ${err}` } : m),
        } : prev);
        setIsGenerating(false);
      },
    });
  }

  function handleChatSend(text) {
    generate(text, project, project.activePage);
  }

  function handleReset() {
    patchProject(prev => ({
      messages: prev.messages.filter(m => m.pageId !== prev.activePage),
      pagesHTML: { ...prev.pagesHTML, [prev.activePage]: null },
    }));
  }

  function handleSelectPage(pageId) {
    patchProject({ activePage: pageId });
  }

  function handleAddPage() {
    const name = prompt('Page name:');
    if (!name?.trim()) return;
    const p = { id: uid(), name: name.trim() };
    patchProject(prev => ({ pages: [...prev.pages, p], activePage: p.id }));
  }

  function handleKnowledgeChange(val) {
    patchProject({ knowledge: val });
  }

  function handleRestoreVersion(ver) {
    patchProject(prev => ({
      pagesHTML: { ...prev.pagesHTML, [prev.activePage]: ver.html },
    }));
  }

  function handleDownload() {
    if (!previewHTML) return;
    const name = (project.projectName || 'website').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const pageName = project.pages.find(p => p.id === activePageId)?.name || 'page';
    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name}-${pageName.toLowerCase()}.html`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadAll() {
    const pages = project.pages.filter(p => project.pagesHTML?.[p.id]);
    if (pages.length === 0) return;
    pages.forEach((p, i) => {
      setTimeout(() => {
        const blob = new Blob([project.pagesHTML[p.id]], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${p.name.toLowerCase()}.html`; a.click();
        URL.revokeObjectURL(url);
      }, i * 300);
    });
  }

  function handleOpenInTab() {
    if (!previewHTML) return;
    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // ── Logo generation ──
  async function handleGenerateLogo(businessName, style, description) {
    const prompt = buildLogoPrompt(businessName, style, description);
    let svg = null;
    await streamGenerate({
      prompt,
      onChunk: (_c, full) => { const s = extractSVG(full); if (s) svg = s; },
      onDone: (full) => { svg = extractSVG(full) || svg; },
      onError: () => {},
    });
    if (svg) patchProject({ logo: svg });
    return svg;
  }

  function handleToggleTheme() {
    patchProject(prev => ({ theme: prev.theme === 'light' ? 'dark' : 'light' }));
  }

  // ── Landing screen ──
  if (screen === 'landing' || !project) {
    return (
      <>
        <Landing
          onStart={handleLandingStart}
          onOpenSettings={() => setShowStatus(true)}
          projects={Object.values(allProjects).sort((a, b) => b.updatedAt - a.updatedAt)}
          onOpenProject={handleOpenProject}
          onDeleteProject={handleDeleteProject}
        />
        {showStatus && <StatusModal onClose={() => setShowStatus(false)} />}
      </>
    );
  }

  // ── Editor screen ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <TopBar
        projectName={project.projectName}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(s => !s)}
        onOpenSettings={() => setShowStatus(true)}
        onSave={() => persistProject(project)}
        onNewProject={handleNewProject}
        isGenerating={isGenerating}
        logo={project.logo}
        onOpenLogoModal={() => setShowLogoModal(true)}
        paletteName={project.dna?.palette?.name}
        accentColor={project.dna?.palette?.accent}
      />

      <div className="editor">
        {sidebarOpen && (
          <LeftPanel
            collapsed={false}
            pages={project.pages}
            activePage={project.activePage}
            onSelectPage={handleSelectPage}
            onAddPage={handleAddPage}
            knowledge={project.knowledge}
            onKnowledgeChange={handleKnowledgeChange}
            versions={versions}
            activeVersionHTML={previewHTML}
            onRestoreVersion={handleRestoreVersion}
            pagesHTML={project.pagesHTML}
          />
        )}

        <ChatPanel
          messages={messages}
          isGenerating={isGenerating}
          onSend={handleChatSend}
          onReset={handleReset}
          activePageName={project.pages.find(p => p.id === activePageId)?.name}
        />

        <PreviewPanel
          html={previewHTML}
          isGenerating={isGenerating}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onDownload={handleDownload}
          onDownloadAll={handleDownloadAll}
          onOpenInTab={handleOpenInTab}
          theme={project.theme}
          onToggleTheme={handleToggleTheme}
          multiPage={project.pages.length > 1}
        />
      </div>

      {showStatus && <StatusModal onClose={() => setShowStatus(false)} />}
      {showLogoModal && (
        <LogoModal
          businessName={project.projectName}
          currentLogo={project.logo}
          onGenerate={handleGenerateLogo}
          onClose={() => setShowLogoModal(false)}
        />
      )}
    </div>
  );
}
