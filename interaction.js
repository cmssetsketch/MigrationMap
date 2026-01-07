const SHAPE_RATIO = 500; // 1 shape = 200 people
const MAX_ZOOM = 8;

function getVisibleWorldBounds(p) {
  const left   = (-panX) / zoom;
  const top    = (-panY) / zoom;
  const right  = (p.width - panX) / zoom;
  const bottom = (p.height - panY) / zoom;

  return { left, right, top, bottom };
}

function showData(b) {
  
  const popUp = document.getElementById("popUp");
  if (!popUp) return;
  popUp.style.display = "block";
  popUp.innerHTML = "";
  if (!b.dataMig2024) return;

// ── LIST LEGEND
const list = document.createElement("div");
list.className = "migration-list";

// 1. Sort everything first
// ── 1. Sort all destinations by value
const sortedEntries = Object.entries(b.dataMig2024 || {})
  .sort((a, b) => b[1] - a[1]);

// --- 2. Start with squares that actually exist
let squareEntries = sortedEntries.filter(([dest]) =>
  b.shapeSquares.some(sq => sq.destName === dest)
);

// --- 3. UI list fallback
let displayEntries;

// EverybodyMode logic
if (isEverybodyMode) {
  // Destinations that actually have migrant squares
  const migrantDestinations = new Set(
    b.shapeSquares
      .filter(sq => sq.destName !== b.originalName)
      .map(sq => sq.destName)
  );

  // Keep only destinations with squares
  const filtered = squareEntries.filter(([dest]) =>
    migrantDestinations.has(dest)
  );

  squareEntries = filtered; // used for drawing

  // Fallback: if nothing left, show first entry as text
  if (filtered.length === 0 && sortedEntries.length > 0) {
    displayEntries = [sortedEntries[0]]; // text-only entry
  } else {
    displayEntries = filtered;
  }
} else {
  // Not EverybodyMode → display what we have
  displayEntries = sortedEntries;;
}



// Build the rows
for (const [dest, value] of displayEntries) {
  const row = document.createElement("div");
  row.className = "migration-row";

  const shapeWrapper = document.createElement("div");
  shapeWrapper.className = "shape-wrapper";

  const shapeId = countryToShape[dest];
  const color = getColorForCountry(dest);
  const shape = createCountryShapeSVG(shapeId, color, 16);
  shapeWrapper.appendChild(shape);

  const textDiv = document.createElement("div");
  textDiv.className = "migration-text";
  textDiv.innerHTML = `
    <div class="migration-dest">${dest}</div>
    <div class="migration-value">${value.toLocaleString('fr-FR')}</div>
  `;

  row.appendChild(shapeWrapper);
  row.appendChild(textDiv);
  list.appendChild(row);
}

// Get the color for the country
const color = getColorForCountry(b.originalName);

// ── HEADER: shape + name + population
// Create header div
const header = document.createElement("div");
header.className = "popup-header";

const shape = createCountryShapeSVG(countryToShape[b.originalName], color, 24);
const topRow = document.createElement("div");
topRow.className = "popup-top-row";

topRow.appendChild(shape);

const namePop = document.createElement("div");
  const popValue = isEverybodyMode ? b.population2024 : b.migTotalRaw;
  const popLabel = isEverybodyMode ? "Population :" : "Migrants :";
  let millionsText = "";
if (popValue * 1000 >= 1000000) {
  const millions = popValue / 1000;
  millionsText = (millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)).replace('.', ',') + " million" + (millions > 1 ? "s" : "");
} else {
  millionsText = Math.round(popValue * 1000).toLocaleString('fr-FR');
}
namePop.className = "popup-name-pop";
namePop.innerHTML = `
<div class="popup-title" style="color:${color}">${b.originalName}</div>
<div class="popup-sub">${popLabel} ${millionsText}</div>
`;

topRow.appendChild(namePop);

// ── Row 2: migration info ONLY
const migInfo = document.createElement("div");
migInfo.className = "mig-info";

// Conditional content
migInfo.innerHTML = isEverybodyMode
  ?  `<span>Including ${b.migShare2024}% of migrants</span><br><span>mainly coming from :</span>`
  : `<div>Coming from :</div>`;

// Build and inject header
header.appendChild(topRow);
header.appendChild(migInfo);
popUp.prepend(header);
popUp.appendChild(list);

}


function createCountryShapeSVG(shapeId, color, size = 24) {
  const xml = shapeSVGs[shapeId];
  if (!xml) return null;

  const children = getSVGShapes(xml);
  if (!children.length) return null;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", "0 0 2 2");

  for (let node of children) {
    const type = node.getName();

    if (type === "polygon") {
      const el = document.createElementNS(svg.namespaceURI, "polygon");
      el.setAttribute("points", node.getString("points"));
      el.setAttribute("fill", color);
      svg.appendChild(el);

    } else if (type === "rect") {
      const el = document.createElementNS(svg.namespaceURI, "rect");
      el.setAttribute("x", node.getNum("x"));
      el.setAttribute("y", node.getNum("y"));
      el.setAttribute("width", node.getNum("width"));
      el.setAttribute("height", node.getNum("height"));
      el.setAttribute("fill", color);
      svg.appendChild(el);

    } else if (type === "path") {
      const el = document.createElementNS(svg.namespaceURI, "path");
      el.setAttribute("d", node.getString("d"));
      el.setAttribute("fill", color);
      svg.appendChild(el);
    }
  }

  return svg;
}


function drawSelect(p, selectedButton) {
  p.background(0);
  p.push();
  p.translate(panX, panY);
  p.scale(zoom);

  const BASE_CELL = 2;

// --------------------------------
  // Draw outlines for all countries
  buttons.forEach(b => {
    const color = getColorForCountry(b.originalName);
    b.shapes.forEach(s => drawShapeOutline(p, s, color));
  });

  if (!selectedButton) {
    p.pop();
    return;
  }

  // -----------------------
// Get squares of selected button
  const squares = selectedButton.visibleShapeSquares ?? selectedButton.shapeSquares ?? [];
  if (!squares.length) {
    p.pop();
    return;
  }

// -----------------------
  // Determine aggregation factor
  const aggFactor = zoom < 3 ? getAggregationFactor(zoom) : 1;
  const CELL_SIZE = BASE_CELL * aggFactor;

// -----------------------
  // Build aggregated cells if zoom < 3
  let cellsMap;
  if (aggFactor > 1) {
    cellsMap = new Map();
    const { minX, minY } = getButtonBounds(selectedButton);

    for (const sq of squares) {
      const cx = Math.floor((sq.x - minX) / CELL_SIZE);
      const cy = Math.floor((sq.y - minY) / CELL_SIZE);
      const key = `${cx},${cy}`;

      if (!cellsMap.has(key)) {
        cellsMap.set(key, {
          x: minX + cx * CELL_SIZE,
          y: minY + cy * CELL_SIZE,
          counts: new Map()
        });
      }

      const cell = cellsMap.get(key);
      const destKey = sq.shapeId + "|" + sq.color;
      cell.counts.set(destKey, (cell.counts.get(destKey) || 0) + 1);
    }
  }

  // -----------------------
  // Draw squares
  const drawCells = aggFactor > 1 ? Array.from(cellsMap.values()) : squares;

  drawCells.forEach(cell => {
    let cx, cy, counts;
    if (aggFactor > 1) {
      cx = cell.x;
      cy = cell.y;
      // pick the dominant square in the cell
      let bestKey = null, bestCount = 0;
      for (const [k, c] of cell.counts) {
        if (c > bestCount) {
          bestCount = c;
          bestKey = k;
        }
      }
      if (!bestKey) return;
      const [shapeId, color] = bestKey.split("|");
      counts = { shapeId, color };
    } else {
      cx = cell.x;
      cy = cell.y;
      counts = { shapeId: cell.shapeId, color: cell.color };
    }

    const xml = shapeSVGs[counts.shapeId];
    if (!xml) return;
    const children = getSVGShapes(xml);
    if (!children.length) return;

    p.push();
    p.translate(cx, cy);
    p.noStroke();
    p.fill(counts.color);

    const scaleFactor = CELL_SIZE / BASE_CELL;

    children.forEach(node => {
      const type = node.getName();
      if (type === "polygon") {
        const nums = node.getString("points").replace(/,/g, " ").trim().split(/\s+/).map(Number);
        p.beginShape();
        for (let i = 0; i < nums.length; i += 2) {
          p.vertex(nums[i] * scaleFactor, nums[i + 1] * scaleFactor);
        }
        p.endShape(p.CLOSE);
      } else if (type === "rect") {
        const x = parseFloat(node.getString("x")) || 0;
        const y = parseFloat(node.getString("y")) || 0;
        const w = parseFloat(node.getString("width")) || 0;
        const h = parseFloat(node.getString("height")) || 0;
        p.rect(x * scaleFactor, y * scaleFactor, w * scaleFactor, h * scaleFactor);
      } else if (type === "path") {
        const d = node.getString("d");
        if (!d) return;
        const path = new Path2D(d);
        const ctx = p.drawingContext;
        ctx.save();
        ctx.scale(scaleFactor, scaleFactor);
        ctx.fillStyle = counts.color;
        ctx.fill(path, "evenodd");
        ctx.restore();
      }
    });

    p.pop();
  });

  p.pop();
}



let zoomRedrawPending = false;

const everybodyBtn = document.getElementById("toggle-everybody");
const migrantBtn = document.getElementById("toggle-migrant");

function setMode(everybody) {
  isEverybodyMode = everybody;
  everybodyBtn.classList.toggle("active", everybody);
  migrantBtn.classList.toggle("active", !everybody);
}

const infoBtn = document.getElementById("info-btn");
const popInfo = document.getElementById("popInfo");

function togglePopInfo(forceOpen = false) {
  const isOpen = forceOpen || !popInfo.classList.contains("active");

  if (isOpen) {
    showPopInfo();
    popInfo.classList.add("active");
    infoBtn.classList.add("active");
  } else {
    popInfo.classList.remove("active");
    infoBtn.classList.remove("active");
  }
}

infoBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  togglePopInfo();
});

function setupInteractions(p) {
  const mapContainer = document.getElementById("map-container");
  
  const pointers = new Map();
  let lastPinchDist = null;
  let tapStart = null;

  function handleMapTap(e) {
  const rect = mapContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  let clickedCountry = false;

  buttons.forEach(b => {
    if (pointInsideButton(x, y, b)) {
      clickedCountry = true;
      selectedButton = b; // ✅ store current button
      showData(b);
      document.getElementById("popUp").style.display = "block";
    }
  });

  if (!clickedCountry) {
    selectedButton = null;
    document.getElementById("popUp").style.display = "none";
  }

  requestSafeRedraw(p);
}
  // ---------------- BUTTONS ----------------


everybodyBtn.addEventListener("click", () => {
  setMode(true);
  buttons.forEach(b => generateSquaresForButton(b));
  
  if (selectedButton) showData(selectedButton); // refresh popup for current button
  p.redraw();
});

migrantBtn.addEventListener("click", () => {
  setMode(false);
  buttons.forEach(b => generateSquaresForButton(b));
  
  if (selectedButton) showData(selectedButton); // refresh
  p.redraw();
});


// -------------------- ZOOM BUTTONS --------------------
document.getElementById("zoom-in").addEventListener("click", () => {
  applyZoom(p, 1.2, p.width / 2, p.height / 2);
});

document.getElementById("zoom-out").addEventListener("click", () => {
  applyZoom(p, 1 / 1.2, p.width / 2, p.height / 2);
});




 mapContainer.addEventListener(
    "wheel",
    e => {
      if (e.target.closest("#popUp") || e.target.closest("#popInfo")) return;
      e.preventDefault();

      const rect = mapContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const stepFactor = 1.2;
      const factor = e.deltaY < 0 ? stepFactor : 1 / stepFactor;

      applyZoomStep(p, factor, mouseX, mouseY);
    },
    { passive: false }
  );



  // ---------------- POINTER INTERACTIONS ----------------
  mapContainer.addEventListener("pointerdown", e => {
    if (e.target.closest("#popUp") || e.target.closest("#popInfo")) return;

    mapContainer.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, e);

    tapStart = { x: e.clientX, y: e.clientY, time: performance.now() };
  });

  mapContainer.addEventListener("pointermove", e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, e);

    const pts = Array.from(pointers.values());

    // 🟢 PAN (1 pointer)
    if (pts.length === 1) {
      panX += e.movementX;
      panY += e.movementY;
      requestSafeRedraw(p);
    }

    // 🔵 PINCH (2 pointers)
    if (pts.length === 2) {
      const [a, b] = pts;
      const rect = mapContainer.getBoundingClientRect();

      const ax = a.clientX - rect.left;
      const ay = a.clientY - rect.top;
      const bx = b.clientX - rect.left;
      const by = b.clientY - rect.top;

      const dist = Math.hypot(bx - ax, by - ay);

      if (lastPinchDist !== null) {
        const zoomIntensity = 0.002;
        const factor = Math.exp((dist - lastPinchDist) * zoomIntensity);
        const cx = (ax + bx) / 2;
        const cy = (ay + by) / 2;

        applyZoom(p, factor, cx, cy); // smooth pinch zoom
      }

      lastPinchDist = dist;
    }
  });

  mapContainer.addEventListener("pointerup", e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastPinchDist = null;

    // TAP detection
    if (tapStart) {
      const dx = e.clientX - tapStart.x;
      const dy = e.clientY - tapStart.y;
      const dt = performance.now() - tapStart.time;

      if (Math.hypot(dx, dy) < 6 && dt < 250) {
        handleMapTap(e); // step zoom + select
      }
    }

    tapStart = null;
  });

  mapContainer.addEventListener("pointercancel", () => {
    pointers.clear();
    lastPinchDist = null;
    tapStart = null;
  });
}

// ---------------- ZOOM FUNCTIONS ----------------
let zoomVelocity = 0;
let zoomAnchorX = 0;
let zoomAnchorY = 0;
const ZOOM_FRICTION = 0.85;
const ZOOM_SPEED = 0.002;

function applyZoomStep(p, factor, screenX, screenY) {
  if (!buttonsReady) return;

  const prevZoom = zoom;
  zoom *= factor;
  zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

  const wx = (screenX - panX) / prevZoom;
  const wy = (screenY - panY) / prevZoom;

  panX = screenX - wx * zoom;
  panY = screenY - wy * zoom;

  requestSafeRedraw(p);
}

function applyZoom(p, factor, screenX, screenY) {
  // Smooth pinch zoom
  zoomVelocity += Math.log(factor);
  zoomAnchorX = screenX;
  zoomAnchorY = screenY;
  p.loop();
}

function requestSafeRedraw(p) {
  if (zoomRedrawPending) return;
  zoomRedrawPending = true;
  requestAnimationFrame(() => {
    zoomRedrawPending = false;
    p.redraw();
  });
}

// -------------------- POPINFO CONTENT --------------------
function showPopInfo() {
  popInfo.innerHTML = `

  
  
<p>In this world, humans are particles,</br>
their shape and color tell us where they started.</p>

    
<span id="originCountry"></span><br>
<p>Together, particles compose patterns</br>
If a pattern forms inside a border,</strong> we call it a population.</strong></p>
   
    <div id="patternLines"></div>
<p>When a particle differs from it's neighbors,<strong><br> we call it a migrant.</strong> </p>
      
<div id="popCompass" class="popCompass"></div>
    
<p class="popup-note"
 <p>Based on the United Nations dataset <em>International Migrant Stock </em>(2024)</p>
</p>

    <div id="popContact" class="popContact"></div>

    <div class="info-icons">
      <a href="mailto:cmsset@gmail.com"><img src="mail.svg"></a>
      <a href="https://chloe-msset.com/art" target="_blank"><img src="web-Icon.svg"></a>
      <a href="https://www.instagram.com/chloemsset/" target="_blank"><img src="instagram-icon.svg"></a>
    </div>
  `;

  // -------------------- CONTACT IMAGE --------------------
  const contactContainer = document.getElementById("popContact");
  const img = document.createElement("img");
  img.src = "me-Icon-White.png";
  img.alt = "Contact Image";
  img.classList.add("contact-image");
  contactContainer.appendChild(img);

const compassContainer = document.getElementById("popCompass");
const imgC = document.createElement("img"); // <img> tag
imgC.src = "compas.png";                    // set source
imgC.alt = "Compass Image";                 // alt text
imgC.classList.add("compass-image");        // add class
compassContainer.appendChild(imgC);         // add to container

  // -------------------- ROTATING ORIGIN --------------------
  const originContainer = document.getElementById("originCountry");
  if (!originContainer || buttons.length === 0) return;

  function updateRandomCountry() {
    const b = buttons[Math.floor(Math.random() * buttons.length)];
    const shapeId = countryToShape[b.originalName];
    const color = getColorForCountry(b.originalName);

    originContainer.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
 
    const shape = createCountryShapeSVG(shapeId, color, 24);
    shape.style.pointerEvents = "none";
    shape.style.fill = color;

    const label = document.createElement("span");
    label.textContent = b.originalName;
    label.style.fontSize = "12px";
    label.style.color = color;

    wrapper.append(shape, label);
    originContainer.appendChild(wrapper);
  }

  updateRandomCountry();
  setInterval(updateRandomCountry, 2000);

  // -------------------- PATTERN LINES --------------------
  const patternContainer = document.getElementById("patternLines");
  patternContainer.style.display = "flex";
  patternContainer.style.flexDirection = "column";
  patternContainer.style.alignItems = "center";
  patternContainer.style.paddingTop = "10px";
patternContainer.style.paddingBottom = "20px";
  function createMiniShapeBlock(shapeId, color, size = 10) {
    const block = document.createElement("div");
    block.style.width = `${size}px`;
    block.style.height = `${size}px`;

    const shape = createCountryShapeSVG(shapeId, color, size);
    block.appendChild(shape);
    return block;
  }

  const mainButton = buttons[Math.floor(Math.random() * buttons.length)];
  const mainShapeId = countryToShape[mainButton.originalName];
  const mainColor = getColorForCountry(mainButton.originalName);

  for (let lineIndex = 0; lineIndex < 4; lineIndex++) {
    const line = document.createElement("div");
    line.style.display = "flex";

    for (let i = 0; i < 20; i++) {
      let shapeId = mainShapeId;
      let color = mainColor;

      if (Math.random() < 0.2) {
        const rnd = buttons[Math.floor(Math.random() * buttons.length)];
        shapeId = countryToShape[rnd.originalName];
        color = getColorForCountry(rnd.originalName);
      }

      line.appendChild(createMiniShapeBlock(shapeId, color));
    }

    patternContainer.appendChild(line);
  }
}

function defaultShapeSVG() {
  return `
    <svg viewBox="0 0 10 10">
      <rect x="0" y="0" width="2" height="2" fill="#888"/>
    </svg>
  `;
}



document.addEventListener("click", (e) => {
  // check if the click is outside popInfo and outside the button
  if (
    popInfo.classList.contains("active") && 
    !popInfo.contains(e.target) && 
    e.target !== infoBtn
  ) {
    togglePopInfo(false); // close popup
  }
  
});

