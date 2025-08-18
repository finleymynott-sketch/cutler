/*
  Interactive World Map using D3 + GeoJSON (with names) via CDN.
  - Hover a country to see its name (tooltip + focus style)
  - Zoom and pan enabled
  - Responsive to container size
*/

// Minimal country name fallback if fetch fails
const FALLBACK_COUNTRY_NAME = "Country";

const state = {
  width: 0,
  height: 0,
  projection: null,
  path: null,
  svg: null,
  g: null,
  tooltip: null,
  zoom: null,
  countries: [],
  countryPaths: null,
  infoCardEl: null,
  searchEl: null,
  
  history: [],
  historyIndex: -1,
  data: { aliases:null, readiness:null, exposure:null, grid:null, safety:null, compute:null },
  currentLayer: 'none'
};

// Minimal name → ISO3 resolver for common cases
const NAME_TO_ISO3 = {
  'united states': 'USA', 'united states of america': 'USA', 'u.s.': 'USA', 'usa': 'USA',
  'united kingdom': 'GBR', 'uk': 'GBR', 'britain': 'GBR', 'great britain': 'GBR',
  'china': 'CHN', 'people\'s republic of china': 'CHN', 'prc': 'CHN',
  'south korea': 'KOR', 'republic of korea': 'KOR',
  'germany': 'DEU', 'france': 'FRA', 'italy': 'ITA', 'canada': 'CAN', 'japan': 'JPN',
  'india': 'IND', 'australia': 'AUS', 'brazil': 'BRA', 'mexico': 'MEX', 'argentina': 'ARG',
  'south africa': 'ZAF', 'russia': 'RUS', 'russian federation': 'RUS', 'indonesia': 'IDN',
  'turkey': 'TUR', 'saudi arabia': 'SAU',
  'cote d\'ivoire': 'CIV', 'côte d’ivoire': 'CIV', 'ivory coast': 'CIV',
};

function resolveISO3(feature) {
  // Prefer embedded codes if present
  const p = feature.properties || {};
  const iso = (p.ISO_A3 || p.iso_a3 || feature.id || '').toString().toUpperCase();
  if (iso.length === 3 && /^[A-Z]{3}$/.test(iso)) return iso;
  // Fallback to name + aliases
  const raw = (p.name || p.ADMIN || '').toString().trim();
  const key = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (NAME_TO_ISO3[key]) return NAME_TO_ISO3[key];
  if (state.data.aliases && state.data.aliases[raw]) return state.data.aliases[raw];
  return '';
}

// US states LOD constants removed

// Approximate US state populations (2020 Census) and capitals
// Source: US Census Bureau / Wikipedia (consolidated); values are rounded for display
const US_STATE_METADATA = {
  "Alabama": { capital: "Montgomery", population: 5024279 },
  "Alaska": { capital: "Juneau", population: 733391 },
  "Arizona": { capital: "Phoenix", population: 7151502 },
  "Arkansas": { capital: "Little Rock", population: 3011524 },
  "California": { capital: "Sacramento", population: 39538223 },
  "Colorado": { capital: "Denver", population: 5773714 },
  "Connecticut": { capital: "Hartford", population: 3605944 },
  "Delaware": { capital: "Dover", population: 989948 },
  "District of Columbia": { capital: "Washington", population: 689545 },
  "Florida": { capital: "Tallahassee", population: 21538187 },
  "Georgia": { capital: "Atlanta", population: 10711908 },
  "Hawaii": { capital: "Honolulu", population: 1455271 },
  "Idaho": { capital: "Boise", population: 1839106 },
  "Illinois": { capital: "Springfield", population: 12812508 },
  "Indiana": { capital: "Indianapolis", population: 6785528 },
  "Iowa": { capital: "Des Moines", population: 3190369 },
  "Kansas": { capital: "Topeka", population: 2937880 },
  "Kentucky": { capital: "Frankfort", population: 4505836 },
  "Louisiana": { capital: "Baton Rouge", population: 4657757 },
  "Maine": { capital: "Augusta", population: 1362359 },
  "Maryland": { capital: "Annapolis", population: 6177224 },
  "Massachusetts": { capital: "Boston", population: 7029917 },
  "Michigan": { capital: "Lansing", population: 10077331 },
  "Minnesota": { capital: "Saint Paul", population: 5706494 },
  "Mississippi": { capital: "Jackson", population: 2961279 },
  "Missouri": { capital: "Jefferson City", population: 6154913 },
  "Montana": { capital: "Helena", population: 1084225 },
  "Nebraska": { capital: "Lincoln", population: 1961504 },
  "Nevada": { capital: "Carson City", population: 3104614 },
  "New Hampshire": { capital: "Concord", population: 1377529 },
  "New Jersey": { capital: "Trenton", population: 9288994 },
  "New Mexico": { capital: "Santa Fe", population: 2117522 },
  "New York": { capital: "Albany", population: 20201249 },
  "North Carolina": { capital: "Raleigh", population: 10439388 },
  "North Dakota": { capital: "Bismarck", population: 779094 },
  "Ohio": { capital: "Columbus", population: 11799448 },
  "Oklahoma": { capital: "Oklahoma City", population: 3959353 },
  "Oregon": { capital: "Salem", population: 4237256 },
  "Pennsylvania": { capital: "Harrisburg", population: 13002700 },
  "Rhode Island": { capital: "Providence", population: 1097379 },
  "South Carolina": { capital: "Columbia", population: 5118425 },
  "South Dakota": { capital: "Pierre", population: 886667 },
  "Tennessee": { capital: "Nashville", population: 6910840 },
  "Texas": { capital: "Austin", population: 29145505 },
  "Utah": { capital: "Salt Lake City", population: 3271616 },
  "Vermont": { capital: "Montpelier", population: 643077 },
  "Virginia": { capital: "Richmond", population: 8631393 },
  "Washington": { capital: "Olympia", population: 7705281 },
  "West Virginia": { capital: "Charleston", population: 1793716 },
  "Wisconsin": { capital: "Madison", population: 5893718 },
  "Wyoming": { capital: "Cheyenne", population: 576851 }
};

function isUSAName(name) {
  if (!name) return false;
  const n = String(name).toLowerCase();
  return n === 'united states of america' || n === 'united states' || n === 'usa' || n === 'u.s.';
}

function computeUSPopulationFromStates() {
  try {
    return Object.values(US_STATE_METADATA).reduce((sum, meta) => sum + (Number(meta.population) || 0), 0);
  } catch {
    return null;
  }
}

// GeoJSON with country names in properties.name
const worldGeoJsonUrl = "https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/DATA/world.geojson";

// Helper to load JSON safely with timeout and graceful fallback
async function loadJson(url, { timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: "force-cache", signal: controller.signal });
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(t);
  }
}

function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

function createSvg(container) {
  const { clientWidth, clientHeight } = container;
  state.width = clientWidth;
  state.height = clientHeight;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("class", "world")
    .attr("viewBox", `0 0 ${state.width} ${state.height}`)
    .attr("role", "img")
    .attr("aria-label", "World map");

  const g = svg.append("g");

  state.svg = svg;
  state.g = g;
}

function setupProjection() {
  const scale = Math.min(state.width, state.height) / (2 * Math.PI) * 1.2;
  state.projection = d3
    .geoNaturalEarth1()
    .scale(scale)
    .translate([state.width / 2, state.height / 2]);
  state.path = d3.geoPath(state.projection);
}

function drawBaseLayers() {
  const graticule = d3.geoGraticule10();

  state.g
    .append("path")
    .attr("class", "sphere")
    .attr("d", state.path({ type: "Sphere" }));

  state.g
    .append("path")
    .attr("class", "graticule")
    .attr("d", state.path(graticule));
}

function setupZoom() {
  const minScale = 1; // fits world comfortably
  const maxScale = 18; // close inspection without artifacting
  state.zoom = d3
    .zoom()
    .scaleExtent([minScale, maxScale])
    .filter((event) => {
      // Cooperative wheel: only zoom if Ctrl/Cmd or touch pinch; allow dblclick filter separately
      if (event.type === 'wheel') return event.ctrlKey || event.metaKey;
      if (event.type === 'dblclick') return false; // disable dblclick zoom
      return !event.button && !event.shiftKey; // allow pan
    })
    .on("zoom", (event) => {
      if (state._raf) cancelAnimationFrame(state._raf);
      state._raf = requestAnimationFrame(() => {
        state.g.attr("transform", event.transform);
      });
    })
    .on('start', () => {
      document.querySelector('.map-root')?.classList.add('panning');
    })
    .on('end', () => {
      document.querySelector('.map-root')?.classList.remove('panning');
      // Record meaningful view state once per gesture end
      try { pushHistory(); } catch {}
    });
  // Set translate extent to a generous bound around the projected world box
  // Will update later after first render with actual bounds
  state.svg.call(state.zoom).on('dblclick.zoom', null);
}

// Level-of-detail controller: fade US states in when zoomed in
// updateLOD removed

function setupTooltip(container) {
  state.tooltip = document.getElementById("tooltip");
  function positionTooltip(x, y) {
    const pad = 8;
    const tw = state.tooltip.offsetWidth || 120;
    const th = state.tooltip.offsetHeight || 32;
    const rect = container.getBoundingClientRect();
    let left = x - rect.left;
    let top = y - rect.top;
    left = Math.max(pad, Math.min(left, rect.width - pad));
    top = Math.max(pad + th, Math.min(top, rect.height - pad));
    state.tooltip.style.left = `${left}px`;
    state.tooltip.style.top = `${top}px`;
  }
  return positionTooltip;
}

function countryTitle(feature, nameMap) {
  const id = feature.id;
  const iso = resolveISO3(feature);
  const endo = iso && state.data?.endonyms ? state.data.endonyms[iso] : '';
  const base = nameMap.get(id) || feature.properties?.name || FALLBACK_COUNTRY_NAME;
  const mode = localStorage.getItem('labelMode') || 'exonym';
  return mode === 'endonym' && endo ? endo : base;
}

async function drawMap() {
  const container = document.getElementById("map-root");
  if (!container) return;

  clearMap();
  createSvg(container);
  setupProjection();
  drawBaseLayers();
  setupZoom();
  const positionTooltip = setupTooltip(container);
  state.positionTooltip = positionTooltip;
  setupControls();
  // Load data stubs (non-blocking)
  Promise.all([
    fetch('data/aliases.json').then(r=>r.json()).catch(()=>null),
    fetch('data/aliases_ext.json').then(r=>r.json()).catch(()=>null),
    fetch('data/readiness.json').then(r=>r.json()).catch(()=>null),
    fetch('data/exposure.json').then(r=>r.json()).catch(()=>null),
    fetch('data/grid_headroom.json').then(r=>r.json()).catch(()=>null),
    fetch('data/safety_footprint.json').then(r=>r.json()).catch(()=>null),
    fetch('data/compute_sites.json').then(r=>r.json()).catch(()=>null),
    fetch('data/g20_meta.json').then(r=>r.json()).catch(()=>null),
    fetch('data/endonyms.json').then(r=>r.json()).catch(()=>null),
    fetch('data/iso2to3.json').then(r=>r.json()).catch(()=>null),
    // Prefer CSV if present at runtime; else JSON
    (async ()=>{
      try {
        const csvResp = await fetch('data/oxford_readiness_2024_long_iso3.csv', { cache: 'no-cache' });
        if (csvResp.ok) {
          const text = await csvResp.text();
          const rows = text.split(/\r?\n/).filter(Boolean);
          const header = rows.shift();
          const cols = header.split(',').map(s=>s.trim().toLowerCase());
          const idxIso = cols.indexOf('iso3');
          const idxMetric = cols.indexOf('metric');
          const idxValue = cols.indexOf('value');
          const ox = {};
          for (const line of rows){
            const parts = line.split(',');
            if (parts.length<3) continue;
            const iso = (parts[idxIso]||'').toUpperCase();
            const metric = (parts[idxMetric]||'').toLowerCase();
            const val = Number(parts[idxValue]);
            if (!iso || Number.isNaN(val)) continue;
            const key = metric.includes('technology')? 'technology_sector' : metric.includes('data')? 'data_infrastructure' : (metric.includes('overall')||metric.includes('oxford_readiness'))? 'overall' : metric;
            const rec = ox[iso] || (ox[iso] = { overall:null, government:null, technology_sector:null, data_infrastructure:null });
            rec[key] = val;
          }
          console.info('Oxford source: CSV');
          return ox;
        }
      } catch {}
      try { const j = await fetch('data/oxford_readiness_2024.json'); if (j.ok) { console.info('Oxford source: JSON'); return j.json(); } } catch {}
      return null;
    })()
  ]).then(([aliases, aliasesExt, readiness, exposure, grid, safety, compute, g20meta, endonyms, iso2to3, oxford])=>{
    // Aggregate compute sites to per-country MW totals for choropleth
    let computeMW = null;
    try {
      if (Array.isArray(compute)) {
        computeMW = {};
        for (const site of compute) {
          const iso = String(site.iso3 || '').toUpperCase();
          const mw = Number(site.mw);
          if (!iso || Number.isNaN(mw)) continue;
          computeMW[iso] = (computeMW[iso] || 0) + mw;
        }
      }
    } catch {}
    // Merge aliases with extension
    const mergedAliases = Object.assign({}, aliases||{}, aliasesExt||{});
    state.data = { aliases: mergedAliases, readiness, exposure, grid, safety, compute, computeMW, g20meta, endonyms, iso2to3, oxford };
    renderLayer('none');
  }).catch(()=>{});

  // Load world GeoJSON with names
  let geo;
  try {
    geo = await loadJson(worldGeoJsonUrl);
  } catch (e) {
    showError(e);
    return;
  }
  const countries = Array.isArray(geo.features) ? geo.features : [];
  state.countries = countries;
  populateSearchList(countries);

  // Draw countries
  const countryPaths = state.g
    .append("g")
    .attr('id', 'country-layer')
    .selectAll("path.country")
    .data(countries)
    .join("path")
    .attr("class", "country")
    .attr("d", state.path)
    .attr("tabindex", 0)
    .attr("role", "img")
    .attr("aria-label", (d) => d.properties?.name || FALLBACK_COUNTRY_NAME)
    .on("mousemove", function (event, d) {
      const name = d.properties?.name || FALLBACK_COUNTRY_NAME;
      // Throttle tooltip updates via rAF
      if (!state._tooltipRAF) {
        state._tooltipRAF = requestAnimationFrame(() => {
          state.tooltip.textContent = name;
          state.tooltip.dataset.show = "true";
          state.tooltip.setAttribute("aria-hidden", "false");
          positionTooltip(event.clientX, event.clientY);
          state._tooltipRAF = null;
        });
      }
    })
    .on("mouseleave", function () {
      state.tooltip.dataset.show = "false";
      state.tooltip.setAttribute("aria-hidden", "true");
    })
    // US state hover behavior removed
    .on("click", async function (event, d) {
      event.stopPropagation();
      const name = d.properties?.name || "";
      focusCountry(d);
      await showInfoCard(name, d);
    })
    .on("focus", function (event, d) {
      const name = d.properties?.name || FALLBACK_COUNTRY_NAME;
      d3.select(this).classed("focused", true);
      state.tooltip.textContent = name;
      state.tooltip.dataset.show = "true";
      state.tooltip.setAttribute("aria-hidden", "false");
    })
    .on("blur", function () {
      d3.select(this).classed("focused", false);
      state.tooltip.dataset.show = "false";
      state.tooltip.setAttribute("aria-hidden", "true");
    });
  state.countryPaths = countryPaths;

  // After initial draw, set translateExtent to keep map bounded
  const worldBounds = state.path.bounds({ type: 'Sphere' });
  const [[x0,y0],[x1,y1]] = worldBounds;
  const pad = 100; // padding to allow slight overpan
  state.svg.call(state.zoom.translateExtent([[x0 - pad, y0 - pad], [x1 + pad, y1 + pad]]));

  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    const { clientWidth, clientHeight } = container;
    if (clientWidth === state.width && clientHeight === state.height) return;
    state.width = clientWidth;
    state.height = clientHeight;
    state.svg.attr("viewBox", `0 0 ${state.width} ${state.height}`);
    setupProjection();
    state.g.selectAll("path").attr("d", state.path);
    // Recompute extent after resize
    const [[rx0,ry0],[rx1,ry1]] = state.path.bounds({ type: 'Sphere' });
    state.svg.call(state.zoom.translateExtent([[rx0 - 100, ry0 - 100], [rx1 + 100, ry1 + 100]]));
  });
  resizeObserver.observe(container);

  // Click outside to reset view
  state.svg.on("click", () => {
    resetView();
  });

  // Tooltip and focus clear on container leave and window blur
  const rootLeave = () => {
    state.tooltip.dataset.show = "false";
    state.tooltip.setAttribute("aria-hidden", "true");
  };
  container.addEventListener('mouseleave', rootLeave);
  window.addEventListener('blur', rootLeave);

  // US states prefetch removed
  pushHistory();
}

window.addEventListener("DOMContentLoaded", () => {
  setYear();
  setupRevealOnScroll();
  drawMap().catch((err) => {
    console.error(err);
    const tooltip = document.getElementById("tooltip");
    if (tooltip) {
      tooltip.textContent = "Map failed to load.";
      tooltip.dataset.show = "true";
    }
  });
});

// Controls and interactions
function setupControls() {
  const root = document.getElementById("map-root");
  state.infoCardEl = document.getElementById("info-card");
  state.searchEl = document.getElementById("country-search");
  const pillsEl = null; // removed view pills
  const saveBtn = null; // removed save button
  const exportSVG = document.getElementById('export-svg');
  const exportPNG = document.getElementById('export-png');
  const labelToggle = document.getElementById('label-toggle');
  const layerSelect = document.getElementById('layer-select');
  const oxfordMetric = document.getElementById('oxford-metric');
  const oxfordScale = document.getElementById('oxford-scale');
  const safetyToggle = document.getElementById('layer-safety');
  const computeToggle = document.getElementById('layer-compute');
  // Help/minimap removed in Stage 4

  const resetBtn = document.getElementById("reset-view");
  const themeBtn = document.getElementById("theme-toggle");
  const closeBtn = document.getElementById("info-close");

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetView();
      hideInfoCard();
    });
  }

  if (themeBtn) {
    const saved = localStorage.getItem("theme");
    if (saved === "light") document.body.classList.add("light");
    themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("light");
      const isLight = document.body.classList.contains("light");
      localStorage.setItem("theme", isLight ? "light" : "dark");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", hideInfoCard);
  }

  root?.addEventListener("click", () => {
    // If clicking on empty space (svg handler handles reset)
    hideInfoCard();
  });

  if (state.searchEl) {
    const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    state.searchEl.addEventListener("change", () => {
      const query = normalize(state.searchEl.value.trim());
      if (!query) return;
      const match = state.countries.find((c) => {
        const iso = resolveISO3(c);
        const endo = iso && state.data?.endonyms ? state.data.endonyms[iso] : '';
        const exo = c.properties?.name || '';
        const aliases = state.data.aliases || {};
        return normalize(exo) === query || (endo && normalize(endo) === query) || (aliases[exo] && normalize(exo) === query) || (Object.keys(aliases).some(a=>normalize(a)===query && aliases[a]===iso));
      });
      if (match) {
        focusCountry(match);
        showInfoCard(match.properties?.name);
      }
    });
  }

  // Keyboard controls on focused map
  const mapEl = root?.querySelector('svg.world');
  if (mapEl) {
    mapEl.setAttribute('tabindex', '0');
    mapEl.addEventListener('keydown', (e) => {
      const t = d3.zoomTransform(state.g.node());
      const step = 40 / (t.k || 1);
      const zoomStep = 1.2;
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          state.svg.transition().duration(120).call(state.zoom.scaleBy, zoomStep);
          break;
        case '-':
        case '_':
          e.preventDefault();
          state.svg.transition().duration(120).call(state.zoom.scaleBy, 1 / zoomStep);
          break;
        case 'ArrowUp':
          e.preventDefault();
          state.svg.transition().duration(120).call(state.zoom.translateBy, 0, step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          state.svg.transition().duration(120).call(state.zoom.translateBy, 0, -step);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          state.svg.transition().duration(120).call(state.zoom.translateBy, step, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          state.svg.transition().duration(120).call(state.zoom.translateBy, -step, 0);
          break;
        case 'Backspace':
          if (e.altKey || e.metaKey) { e.preventDefault(); goBack(); }
          break;
        case 'F':
          if (e.altKey || e.metaKey) { e.preventDefault(); goForward(); }
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          resetView();
          break;
        case 'Escape':
          e.preventDefault();
          mapEl.blur();
          break;
        case ' ': // Space select
        case 'Enter':
          // Optional: Treat as reset or noop
          break;
      }
    });
  }

  const retry = document.getElementById('retry');
  if (retry) retry.addEventListener('click', () => {
    hideError();
    resetView();
    drawMap().catch(showError);
  });

  // Remove saved views functionality

  // Export
  if (exportSVG) exportSVG.addEventListener('click', () => exportAsSVG());
  if (exportPNG) exportPNG.addEventListener('click', () => exportAsPNG());

  // Label toggle (exonym/endonym)
  if (labelToggle) labelToggle.addEventListener('click', () => {
    try {
      const mode = localStorage.getItem('labelMode') === 'endonym' ? 'exonym' : 'endonym';
      localStorage.setItem('labelMode', mode);
    } catch {}
  });

  if (layerSelect) layerSelect.addEventListener('change', (e)=>{ const v=e.target.value||'none';
    document.getElementById('oxford-metric')?.toggleAttribute('hidden', v!=='oxford');
    document.getElementById('oxford-scale')?.toggleAttribute('hidden', v!=='oxford');
    renderLayer(v);
  });
  if (oxfordMetric) oxfordMetric.addEventListener('change', ()=>{ if (state.currentLayer==='oxford') renderLayer('oxford'); });
  if (oxfordScale) oxfordScale.addEventListener('change', ()=>{ if (state.currentLayer==='oxford') renderLayer('oxford'); });
  if (safetyToggle) safetyToggle.addEventListener('change', ()=> renderSafety());
  if (computeToggle) computeToggle.addEventListener('change', ()=> renderCompute());
}

function resetView() {
  state.svg.transition().duration(500).ease(d3.easeCubicOut).call(state.zoom.transform, d3.zoomIdentity);
  pushHistory();
}

function populateSearchList(countries) {
  const datalist = document.getElementById("country-list");
  if (!datalist) return;
  datalist.innerHTML = "";
  const endonyms = state.data.endonyms || {};
  const aliases = state.data.aliases || {};
  const names = countries
    .map((c) => {
      const iso = resolveISO3(c);
      const endo = iso ? endonyms[iso] : '';
      return endo || c.properties?.name;
    })
    .filter(Boolean);
  const aliasNames = Object.keys(aliases);
  [...new Set([...names, ...aliasNames])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      datalist.appendChild(opt);
    });
}

function focusCountry(feature) {
  const [[x0, y0], [x1, y1]] = state.path.bounds(feature);
  const width = state.width;
  const height = state.height;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const x = (x0 + x1) / 2;
  const y = (y0 + y1) / 2;
  const scale = Math.min(10, 0.9 / Math.max(dx / width, dy / height));
  const translate = [width / 2 - scale * x, height / 2 - scale * y];

  state.svg
    .transition()
    .duration(900)
    .ease(d3.easeCubicOut)
    .call(state.zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
  pushHistory();
}

async function showInfoCard(countryName, feature = null) {
  if (!countryName || !state.infoCardEl) return;
  const card = state.infoCardEl;
  // Canonicalize to ISO-A3-friendly name; REST Countries handles common aliases.
  try {
    const resp = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`);
    const data = await resp.json();
    const c = Array.isArray(data) && data[0] ? data[0] : null;
    const flagPng = c?.flags?.png || c?.flags?.svg || "";
    const name = c?.name?.common || countryName;
    const capital = Array.isArray(c?.capital) ? c.capital.join(", ") : c?.capital || "—";
    const region = c?.region || "—";
    const subregion = c?.subregion || "";
    const isUS = isUSAName(countryName);
    let popNum = typeof c?.population === 'number' ? c.population : null;
    if ((popNum == null || Number.isNaN(popNum)) && isUS) {
      const agg = computeUSPopulationFromStates();
      if (typeof agg === 'number' && !Number.isNaN(agg)) popNum = agg;
    }
    const pop = typeof popNum === 'number' ? popNum.toLocaleString() : '—';
    const area = typeof c?.area === "number" ? Math.round(c.area).toLocaleString() : "—";

    card.querySelector("#info-flag").src = flagPng;
    card.querySelector("#info-flag").alt = `${name} flag`;
    card.querySelector("#info-name").textContent = name;
    // Use G20 metadata for region/capital when available
    const iso = feature ? resolveISO3(feature) : '';
    const meta = iso && state.data?.g20meta ? state.data.g20meta[iso] : null;
    const region2 = meta?.region || region;
    const capital2 = meta?.capital_primary || capital;
    card.querySelector("#info-region").textContent = region2 || 'Unavailable';
    const subRow = card.querySelector('#info-subregion-row');
    const subSpan = card.querySelector('#info-subregion');
    if (subregion) {
      subSpan.textContent = subregion;
      subRow.hidden = false;
    } else {
      subRow.hidden = true;
    }
    card.querySelector("#info-capital").textContent = capital2 || 'Unavailable';
    card.querySelector("#info-pop").textContent = pop || 'Unavailable';
    card.querySelector("#info-area").textContent = area || 'Unavailable';

    // Sites list for this country
    const sitesBlock = card.querySelector('#info-sites-block');
    const sitesList = card.querySelector('#info-sites-list');
    const computeRow = card.querySelector('#info-compute-total-row');
    const computeSpan = card.querySelector('#info-compute-total');
    // Oxford pillar values in info panel
    const oxfordRow = card.querySelector('#info-oxford-row');
    const oxOver = card.querySelector('#info-oxford-overall');
    const oxGov = card.querySelector('#info-oxford-gov');
    const oxTech = card.querySelector('#info-oxford-tech');
    const oxData = card.querySelector('#info-oxford-data');
    const isoForOxford = feature ? resolveISO3(feature) : '';
    const ox = isoForOxford && state.data?.oxford ? state.data.oxford[isoForOxford] : null;
    if (ox && (ox.overall!=null || ox.government!=null || ox.technology_sector!=null || ox.data_infrastructure!=null)) {
      const fmt = (v)=> v!=null ? `${Number(v).toFixed(0)}/100 (2024)` : 'n/a';
      if (oxOver) oxOver.textContent = fmt(ox.overall);
      if (oxGov) oxGov.textContent = fmt(ox.government);
      if (oxTech) oxTech.textContent = fmt(ox.technology_sector);
      if (oxData) oxData.textContent = fmt(ox.data_infrastructure);
      if (oxfordRow) oxfordRow.hidden = false;
    } else if (oxfordRow) {
      oxfordRow.hidden = true;
    }
  const isComputeLayer = state.currentLayer === 'compute';
  if (!isComputeLayer) {
    if (sitesBlock) sitesBlock.hidden = true;
    if (computeRow) computeRow.hidden = true;
  } else if (sitesBlock && sitesList) {
      sitesList.innerHTML = '';
      const isoFromFeature = feature ? resolveISO3(feature) : '';
      const iso = isoFromFeature || (state.data.aliases?.[countryName] ?? '').toString().toUpperCase();
      const sites = Array.isArray(state.data.compute) ? state.data.compute.filter(s => String(s.iso3).toUpperCase() === iso) : [];
      if (sites.length > 0) {
        // Total MW summary
        const totalMW = sites.reduce((sum, s) => sum + (Number(s.mw) || 0), 0);
        if (computeRow && computeSpan) {
          computeSpan.textContent = `${totalMW.toLocaleString()} MW`;
          computeRow.hidden = false;
        }
        for (const s of sites) {
          const li = document.createElement('li');
          const status = s.status ? String(s.status) : '';
          const type = s.type ? ` · ${s.type}` : '';
          const mw = (typeof s.mw === 'number') ? `${s.mw.toLocaleString()} MW` : '';
          const line = document.createElement('div');
          line.textContent = `${s.site_name}${mw ? ' — ' + mw : ''}`;
          li.appendChild(line);
          const meta = document.createElement('div');
          meta.style.fontSize = '12px';
          meta.style.color = 'var(--muted)';
          const location = s.city ? String(s.city) : '';
          const operator = s.operator ? String(s.operator) : '';
          const parts = [];
          if (operator) parts.push(operator);
          if (location) parts.push(location);
          if (parts.length) { meta.textContent = parts.join(' · '); li.appendChild(meta); }
          if (status) { const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = status; li.appendChild(tag); }
          if (type) { const tag2 = document.createElement('span'); tag2.className = 'tag'; tag2.textContent = type.replace(' · ', ''); li.appendChild(tag2); }
          if (s.notes) li.title = String(s.notes);
          sitesList.appendChild(li);
        }
        sitesBlock.hidden = false;
      } else {
        sitesBlock.hidden = true;
        if (computeRow) computeRow.hidden = true;
      }
    }

    card.hidden = false;
  } catch (e) {
    console.warn("Failed fetching country details", e);
    card.querySelector("#info-flag").src = "";
    card.querySelector("#info-flag").alt = "";
    card.querySelector("#info-name").textContent = countryName;
    card.querySelector("#info-region").textContent = "Unavailable";
    card.querySelector("#info-capital").textContent = "Unavailable";
    const isUS = isUSAName(countryName);
    if (isUS) {
      const agg = computeUSPopulationFromStates();
      card.querySelector("#info-pop").textContent = (typeof agg === 'number' && !Number.isNaN(agg)) ? agg.toLocaleString() : "Unavailable";
    } else {
      card.querySelector("#info-pop").textContent = "Unavailable";
    }
    card.querySelector("#info-area").textContent = "Unavailable";
    const sitesBlock = card.querySelector('#info-sites-block');
    if (sitesBlock) sitesBlock.hidden = true;
    card.hidden = false;
  }
}

function hideInfoCard() {
  if (state.infoCardEl) state.infoCardEl.hidden = true;
}

function showError(e) {
  const overlay = document.getElementById('map-error');
  if (overlay) overlay.hidden = false;
  console.warn('Map data load error', e);
}

function hideError() {
  const overlay = document.getElementById('map-error');
  if (overlay) overlay.hidden = true;
}

function clearMap() {
  // Remove existing svg/layers to avoid duplicate listeners or memory growth
  const root = document.getElementById('map-root');
  if (!root) return;
  const svg = root.querySelector('svg.world');
  if (svg) svg.remove();
  state.svg = null;
  state.g = null;
  state.usLayer = null;
}

// Layers
function choroplethColor(values){
  const nums = values.map(Number).filter(v=>!Number.isNaN(v));
  const min = Math.min(...nums), max = Math.max(...nums);
  return (v)=>{
    if (v==null || Number.isNaN(Number(v))) return '#232833';
    const t = (Number(v)-min)/(max-min||1);
    const r = Math.round(40 + 80*t);
    const g = Math.round(60 + 90*t);
    const b = Math.round(140 + 80*t);
    return `rgb(${r},${g},${b})`;
  };
}
function renderLayer(name){
  state.currentLayer = name;
  if (!state._oxfordCache) state._oxfordCache = {};
  const legend = document.getElementById('legend');
  const legendKey = document.getElementById('legend-key');
  // Reset fills and layer-specific handlers
  state.g.selectAll('path.country')
    .style('fill', null)
    .on('mousemove.layer', null)
    .on('mouseleave.layer', null);
  if (name==='none'){
    // Remove overlays
    state.g.selectAll('g.safety').remove();
    state.g.selectAll('g.compute').remove();
    if (legend) legend.textContent='Layer: None';
    if (legendKey) legendKey.innerHTML = '';
    return;
  }
  let dataMap=null, label='';
  if (name==='readiness'){ dataMap=state.data.readiness; label='Readiness (0–100)'; }
  if (name==='exposure'){ dataMap=state.data.exposure; label='Exposure (0–100)'; }
  if (name==='grid'){ dataMap=state.data.grid; label='Grid headroom (%)'; }
  if (name==='compute'){ dataMap=state.data.computeMW; label='Compute capacity (MW)'; }
  if (name==='oxford'){
    const metricSel = document.getElementById('oxford-metric');
    const scaleSel = document.getElementById('oxford-scale');
    const metric = metricSel?.value || 'overall';
    const mode = (scaleSel?.value || localStorage.getItem('oxfordScale') || 'absolute');
    if (scaleSel && !scaleSel.value) scaleSel.value = mode;
    localStorage.setItem('oxfordScale', mode);
    label = 'AI Readiness (Oxford 2024)';
    const cacheKey = `${metric}:${mode}`;
    state._oxfordCache[cacheKey] = state._oxfordCache[cacheKey] || {};
    const cache = state._oxfordCache[cacheKey];
    if (!cache.dataMap) {
      const map = {};
      if (state.data.oxford) {
        for (const [iso, rec] of Object.entries(state.data.oxford)){
          const v = rec && rec[metric]; if (v!=null) map[iso]=v;
        }
      }
      cache.dataMap = map;
    }
    dataMap = cache.dataMap;
    // compute bin edges and palette per mode
    const values = Object.values(dataMap).map(Number).filter(v=>!Number.isNaN(v));
    let binEdges;
    if (mode==='absolute') {
      binEdges = [0,25,50,75,100];
    } else {
      const sorted = [...values].sort((a,b)=>a-b);
      const q = (p)=>{ const i = Math.floor(p*(sorted.length-1)); return sorted[Math.max(0, Math.min(sorted.length-1, i))]; };
      binEdges = [q(0), q(0.25), q(0.5), q(0.75), q(1)].map(x=>Math.round(x));
    }
    cache.binEdges = cache.binEdges || binEdges;
    // color-blind-safe sequential ramp (light->dark)
    const palette = ['#f7fbff','#deebf7','#9ecae1','#3182bd','#08519c'];
    cache.palette = cache.palette || palette;
    // expose to outer rendering via closures below
  }
  if (!dataMap){ if (legend) legend.textContent = `${name} loading…`; if (legendKey) legendKey.textContent = `${label}`; return; }
  const values = Object.values(dataMap).map(Number).filter(v=>!Number.isNaN(v));
  // Build bin edges and palette
  const sorted = [...values].sort((a,b)=>a-b);
  function q(p){ const i = Math.floor(p*(sorted.length-1)); return sorted[Math.max(0, Math.min(sorted.length-1, i))]; }
  const scaleSel = document.getElementById('oxford-scale');
  const oxMode = (scaleSel?.value || localStorage.getItem('oxfordScale') || 'absolute');
  const breaks = (name==='oxford') ? (state._oxfordCache && state._oxfordCache[`${(document.getElementById('oxford-metric')?.value||'overall')}:${oxMode}`]?.binEdges) || [0,25,50,75,100] : [q(0), q(0.25), q(0.5), q(0.75), q(1)];
  const palette = name==='grid'
    ? ['#7a1f1f','#a14a4a','#bba7a7','#6ea78a','#3c8f6a'] // show deficit to surplus
    : name==='oxford'
      ? (state._oxfordCache && state._oxfordCache[`${(document.getElementById('oxford-metric')?.value||'overall')}:${oxMode}`]?.palette) || ['#f7fbff','#deebf7','#9ecae1','#3182bd','#08519c']
      : ['#223357','#2f4d7a','#4d6fa0','#6e93c0','#9fbbe0'];
  function colorFor(v){ if (v<=breaks[0]) return palette[0]; if (v<=breaks[1]) return palette[1]; if (v<=breaks[2]) return palette[2]; if (v<=breaks[3]) return palette[3]; return palette[4]; }
  state.g.selectAll('path.country').style('fill', function(d){
    const iso = resolveISO3(d);
    const v = dataMap && iso ? Number(dataMap[iso]) : NaN;
    if (Number.isNaN(v)) return null;
    return colorFor(v);
  })
  .on('mousemove.layer', (event, d)=>{
    if (name==='none') return;
    const iso = resolveISO3(d);
    const v = dataMap && iso ? dataMap[iso] : null;
    if (v==null) return;
    const fmt = name==='grid'
      ? (x=>`${x>0?'+':''}${Number(x).toFixed(1)}%`)
      : name==='compute'
        ? (x=>`${Number(x).toLocaleString()} MW`)
        : name==='oxford'
          ? (x=>`${Number(x).toFixed(0)}/100 (2024, Oxford Insights)`) 
        : (x=>`${Number(x).toFixed(0)}`);
    const nm = d.properties?.name || iso;
    state.tooltip.textContent = `${nm}: ${fmt(v)}`;
    if (state.positionTooltip) state.positionTooltip(event.clientX, event.clientY);
    state.tooltip.dataset.show = 'true';
    state.tooltip.setAttribute('aria-hidden','false');
  })
  .on('mouseleave.layer', ()=>{
    state.tooltip.dataset.show = 'false';
    state.tooltip.setAttribute('aria-hidden','true');
  });
  // Legend UI (optional)
  if (legend) {
    legend.innerHTML = '';
    const title = document.createElement('div'); title.textContent = label; legend.appendChild(title);
    for (let i=0;i<palette.length;i++){
      const row = document.createElement('div'); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='6px';
      const sw = document.createElement('span'); sw.style.display='inline-block'; sw.style.width='14px'; sw.style.height='10px'; sw.style.background=palette[i]; sw.style.borderRadius='2px'; row.appendChild(sw);
      const lo = i===0? breaks[0] : breaks[i-1]; const hi = breaks[i];
      const fmt = name==='grid'? (x=>`${x>0?'+':''}${x.toFixed(1)}%`) : (x=>x.toFixed(0));
      const txt = document.createElement('span'); txt.textContent = `${fmt(lo)} – ${fmt(hi)}`; row.appendChild(txt);
      legend.appendChild(row);
    }
  }
  if (legendKey) {
    legendKey.innerHTML = '';
    const title = document.createElement('div'); title.className = 'title'; title.textContent = label; legendKey.appendChild(title);
    for (let i=0;i<palette.length;i++){
      const row = document.createElement('div'); row.className = 'row';
      const sw = document.createElement('span'); sw.className = 'swatch'; sw.style.background = palette[i]; row.appendChild(sw);
      const lo = i===0? breaks[0] : breaks[i-1]; const hi = breaks[i];
      const fmt = name==='grid'? (x=>`${x>0?'+':''}${x.toFixed(1)}%`) : name==='oxford'? (x=>`${Math.round(x)}%`) : (x=>x.toFixed(0));
      const txt = document.createElement('span'); txt.textContent = `${fmt(lo)} – ${fmt(hi)}`; row.appendChild(txt);
      legendKey.appendChild(row);
    }
  }
  // Respect current overlay toggles when switching layers
  if (document.getElementById('layer-safety')?.checked) renderSafety(); else state.g.selectAll('g.safety').remove();
  if (document.getElementById('layer-compute')?.checked) renderCompute(); else state.g.selectAll('g.compute').remove();
}
function renderSafety(){
  const on = document.getElementById('layer-safety')?.checked;
  state.g.selectAll('g.safety').remove();
  if (!on || !state.data.safety) return;
  const layer = state.g.append('g').attr('class','safety');
  for (const f of state.countries){
    const iso = String(f.id||'').toUpperCase(); const s = state.data.safety[iso]; if (!s || s==='none') continue;
    const p = state.path.centroid(f); const r = s==='L'? 5 : s==='M'? 3.5 : 2.5;
    layer.append('circle').attr('cx',p[0]).attr('cy',p[1]).attr('r',r).attr('fill','rgba(212,163,115,0.8)').attr('stroke','rgba(255,255,255,0.5)');
  }
}
function renderCompute(){
  const on = document.getElementById('layer-compute')?.checked;
  state.g.selectAll('g.compute').remove();
  if (!on || !state.data.compute) return;
  const layer = state.g.append('g').attr('class','compute');
  for (const site of state.data.compute){
    const f = state.countries.find(cf => String(cf.id).toUpperCase()===site.iso3);
    if (!f) continue; const p=state.path.centroid(f);
    const r = Math.max(2.5, Math.min(7, Math.log(1+site.mw)));
    const fill = site.status==='operational'? 'rgba(124,176,138,0.9)' : 'transparent';
    const stroke = site.status==='operational'? 'rgba(255,255,255,0.7)' : 'rgba(212,163,115,0.9)';
    const g = layer.append('g');
    g.append('circle').attr('cx',p[0]).attr('cy',p[1]).attr('r',r).attr('fill',fill).attr('stroke',stroke).attr('stroke-width',1.5);
    g.append('title').text(`${site.site_name} • ${site.mw} MW • ${site.status}`);
  }
}

// Export helpers (minimal viable)
function exportAsSVG() {
  const svg = document.querySelector('#map-root svg.world');
  if (!svg) return;
  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'atlas.svg'; a.click();
  URL.revokeObjectURL(url);
}
function exportAsPNG() {
  const svg = document.querySelector('#map-root svg.world');
  if (!svg) return;
  const xml = new XMLSerializer().serializeToString(svg);
  const bytes = new TextEncoder().encode(xml);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const svg64 = btoa(binary);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = svg.clientWidth; canvas.height = svg.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'atlas.png'; a.click(); URL.revokeObjectURL(url);
    });
  };
  img.src = 'data:image/svg+xml;base64,' + svg64;
}

// History management
function currentTransform() {
  const t = d3.zoomTransform(state.g?.node());
  return { x: t.x, y: t.y, k: t.k };
}
function applyTransform({ x, y, k }) {
  state.svg.transition().duration(300).ease(d3.easeCubicOut).call(state.zoom.transform, d3.zoomIdentity.translate(x, y).scale(k));
}
function pushHistory() {
  if (!state.svg || !state.g) return;
  const t = currentTransform();
  const last = state.history[state.historyIndex];
  if (last && Math.abs(last.x - t.x) < 1 && Math.abs(last.y - t.y) < 1 && Math.abs(last.k - t.k) < 0.01) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(t);
  state.historyIndex = state.history.length - 1;
}
function goBack() {
  if (state.historyIndex > 0) {
    state.historyIndex -= 1;
    applyTransform(state.history[state.historyIndex]);
  }
}
function goForward() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex += 1;
    applyTransform(state.history[state.historyIndex]);
  }
}

// Minimap removed in Stage 4

// Reveal on scroll
function setupRevealOnScroll() {
  const elements = Array.from(document.querySelectorAll('.reveal'));
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('revealed'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    }
  }, { root: null, threshold: 0.15 });
  elements.forEach(el => observer.observe(el));
}

// US state-level layer removed


