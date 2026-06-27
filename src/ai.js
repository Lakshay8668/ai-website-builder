// This file now talks to OUR OWN serverless proxy at /api/generate,
// which holds the Gemini API key server-side and streams the response
// back in the same { response, done } NDJSON shape used before.
// No model selection needed — the model is fixed server-side (see api/generate.js).

export async function checkConnection() {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Reply with the single word: ok' }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || `Server returned ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function streamGenerate({ prompt, onChunk, onDone, onError }) {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server error: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.error) throw new Error(json.error);
          if (json.response) {
            fullText += json.response;
            onChunk(json.response, fullText);
          }
          if (json.done) { onDone(fullText); return; }
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) throw e; // real error, not a parse hiccup
        }
      }
    }
    onDone(fullText);
  } catch (err) {
    onError(err.message);
  }
}

export function extractHTML(text) {
  if (!text) return null;

  // 1. Full document (best case)
  const fullDoc = text.match(/<!DOCTYPE[\s\S]*?<\/html>/i) ||
                  text.match(/<html[\s\S]*?<\/html>/i);
  if (fullDoc) return fullDoc[0];

  // 2. Wrapped in markdown code fences
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const inner = fenced[1].trim();
    if (inner.length > 100) return inner;
  }

  // 3. Partial document — has at least <head> or <body> opening tag
  const partial = text.match(/<(?:head|body)[\s\S]*/i);
  if (partial && partial[0].length > 200) return text;

  // 4. Has enough HTML structure to be usable (streaming in progress)
  const hasStructure = text.includes('<div') || text.includes('<section') ||
                       text.includes('<header') || text.includes('<main') ||
                       text.includes('<article');
  if (hasStructure && text.length > 300) return text;

  // 5. Starts with DOCTYPE even without closing tag (still streaming)
  if (/^\s*<!DOCTYPE/i.test(text) && text.length > 200) return text;

  return null;
}

export function extractSVG(text) {
  const match = text.match(/<svg[\s\S]*?<\/svg>/i);
  return match ? match[0] : null;
}

// ════════════════════════════════════════════════════════════════
// DESIGN DNA SYSTEM
// Every project gets a deterministic-but-unique visual identity so
// the LLM has a specific point of view to execute instead of
// defaulting to the same generic "hero + 3 cards" template.
// ════════════════════════════════════════════════════════════════

const FONT_PAIRINGS = [
  { heading: "'Fraunces', serif", body: "'Inter', sans-serif", mood: 'editorial, literary, warm' },
  { heading: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif", mood: 'technical, precise, modern' },
  { heading: "'Playfair Display', serif", body: "'Karla', sans-serif", mood: 'luxury, refined, high-contrast' },
  { heading: "'Bricolage Grotesque', sans-serif", body: "'Inter', sans-serif", mood: 'quirky, contemporary, expressive' },
  { heading: "'Instrument Serif', serif", body: "'Inter', sans-serif", mood: 'elegant, art-gallery, minimal' },
  { heading: "'Archivo Black', sans-serif", body: "'Archivo', sans-serif", mood: 'bold, brutalist, confident' },
  { heading: "'Cormorant Garamond', serif", body: "'Work Sans', sans-serif", mood: 'classic, sophisticated, calm' },
  { heading: "'Syne', sans-serif", body: "'Inter', sans-serif", mood: 'futuristic, sharp, startup' },
  { heading: "'DM Serif Display', serif", body: "'DM Sans', sans-serif", mood: 'friendly editorial, approachable' },
  { heading: "'Unbounded', sans-serif", body: "'Inter', sans-serif", mood: 'geometric, playful, energetic' },
];

const PALETTES = [
  { name: 'Midnight Forest', bg: '#0c1410', surface: '#162019', accent: '#7fff9e', accent2: '#d4f5c4', text: '#eef5ee' },
  { name: 'Warm Paper', bg: '#faf6f0', surface: '#ffffff', accent: '#c2410c', accent2: '#fed7aa', text: '#1c1410' },
  { name: 'Electric Violet', bg: '#0a0a18', surface: '#15152a', accent: '#a78bfa', accent2: '#f0abfc', text: '#f1f0fb' },
  { name: 'Clay & Cream', bg: '#f5f0e8', surface: '#fffdf9', accent: '#b5563c', accent2: '#8a9a5b', text: '#2b2420' },
  { name: 'Deep Ocean', bg: '#061a23', surface: '#0d2733', accent: '#4dd4e8', accent2: '#a6f0e0', text: '#e8f7fa' },
  { name: 'Sunset Coral', bg: '#1a0e0a', surface: '#291611', accent: '#ff6b4a', accent2: '#ffd166', text: '#fff5ed' },
  { name: 'Slate Mono', bg: '#fafafa', surface: '#ffffff', accent: '#18181b', accent2: '#71717a', text: '#18181b' },
  { name: 'Rose Quartz', bg: '#1c1117', surface: '#2a1822', accent: '#f472b6', accent2: '#fda4af', text: '#fdf2f8' },
  { name: 'Pine & Gold', bg: '#0f1a14', surface: '#18261d', accent: '#d4af37', accent2: '#8fbc8f', text: '#f0f4f0' },
  { name: 'Arctic Blue', bg: '#f0f7fb', surface: '#ffffff', accent: '#0369a1', accent2: '#7dd3fc', text: '#0c1e26' },
];

const LAYOUT_ARCHETYPES = [
  'Asymmetric split-screen hero with oversized typography bleeding off one edge, offset image grid',
  'Full-bleed editorial magazine layout with large pull quotes and a sticky side-nav',
  'Brutalist grid with visible borders, monospace accents, and stark black/white blocks broken by one accent color',
  'Layered card-stack hero where elements overlap with depth/shadow, scroll-driven parallax sections',
  'Minimal single-column narrative flow, generous whitespace, one bold statement per viewport',
  'Bento-grid layout — irregular sized boxes of varying sizes forming a mosaic, like a dashboard',
  'Diagonal/angled section dividers instead of straight horizontal lines, dynamic flow',
  'Centered spotlight hero with floating UI elements/badges orbiting around a central visual',
  'Horizontal scroll-snap sections for showcasing work/products like a gallery filmstrip',
  'Split-color background sections (color blocking) where each section has a distinct full-bleed background',
];

const MOTION_STYLES = [
  'Elements fade and slide up on scroll with staggered delays (50-100ms apart per item)',
  'Magnetic hover effect on buttons/cards — subtle scale + shadow lift on hover with spring easing',
  'Text reveals letter-by-letter or word-by-word on load for the hero headline',
  'Background gradient slowly animates/shifts hue over 10-20s for ambient motion',
  'Cards tilt slightly in 3D (perspective transform) on mouse proximity',
  'Numbers/stats count up from 0 when scrolled into view',
  'Underline or highlight draws itself across text on hover using clip-path animation',
  'Sections have a subtle parallax — background moves slower than foreground on scroll',
];

function seededIndex(seed, arrayLength) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % arrayLength;
}

// Derive a full design DNA from a project's unique id + name, so the
// same project stays visually consistent across pages/edits, but
// different projects look nothing alike.
export function deriveDesignDNA(seed) {
  const s = seed || Math.random().toString(36);
  const font = FONT_PAIRINGS[seededIndex(s + 'font', FONT_PAIRINGS.length)];
  const palette = PALETTES[seededIndex(s + 'palette', PALETTES.length)];
  const layout = LAYOUT_ARCHETYPES[seededIndex(s + 'layout', LAYOUT_ARCHETYPES.length)];
  const motionA = MOTION_STYLES[seededIndex(s + 'motionA', MOTION_STYLES.length)];
  const motionB = MOTION_STYLES[seededIndex(s + 'motionB' + s, MOTION_STYLES.length)];
  return { font, palette, layout, motion: [motionA, motionB].filter((v, i, a) => a.indexOf(v) === i) };
}

// A small, battle-tested CSS animation toolkit injected into every
// generated page so scroll-reveal / hover micro-interactions are
// reliable instead of left entirely to the model's CSS-writing skill.
const ANIMATION_TOOLKIT_CSS = `
<style id="__builder_motion_toolkit">
  *{scroll-behavior:smooth}
  .reveal{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
  .reveal.is-visible{opacity:1;transform:translateY(0)}
  .reveal-delay-1{transition-delay:.08s}
  .reveal-delay-2{transition-delay:.16s}
  .reveal-delay-3{transition-delay:.24s}
  .reveal-delay-4{transition-delay:.32s}
  .reveal-delay-5{transition-delay:.4s}
  .hover-lift{transition:transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s ease}
  .hover-lift:hover{transform:translateY(-6px)}
  .hover-scale{transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
  .hover-scale:hover{transform:scale(1.04)}
  .underline-draw{position:relative;text-decoration:none}
  .underline-draw::after{content:'';position:absolute;left:0;bottom:-2px;width:100%;height:2px;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .4s cubic-bezier(.16,1,.3,1)}
  .underline-draw:hover::after{transform:scaleX(1)}
  @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  .float{animation:floatY 5s ease-in-out infinite}
  @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  .gradient-animate{background-size:200% 200%;animation:gradientShift 12s ease infinite}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .fade-in-load{animation:fadeIn 1s ease both}
</style>
<script>
  document.addEventListener('DOMContentLoaded',function(){
    var els=document.querySelectorAll('.reveal');
    if('IntersectionObserver' in window && els.length){
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target);} });
      },{threshold:0.15, rootMargin:'0px 0px -40px 0px'});
      els.forEach(function(el){ io.observe(el); });
    } else { els.forEach(function(el){ el.classList.add('is-visible'); }); }

    var counters=document.querySelectorAll('[data-count-to]');
    if(counters.length && 'IntersectionObserver' in window){
      var co=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            var el=entry.target, target=parseFloat(el.getAttribute('data-count-to'))||0, dur=1200, start=null;
            function step(ts){ if(!start) start=ts; var p=Math.min((ts-start)/dur,1); el.textContent=Math.floor(p*target).toLocaleString(); if(p<1) requestAnimationFrame(step); else el.textContent=target.toLocaleString(); }
            requestAnimationFrame(step); co.unobserve(el);
          }
        });
      },{threshold:0.4});
      counters.forEach(function(el){ co.observe(el); });
    }
  });
</script>`;

export function injectAnimationToolkit(html) {
  if (!html) return html;
  if (html.includes('__builder_motion_toolkit')) return html; // already injected
  if (html.includes('</head>')) return html.replace('</head>', `${ANIMATION_TOOLKIT_CSS}</head>`);
  return ANIMATION_TOOLKIT_CSS + html;
}

// ── Core design brief shared by single-page and multi-page builders ──
function designBrief(dna) {
  return `DESIGN IDENTITY FOR THIS PROJECT (follow exactly — this is what makes the site unique, do not deviate to a generic template):

TYPOGRAPHY
- Heading font: ${dna.font.heading} (load from Google Fonts CDN)
- Body font: ${dna.font.body} (load from Google Fonts CDN)
- Overall typographic mood: ${dna.font.mood}
- Headlines should be large and confident (clamp(2.5rem, 6vw, 5rem) territory for the main hero headline), not timid default sizing

COLOR PALETTE — "${dna.palette.name}"
- Background: ${dna.palette.bg}
- Surface/card background: ${dna.palette.surface}
- Primary accent: ${dna.palette.accent}
- Secondary accent: ${dna.palette.accent2}
- Text: ${dna.palette.text}
- Use ONLY this palette plus white/black/transparent as needed. Do not introduce unrelated colors. Use the accent color sparingly and deliberately (buttons, highlights, underlines, icons) — not everywhere.

LAYOUT ARCHETYPE (this section's structural personality — commit to it)
${dna.layout}

MOTION & INTERACTION (required, not optional)
- ${dna.motion[0]}
- ${dna.motion[1] || dna.motion[0]}
- Add the class "reveal" (optionally "reveal-delay-1" through "reveal-delay-5" for staggering) to major sections/cards so they animate in on scroll — a motion toolkit handling this is already injected, just use the classes
- Add "hover-lift" or "hover-scale" classes to interactive cards/buttons
- Add "underline-draw" class to inline text links for an animated underline on hover
- For any stat/number counters, use a <span data-count-to="1234">0</span> pattern — it will auto-animate

ANTI-TEMPLATE RULES (critical)
- Do NOT build the generic "centered hero + 3 feature cards in a row + testimonial + footer" layout that every AI defaults to. Commit fully to the layout archetype above instead.
- Vary section widths and alignment — not everything centered and same-width
- Use unexpected but tasteful spacing, overlap, or asymmetry somewhere on the page
- Real, specific, plausible content for this business/topic — never "Lorem ipsum", never "Feature One/Two/Three", never "Company Name"
- At least one section should feel like a deliberate creative choice, not a safe default`;
}

export function buildWebsitePrompt(userPrompt, existingHTML = null, mode = 'create', dna = null) {
  const designDNA = dna || deriveDesignDNA(userPrompt);

  const baseInstructions = `You are an award-winning web designer/developer known for distinctive, animated, never-generic websites (think Awwwards/CSS Design Awards portfolio quality, not template-marketplace quality).

${designBrief(designDNA)}

TECHNICAL RULES
- Return ONLY the complete HTML code, nothing else — no explanation, no markdown fences
- Single HTML file: inline <style> for custom CSS, Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) for utility layout
- Load the Google Fonts specified above via <link> in <head>
- Include Font Awesome via CDN for icons (https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css)
- Fully responsive (mobile-first), test that the layout archetype above still works on small screens
- Production-ready, semantic HTML, proper meta tags + viewport + favicon
- Start with <!DOCTYPE html>`;

  if (mode === 'edit' && existingHTML) {
    return `${baseInstructions}

EXISTING WEBSITE CODE (preserve the established design identity — same fonts, palette, motion classes — unless the user explicitly asks to change the look):
${existingHTML}

USER MODIFICATION REQUEST:
${userPrompt}

Apply the requested changes. Return the complete modified HTML, keeping the reveal/hover-lift/underline-draw motion classes intact on existing elements and adding them to any new elements.`;
  }

  return `${baseInstructions}

USER REQUEST:
${userPrompt}

Generate the complete, uniquely-designed, animated website now:`;
}

// ── Multi-page prompt builder ──
export function buildPagePrompt({ userPrompt, pageName, siteContext, existingHTML = null, mode = 'create' }) {
  const pagesList = siteContext?.pages?.map(p => p.name).join(', ') || pageName;
  const dnaSeed = siteContext?.id || siteContext?.siteName || userPrompt;
  const designDNA = siteContext?.dna || deriveDesignDNA(dnaSeed);

  const baseInstructions = `You are a senior web developer. Your ONLY job is to output complete HTML code. You must NEVER explain, describe, ask questions, or write any text outside of HTML tags.

⚠️ CRITICAL OUTPUT RULE: Your entire response must be a single complete HTML document starting with <!DOCTYPE html> and ending with </html>. No words before it. No words after it. No markdown. No code fences. No explanations. If you write anything other than HTML you have failed.

SITE CONTEXT
- Site/business: ${siteContext?.siteName || 'Untitled site'}
- Description: ${siteContext?.description || userPrompt}
- All pages: ${pagesList}
- Generate the "${pageName}" page now using the design identity below.

${designBrief(designDNA)}

TECHNICAL REQUIREMENTS
- Navigation bar linking to all pages: ${pagesList}
- Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Google Fonts via CDN link tag in <head>
- Font Awesome icons via CDN
- Fully responsive, no placeholder text, no Lorem ipsum
- Real specific content for this business
- Start output with: <!DOCTYPE html>`;

  if (mode === 'edit' && existingHTML) {
    return `${baseInstructions}

EXISTING "${pageName}" PAGE CODE (preserve the established design identity unless explicitly asked to change it):
${existingHTML}

USER MODIFICATION REQUEST:
${userPrompt}

Apply the requested changes to this page only. Return the complete modified HTML, keeping motion classes (reveal, hover-lift, underline-draw) intact and adding them to new elements.`;
  }

  return `${baseInstructions}

USER REQUEST FOR THIS PAGE:
${userPrompt}

Generate the complete, uniquely-designed, animated "${pageName}" page now:`;
}

// ── Logo prompt builder ──
export function buildLogoPrompt(businessName, style, description) {
  return `You are an expert SVG logo designer. Create a clean, modern, professional SVG logo.

Business name: ${businessName}
Style: ${style}
Description/industry: ${description}

RULES:
- Return ONLY a single valid <svg>...</svg> element, nothing else, no markdown, no explanation
- viewBox="0 0 200 200"
- Use at most 2-3 colors, modern flat design, no gradients with more than 2 stops
- Should work as a small icon (favicon-sized) AND a large logo
- Make it abstract/geometric or a simple monogram of the business initials — NOT a photorealistic image
- No text longer than the initials/monogram (avoid full business name in the SVG, just initials or a symbol)

Generate the SVG logo now:`;
}
