/* ═══════════════════════════════════════
   SCRIPT.JS — Portfolio Alejandro García
   ═══════════════════════════════════════ */

/* ─────────────────────────────
   CONFIG — Change your GitHub username here
   ───────────────────────────── */
const GITHUB_USERNAME = 'JaviCampuzano'; // ← Tu usuario de GitHub

/* ── Language Switcher ── */
function setLanguage(lang) {
  if (!translations || !translations[lang]) return;

  // Update HTML lang attribute
  document.documentElement.lang = lang;

  // Update text
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });

  // Update Buttons
  document.getElementById('btn-es').classList.toggle('active', lang === 'es');
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');

  // Save preference
  localStorage.setItem('portfolio_lang', lang);
}

// Initialize Language
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('portfolio_lang') || 'es';
  setLanguage(savedLang);
});

/* ── Custom Cursor ── */
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cursor.style.left = mx+'px'; cursor.style.top = my+'px'; });
function animRing() {
  rx += (mx - rx) * .12;
  ry += (my - ry) * .12;
  ring.style.left = rx+'px'; ring.style.top = ry+'px';
  requestAnimationFrame(animRing);
}
animRing();
document.querySelectorAll('a,button,.project-card,.stat-card,.ach-card,.skill-group').forEach(el => {
  el.addEventListener('mouseenter', () => { cursor.style.transform='translate(-50%,-50%) scale(2.5)'; ring.style.width='56px'; ring.style.height='56px'; });
  el.addEventListener('mouseleave', () => { cursor.style.transform='translate(-50%,-50%) scale(1)'; ring.style.width='36px'; ring.style.height='36px'; });
});

/* ── 3D Background Canvas (WebGL shader) ── */
const canvas = document.getElementById('bg-canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; if(gl) gl.viewport(0,0,canvas.width,canvas.height); }
window.addEventListener('resize', resize); resize();

if (gl) {
  const vs = `
    attribute vec2 a_pos;
    void main(){ gl_Position = vec4(a_pos,0,1); }
  `;
  const fs = `
    precision mediump float;
    uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;
    #define PI 3.14159265
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);
      vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
    }
    void main(){
      vec2 uv = gl_FragCoord.xy/u_res;
      uv.y = 1.0 - uv.y;
      vec2 m = u_mouse/u_res;
      float t = u_time * 0.3;

      /* Grid lines */
      vec2 grid = fract(uv * 18.0 + t*0.05);
      float gx = smoothstep(0.96,1.0,grid.x) + smoothstep(0.0,0.04,grid.x);
      float gy = smoothstep(0.96,1.0,grid.y) + smoothstep(0.0,0.04,grid.y);
      float lines = max(gx,gy) * 0.07;

      /* Flowing noise */
      float n1 = noise(uv*3.0 + vec2(t*0.4, t*0.2));
      float n2 = noise(uv*6.0 - vec2(t*0.3, t*0.5));
      float n = n1*0.6 + n2*0.4;

      /* Mouse glow */
      float d = length(uv - m);
      float glow = 0.18 / (d * 8.0 + 0.5);

      /* Digital rain — matrix-style falling columns */
      float rain = 0.0;
      for(int i = 0; i < 3; i++){
        float fi = float(i);
        float scale = 20.0 + fi * 12.0;
        vec2 rc = floor(uv * vec2(scale, 1.0));
        float speed = 0.3 + hash(rc + fi * 100.0) * 0.5;
        float phase = hash(rc + fi * 200.0);
        float colY = fract(uv.y * scale * 0.15 - t * speed + phase);
        float trail = smoothstep(0.0, 0.6, colY) * smoothstep(1.0, 0.7, colY);
        float colMask = step(0.92, hash(rc + fi * 50.0));
        rain += trail * colMask * 0.08;
      }

      vec3 base = vec3(0.02,0.02,0.02);
      vec3 gridCol = vec3(0.18,0.18,0.18);
      vec3 noiseCol = vec3(0.12,0.12,0.12);
      vec3 glowCol = vec3(0.9,0.9,0.9);

      vec3 col = base;
      col += lines * gridCol;
      col += n * 0.035 * noiseCol;
      col += glow * glowCol * 0.18;
      col += rain * vec3(0.5, 0.8, 0.5);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function mkShader(src, type) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, mkShader(vs, gl.VERTEX_SHADER));
  gl.attachShader(prog, mkShader(fs, gl.FRAGMENT_SHADER));
  gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog,'a_pos');
  gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,0,0);

  const uRes = gl.getUniformLocation(prog,'u_res');
  const uTime = gl.getUniformLocation(prog,'u_time');
  const uMouse = gl.getUniformLocation(prog,'u_mouse');
  let mouse = [window.innerWidth/2, window.innerHeight/2];
  document.addEventListener('mousemove', e => { mouse = [e.clientX, e.clientY]; });

  function draw(t) {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t*0.001);
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

/* ───────────────────────────────────────
   Chrome T-Rex Dinos running in background
   ─────────────────────────────────────── */
(function initDinos() {
  const dinoContainer = document.createElement('div');
  dinoContainer.id = 'dino-layer';
  dinoContainer.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;';
  document.body.insertBefore(dinoContainer, document.body.firstChild);

  // Accurate Chrome T-Rex pixel art as SVG path (the real offline dino!)
  const DINO_SVG = `<svg viewBox="0 0 88 94" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M22 0h44v2h-44zM18 2h52v2h-52zM16 4h56v2h-56zM14 6h58v2h-58zM14 8h58v2h-58zM14 10h58v2h-58zM14 12h58v2h-58zM16 14h56v2h-56zM18 16h38v2h-38zM18 18h8v2h16v-2h14v2h-14v2h-16v-2h-8zM18 20h24v2h-24zM14 22h24v2h-24zM10 24h28v2h-28zM8 26h32v2h4v-2h4v2h-4v2h-4v-2h-32zM6 28h34v2h-34zM4 30h34v2h-34zM2 32h34v2h-34zM0 34h34v2h-34zM0 36h30v2h-30zM0 38h26v2h-26zM2 40h22v2h-22zM4 42h18v2h-18zM6 44h14v2h-14zM8 46h12v2h-12z
M10 48h4v2h4v-2h4v2h-4v6h-2v-6h-2v6h-2v-6h2v-2h-4zM14 56h2v4h-2zM22 56h2v4h-2zM14 60h4v2h-4zM22 60h4v2h-4z"/>
  </svg>`;

  // Chrome-style cactus
  const CACTUS_SVG = `<svg viewBox="0 0 34 70" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M14 0h6v70h-6zM0 20h6v6h8v-6h6v6h-6v8h-8v-8h-6zM20 30h6v6h8v-6h-8v-8h8v8h6v6h-6v8h-8v-8h6v-6h-6z"/>
  </svg>`;

  const dinos = [];
  const NUM_DINOS = 6;

  // Add keyframe animation
  const dinoStyle = document.createElement('style');
  dinoStyle.textContent = `
    @keyframes dinoRun {
      0% { left: -80px; }
      100% { left: calc(100vw + 80px); }
    }
    @keyframes dinoRunReverse {
      0% { left: calc(100vw + 80px); }
      100% { left: -80px; }
    }
  `;
  document.head.appendChild(dinoStyle);

  for (let i = 0; i < NUM_DINOS; i++) {
    const dino = document.createElement('div');
    const size = 30 + Math.random() * 30;
    const yPos = 5 + Math.random() * 85; // Spread across the full screen
    const speed = 20 + Math.random() * 40; // seconds to cross screen
    const delay = Math.random() * speed;
    const opacity = 0.10 + Math.random() * 0.12;
    const goRight = Math.random() > 0.5;
    const animName = goRight ? 'dinoRun' : 'dinoRunReverse';
    const flip = goRight ? 'scaleX(-1)' : 'scaleX(1)';
    
    dino.innerHTML = DINO_SVG;
    dino.style.cssText = `
      position:absolute;
      bottom:${yPos}%;
      width:${size}px;
      height:auto;
      color:rgba(200,200,200,${opacity});
      animation:${animName} ${speed}s linear ${delay}s infinite;
      transform:${flip};
    `;
    
    dinoContainer.appendChild(dino);
    dinos.push(dino);
  }

  // Add cacti scattered across the background
  for (let i = 0; i < 5; i++) {
    const cactus = document.createElement('div');
    const size = 18 + Math.random() * 18;
    const xPos = 5 + Math.random() * 85;
    const yPos = 10 + Math.random() * 80;
    const opacity = 0.06 + Math.random() * 0.08;
    
    cactus.innerHTML = CACTUS_SVG;
    cactus.style.cssText = `
      position:absolute;
      bottom:${yPos}%;
      left:${xPos}%;
      width:${size}px;
      height:auto;
      color:rgba(200,200,200,${opacity});
      animation: cactusBob ${8 + Math.random() * 6}s ease-in-out infinite;
    `;
    dinoContainer.appendChild(cactus);
  }

  const cactusStyle = document.createElement('style');
  cactusStyle.textContent = `
    @keyframes cactusBob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  `;
  document.head.appendChild(cactusStyle);
})();

/* ── Scroll reveal ── */
const observer = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 60);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ── Skill bars ── */
const barObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.skill-fill').forEach(bar => {
        bar.style.width = bar.dataset.w + '%';
      });
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.skill-group').forEach(g => barObs.observe(g));

/* ── 3D tilt on cards ── */
document.querySelectorAll('.tilt').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x*15}deg) rotateX(${-y*15}deg) translateZ(25px) translateY(-8px)`;
    card.style.boxShadow = `${-x*30}px ${y*30}px 40px rgba(0,0,0,.4)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) translateZ(0) translateY(0)';
    card.style.boxShadow = 'none';
  });
});

/* ── 3D Parallax on scroll ── */
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const hero = document.getElementById('hero');
      if (hero) {
        const heroName = hero.querySelector('.hero-name');
        const heroRole = hero.querySelector('.hero-role');
        const heroDesc = hero.querySelector('.hero-desc');
        const heroTag = hero.querySelector('.hero-tag');
        if (heroName) heroName.style.transform = `translateY(${scrollY * 0.15}px)`;
        if (heroRole) heroRole.style.transform = `translateY(${scrollY * 0.08}px)`;
        if (heroDesc) heroDesc.style.transform = `translateY(${scrollY * 0.05}px)`;
        if (heroTag) heroTag.style.transform = `translateY(${scrollY * 0.1}px)`;
      }
      ticking = false;
    });
    ticking = true;
  }
});

/* ── 3D tilt on achievement and skill cards ── */
document.querySelectorAll('.ach-card, .skill-group').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x*10}deg) rotateX(${-y*10}deg) translateZ(15px) translateY(-6px)`;
    card.style.boxShadow = `${-x*20}px ${y*20}px 30px rgba(0,0,0,.3)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.boxShadow = '';
  });
});

/* ── Active nav link ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if(window.scrollY >= s.offsetTop - 200) current = s.id; });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === '#'+current ? 'var(--accent)' : '';
  });
});

/* ───────────────────────────────────────
   GitHub Repos — Fetch & Render
   ─────────────────────────────────────── */
// Language colors (GitHub style)
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', HTML: '#e34c26',
  CSS: '#563d7c', Shell: '#89e051', Rust: '#dea584', Go: '#00ADD8',
  Kotlin: '#A97BFF', Swift: '#F05138', Ruby: '#701516', PHP: '#4F5D95',
  Vue: '#41b883', Dart: '#00B4AB', Haskell: '#5e5086', Lua: '#000080',
  Scala: '#c22d40', R: '#198CE7',
};

async function loadGitHubRepos() {
  const grid = document.getElementById('github-projects');
  if (!grid) return;

  grid.innerHTML = '<div class="github-loading" data-i18n="js-github-load">Cargando repositorios de GitHub...</div>';

  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100&type=owner`);
    if (!res.ok) throw new Error('GitHub API error');
    const repos = await res.json();

    // Filter out forks and sort by stars then recent update
    const filtered = repos
      .filter(r => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.updated_at) - new Date(a.updated_at));

    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="github-loading" data-i18n="js-github-not-found">No se encontraron repositorios públicos.</div>';
      return;
    }

    filtered.forEach(repo => {
      const langColor = LANG_COLORS[repo.language] || '#888';
      const card = document.createElement('a');
      card.href = repo.html_url;
      card.target = '_blank';
      card.rel = 'noopener';
      card.className = 'project-card reveal tilt';

      card.innerHTML = `
        <span class="project-status status-active">GitHub</span>
        <div class="project-title">${repo.name}</div>
        <div class="project-desc">${repo.description || '<span data-i18n="js-github-no-desc">Sin descripción.</span>'}</div>
        <div class="project-meta">
          ${repo.language ? `<span class="project-meta-item"><span class="project-lang-dot" style="background:${langColor}"></span>${repo.language}</span>` : ''}
          <span class="project-meta-item">⭐ ${repo.stargazers_count}</span>
          <span class="project-meta-item">🍴 ${repo.forks_count}</span>
        </div>
        <div class="project-tech">
          ${repo.topics ? repo.topics.map(t => `<span class="tech-tag">${t}</span>`).join('') : ''}
        </div>
      `;

      grid.appendChild(card);
    });

    // Re-apply observers and tilt to new cards
    grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    grid.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x*15}deg) rotateX(${-y*15}deg) translateZ(25px) translateY(-8px)`;
        card.style.boxShadow = `${-x*30}px ${y*30}px 40px rgba(0,0,0,.4)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) translateZ(0) translateY(0)';
        card.style.boxShadow = 'none';
      });
      // Cursor effect
      card.addEventListener('mouseenter', () => { cursor.style.transform='translate(-50%,-50%) scale(2.5)'; ring.style.width='56px'; ring.style.height='56px'; });
      card.addEventListener('mouseleave', () => { cursor.style.transform='translate(-50%,-50%) scale(1)'; ring.style.width='36px'; ring.style.height='36px'; });
    });

    // Translate dynamic content
    setLanguage(document.documentElement.lang || localStorage.getItem('portfolio_lang') || 'es');

  } catch (err) {
    console.error('Error loading GitHub repos:', err);
    grid.innerHTML = '<div class="github-loading" data-i18n="js-github-error">Error al cargar repositorios. Los proyectos manuales se muestran arriba.</div>';
    setLanguage(document.documentElement.lang || localStorage.getItem('portfolio_lang') || 'es');
  }
}

// Load GitHub repos on page load
loadGitHubRepos();
