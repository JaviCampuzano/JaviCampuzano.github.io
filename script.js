/* Portfolio Javier Campuzano */

const GITHUB_USERNAME = "JaviCampuzano";
const MAX_GITHUB_REPOS = 4;
const PROFILE_LANG = "portfolio_lang";
const GITHUB_CACHE_KEY = "portfolio_github_cache_v1";
const GITHUB_CACHE_TTL_MS = 1000 * 60 * 60;
const FEATURED_REPOS = [
  // Add repository names here in the exact order you want them displayed.
  // Example: "SmartSched", "DevCollab", "CryptoTrack-CLI"
];
const README_SECTION_TITLES = {
  summary: "Portfolio Summary",
  highlight: "Portfolio Highlight",
  technologies: "Key Technologies",
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const supportsFinePointer = window.matchMedia("(pointer:fine)").matches;

const cursor = document.getElementById("cursor");
const ring = document.getElementById("cursor-ring");
const menuToggle = document.getElementById("menu-toggle");
const navPanel = document.getElementById("nav-panel");
const sections = [...document.querySelectorAll("section[id]")];
const navLinks = [...document.querySelectorAll(".nav-links a")];
const projectOverrides = getProjectOverrides();
let cachedGitHubProjects = null;

let currentLanguage = localStorage.getItem(PROFILE_LANG) || "es";

function getCurrentLanguage() {
  return currentLanguage;
}

function getTranslationValue(lang, key) {
  return translations?.[lang]?.[key];
}

function getProjectOverrides() {
  const element = document.getElementById("project-overrides");
  if (!element) return {};

  try {
    return JSON.parse(element.textContent || "{}");
  } catch (error) {
    console.warn("Invalid project overrides JSON", error);
    return {};
  }
}

function setLanguage(lang) {
  if (!translations?.[lang]) return;

  currentLanguage = lang;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const value = getTranslationValue(lang, key);
    if (value) {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const key = element.getAttribute("data-i18n-html");
    const value = getTranslationValue(lang, key);
    if (value) {
      element.innerHTML = value;
    }
  });

  document.querySelectorAll(".lang-switch button").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === lang);
    button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
  });

  localStorage.setItem(PROFILE_LANG, lang);
}

function initLanguageSwitcher() {
  document.querySelectorAll(".lang-switch button").forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.lang);
      renderGitHubProjects();
    });
  });

  setLanguage(currentLanguage);
}

function initMobileMenu() {
  if (!menuToggle || !navPanel) return;

  const closeMenu = () => {
    navPanel.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = navPanel.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeMenu();
  });
}

function initCustomCursor() {
  if (!cursor || !ring || prefersReducedMotion.matches || !supportsFinePointer) return;

  document.body.classList.add("has-custom-cursor");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  const interactiveSelector = "a, button, .project-card, .skill-group, .stat-card, .ach-card";

  document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
  });

  const loop = () => {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);

  document.querySelectorAll(interactiveSelector).forEach((element) => {
    element.addEventListener("mouseenter", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(2.2)";
      ring.style.width = "52px";
      ring.style.height = "52px";
    });

    element.addEventListener("mouseleave", () => {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
      ring.style.width = "34px";
      ring.style.height = "34px";
    });
  });
}

function initRevealAnimations() {
  if (prefersReducedMotion.matches) {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
}

function initSkillBars() {
  const skillGroups = document.querySelectorAll(".skill-group");

  if (prefersReducedMotion.matches) {
    skillGroups.forEach((group) => {
      group.querySelectorAll(".skill-fill").forEach((bar) => {
        bar.style.width = `${bar.dataset.w}%`;
      });
    });
    return;
  }

  const barObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll(".skill-fill").forEach((bar) => {
          bar.style.width = `${bar.dataset.w}%`;
        });
        barObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  skillGroups.forEach((group) => barObserver.observe(group));
}

function initSectionHighlight() {
  const updateCurrentSection = () => {
    const offset = window.scrollY + 160;
    let currentId = sections[0]?.id || "";

    sections.forEach((section) => {
      if (offset >= section.offsetTop) {
        currentId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${currentId}`;
      link.classList.toggle("is-active", isActive);
    });
  };

  updateCurrentSection();
  window.addEventListener("scroll", updateCurrentSection, { passive: true });
}

function initBackground() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas || prefersReducedMotion.matches) return;

  const gl = canvas.getContext("webgl");
  if (!gl) return;

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const vertexShaderSource = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      vec2 mouse = u_mouse / u_res.xy;
      float t = u_time * 0.18;

      float gridX = smoothstep(0.96, 1.0, fract(uv.x * 14.0 + t));
      float gridY = smoothstep(0.96, 1.0, fract(uv.y * 14.0 - t));
      float grid = (gridX + gridY) * 0.05;

      float fog = noise(uv * 3.0 + vec2(t * 0.6, -t * 0.3)) * 0.08;
      float glow = 0.09 / (length(uv - mouse) * 10.0 + 0.7);

      vec3 color = vec3(0.03, 0.03, 0.03);
      color += vec3(grid);
      color += vec3(fog);
      color += vec3(glow * 0.45);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderSource));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
  gl.linkProgram(program);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const resolutionLocation = gl.getUniformLocation(program, "u_res");
  const timeLocation = gl.getUniformLocation(program, "u_time");
  const mouseLocation = gl.getUniformLocation(program, "u_mouse");

  let mouse = [window.innerWidth / 2, window.innerHeight / 2];
  document.addEventListener("mousemove", (event) => {
    mouse = [event.clientX, event.clientY];
  });

  const render = (time) => {
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, time * 0.001);
    gl.uniform2f(mouseLocation, mouse[0], mouse[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
}

function buildRepoDescription(repo, readmeData) {
  const lang = getCurrentLanguage();
  const fallback = getTranslationValue(lang, "js-github-no-desc") || "Sin descripción.";
  return readmeData.summary || repo.description || fallback;
}

function getPrimaryTechnology(repo, readmeData) {
  if (readmeData.primaryTechnology) return readmeData.primaryTechnology;
  if (repo.language) return repo.language;
  return readmeData.technologies?.[0] || "";
}

function buildRepoTopics(repo, readmeData) {
  const technologies = readmeData.technologies?.length ? readmeData.technologies : repo.topics || [];
  if (!technologies.length) return "";
  const primaryTechnology = getPrimaryTechnology(repo, readmeData);
  return technologies
    .map((topic) => {
      const isPrimary = primaryTechnology && topic.toLowerCase() === primaryTechnology.toLowerCase();
      const color = LANG_COLORS[topic] || LANG_COLORS[repo.language] || "#ffffff";
      return `<span class="tech-tag${isPrimary ? " tech-tag-primary" : ""}"${isPrimary ? ` style="--tag-accent:${color}"` : ""}>${topic}</span>`;
    })
    .join("");
}

function getStatusConfig(repo, releaseInfo, readmeData) {
  const lang = getCurrentLanguage();
  const override = projectOverrides[repo.name] || {};
  const readmeStatus = readmeData.meta.status;
  const status = override.status || readmeStatus || (releaseInfo.hasRelease ? "completed" : "in-progress");

  const statusMap = {
    "in-progress": {
      className: "status-active",
      label: lang === "en" ? "In progress" : "En progreso",
    },
    completed: {
      className: "status-completed",
      label: lang === "en" ? "Completed" : "Completado",
    },
    production: {
      className: "status-production",
      label: lang === "en" ? "Production" : "En produccion",
    },
  };

  const baseStatus = statusMap[status] || statusMap["in-progress"];
  return {
    className: baseStatus.className,
    label: (lang === "en" ? override.statusLabelEn : override.statusLabelEs) || baseStatus.label,
  };
}

function buildRepoCard(repo, readmeData, releaseInfo) {
  const langColor = LANG_COLORS[repo.language] || "#888";
  const status = getStatusConfig(repo, releaseInfo, readmeData);
  const card = document.createElement("a");
  card.href = repo.html_url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.className = "project-card reveal visible";

  card.innerHTML = `
    <span class="project-status ${status.className}">${status.label}</span>
    <h3 class="project-title">${repo.name}</h3>
    <p class="project-desc">${buildRepoDescription(repo, readmeData)}</p>
    ${readmeData.highlight ? `<p class="project-proof">${readmeData.highlight}</p>` : ""}
    <div class="project-meta">
      ${repo.language ? `<span class="project-meta-item"><span class="project-lang-dot" style="background:${langColor}"></span>${repo.language}</span>` : ""}
      <span class="project-meta-item">★ ${repo.stargazers_count}</span>
      <span class="project-meta-item">↗ ${new Date(repo.updated_at).getFullYear()}</span>
      ${releaseInfo.latestTag ? `<span class="project-meta-item">${releaseInfo.latestTag}</span>` : ""}
    </div>
    <div class="project-tech">${buildRepoTopics(repo, readmeData)}</div>
  `;

  return card;
}

function renderGitHubProjects() {
  const grid = document.getElementById("github-projects");
  if (!grid) return;

  const lang = getCurrentLanguage();

  if (!cachedGitHubProjects?.length) {
    grid.innerHTML = `<div class="github-loading">${getTranslationValue(lang, "js-github-not-found")}</div>`;
    return;
  }

  grid.innerHTML = "";
  cachedGitHubProjects.forEach(({ repo, readmeData, releaseInfo }) => {
    grid.appendChild(buildRepoCard(repo, readmeData, releaseInfo));
  });
}

const LANG_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Rust: "#dea584",
  Go: "#00ADD8",
  Kotlin: "#A97BFF",
};

function scoreRepo(repo) {
  const signals = [
    repo.stargazers_count * 10,
    repo.description ? 8 : 0,
    repo.homepage ? 6 : 0,
    repo.topics?.length ? 4 : 0,
    repo.language ? 3 : 0,
  ];

  return signals.reduce((sum, value) => sum + value, 0);
}

function getFeaturedRepos(repos) {
  if (!FEATURED_REPOS.length) return null;

  const byName = new Map(repos.map((repo) => [repo.name.toLowerCase(), repo]));
  return FEATURED_REPOS.map((name) => byName.get(name.toLowerCase())).filter(Boolean);
}

function normalizeRepoOverride(name) {
  return projectOverrides[name] || projectOverrides[name.toLowerCase()] || {};
}

function extractSection(markdown, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i");
  const match = markdown.match(regex);
  return match ? match[1].trim() : "";
}

function stripMarkdown(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_>#-]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMetaBlock(markdown) {
  const match = markdown.match(/<!--\s*PORTFOLIO([\s\S]*?)-->/i);
  if (!match) return {};

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc, line) => {
      const [rawKey, ...rest] = line.split(":");
      if (!rawKey || !rest.length) return acc;
      acc[rawKey.trim()] = rest.join(":").trim();
      return acc;
    }, {});
}

function parseTechnologyList(section) {
  return section
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function parseReadme(markdown) {
  if (!markdown) {
    return { summary: "", highlight: "", technologies: [], meta: {}, primaryTechnology: "" };
  }

  const meta = parseMetaBlock(markdown);
  const summary = stripMarkdown(extractSection(markdown, README_SECTION_TITLES.summary));
  const highlight = stripMarkdown(extractSection(markdown, README_SECTION_TITLES.highlight));
  const sectionTechnologies = parseTechnologyList(extractSection(markdown, README_SECTION_TITLES.technologies));
  const metaTechnologies = meta.tech ? meta.tech.split(",").map((item) => item.trim()).filter(Boolean) : [];
  const primaryTechnology = meta.primaryTech || meta.primary || "";

  return {
    summary,
    highlight,
    technologies: sectionTechnologies.length ? sectionTechnologies : metaTechnologies,
    meta,
    primaryTechnology,
  };
}

async function fetchReadme(repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/readme`, {
      headers: { Accept: "application/vnd.github.raw+json" },
    });
    if (!response.ok) return { summary: "", highlight: "", technologies: [], meta: {} };
    const markdown = await response.text();
    return parseReadme(markdown);
  } catch (error) {
    return { summary: "", highlight: "", technologies: [], meta: {} };
  }
}

async function fetchReleaseInfo(repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/releases?per_page=1`);
    if (!response.ok) return { hasRelease: false, latestTag: "" };
    const releases = await response.json();
    return {
      hasRelease: releases.length > 0,
      latestTag: releases[0]?.tag_name || "",
    };
  } catch (error) {
    return { hasRelease: false, latestTag: "" };
  }
}

async function enrichRepo(repo) {
  const [readmeData, releaseInfo] = await Promise.all([fetchReadme(repo), fetchReleaseInfo(repo)]);
  return { repo, readmeData, releaseInfo };
}

function readGitHubCache() {
  try {
    const raw = localStorage.getItem(GITHUB_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.savedAt || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

function writeGitHubCache(items) {
  try {
    localStorage.setItem(
      GITHUB_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        items,
      })
    );
  } catch (error) {
    // Ignore storage failures.
  }
}

async function loadGitHubRepos() {
  const grid = document.getElementById("github-projects");
  if (!grid) return;

  const lang = getCurrentLanguage();
  const storedCache = readGitHubCache();
  const hasValidCache = storedCache?.items?.length;
  const isFreshCache = hasValidCache && Date.now() - storedCache.savedAt < GITHUB_CACHE_TTL_MS;

  if (hasValidCache) {
    cachedGitHubProjects = storedCache.items;
    renderGitHubProjects();
    if (isFreshCache) return;
  }

  if (!hasValidCache) {
    grid.innerHTML = `<div class="github-loading">${getTranslationValue(lang, "js-github-loading")}</div>`;
  }

  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100&type=owner`);
    if (!response.ok) throw new Error("GitHub API error");

    const repos = await response.json();
    const cleanRepos = repos.filter((repo) => !repo.archived && repo.name.toLowerCase() !== GITHUB_USERNAME.toLowerCase());
    const featuredRepos = getFeaturedRepos(cleanRepos);
    const curatedRepos = (featuredRepos && featuredRepos.length ? featuredRepos : cleanRepos
      .sort((a, b) => scoreRepo(b) - scoreRepo(a) || new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, MAX_GITHUB_REPOS));

    grid.innerHTML = "";

    if (!curatedRepos.length) {
      grid.innerHTML = `<div class="github-loading">${getTranslationValue(lang, "js-github-not-found")}</div>`;
      return;
    }

    const enrichedRepos = await Promise.all(curatedRepos.map((repo) => enrichRepo(repo)));
    cachedGitHubProjects = enrichedRepos;
    writeGitHubCache(enrichedRepos);
    renderGitHubProjects();
  } catch (error) {
    const fallbackCache = readGitHubCache();
    if (fallbackCache?.items?.length) {
      cachedGitHubProjects = fallbackCache.items;
      renderGitHubProjects();
      return;
    }

    grid.innerHTML = `<div class="github-loading">${getTranslationValue(lang, "js-github-error")}</div>`;
    console.error("Error loading repositories", error);
  }
}

function init() {
  initLanguageSwitcher();
  initMobileMenu();
  initCustomCursor();
  initRevealAnimations();
  initSkillBars();
  initSectionHighlight();
  initBackground();
  loadGitHubRepos();
}

document.addEventListener("DOMContentLoaded", init);
