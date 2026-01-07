let svg; let webIcon; let instaIcon; 
let mailIcon;
let buttons = [];
let pays = [];
let years = ["1990","1995","2000","2005","2010","2015","2020","2024"];
let worldPopData;
let countryData = {};
let countryMig;
let dataMig = {};
let selectedButton = null;
let font;

let zoom = 1;
let MIN_ZOOM = 1;
let offscreen;
/*const CELL_SIZE = 2;
const AGGREGATE_CELL_SIZE = 6;*/
let buttonsReady = false; 
let isEverybodyMode = true;
  let container;
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready → starting p5 sketch");

  new p5((p) => {


    // ---------------- SVG INJECTION ----------------
    async function injectSvgFromUrl(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
if (!response.ok) {
  console.error("Failed to load SVG:", url);
  return null;
}
        const svgText = await response.text();
        const wrapper = document.getElementById("svg-wrapper");
        wrapper.innerHTML = svgText;
        const svgEl = wrapper.querySelector("svg");
        if (!svgEl) return null;

        // outline only
        svgEl.querySelectorAll("*").forEach(node => {
          node.removeAttribute("fill");
          node.style.fill = "none";
          node.style.stroke = "#ffffff";
          node.style.strokeWidth = "0.5";
        });

        window.svgElement = svgEl;
        return svgEl;

      } catch (err) {
        console.error("Error loading SVG:", err);
        return null;
      }
    }

// ---------------- PRELOAD ----------------
    p.preload = function () {
      svg = p.loadXML("MigMappFinalN.svg");
      png = p.loadImage("me-Icon-White.png");
      worldPopData = p.loadJSON("CountrySize.json");
      countryMig = p.loadJSON("MigWorld.json");
      webIcon = p.loadXML("web-Icon.svg");
      instaIcon = p.loadXML("instagram-icon.svg");
      mailIcon = p.loadXML("mail.svg");
      
      for (let i = 1; i <= 25; i++) {
        const name = p.nf(i, 2);
        shapeSVGs[name] = p.loadXML(`Shapes/${name}.svg`);
      }      
    };

function resizeMapContainer() {
  const mapContainer = document.getElementById("map-container");
  const toolbar = document.getElementById("toolbar");
  if (!mapContainer || !toolbar) return;

  // visible viewport height
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  // get CSS margins
  const style = getComputedStyle(document.documentElement);
  const topMargin = parseFloat(style.getPropertyValue("--top-margin")) || 20;
  const bottomMargin = parseFloat(style.getPropertyValue("--bottom-margin")) || 20;
  const toolbarHeight = toolbar.getBoundingClientRect().height || 40;
  let availableHeight = vh - topMargin - bottomMargin - toolbarHeight;
  availableHeight = Math.min(availableHeight, 1000);

  // set container height
  mapContainer.style.height = `${availableHeight}px`;
  mapContainer.style.marginTop = `${topMargin}px`;

  // resize p5 canvas
  if (p && p.resizeCanvas && p.canvas) {
    p.resizeCanvas(mapContainer.clientWidth, availableHeight);
    p.redraw();
  }

  // center SVG content
  const svgWrapper = document.getElementById("svg-wrapper");
  if (svgWrapper) {
    const svgEl = svgWrapper.querySelector("svg");
    if (!svgEl) return;

    const svgWidth = svgEl.viewBox.baseVal.width;
    const svgHeight = svgEl.viewBox.baseVal.height;

    panX = (mapContainer.clientWidth - svgWidth * zoom) / 2;
    panY = (mapContainer.clientHeight - svgHeight * zoom) / 2;

    if (p && p.redraw) p.redraw();
  }
}

// iPad detection ?
function isIPad() {
  return /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
}

    
// ---------------- SETUP ----------------
 p.setup = async function () {
  const container = document.getElementById("map-container");
  const toolbar = document.getElementById("toolbar");

// Create canvas AFTER container has correct height
  const c = p.createCanvas(container.clientWidth, container.clientHeight);
  c.parent("p5-wrapper");
   
  p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));

 // Inject SVG FIRST
    await injectSvgFromUrl("/MigMappFinalN.svg");
   resizeMapContainer();
   
    createButtonsFromDOM();
    initAllCountryData();
    initData(p);

// Squares
    buttons.forEach(b => generateSquaresForButton(b));
    buttonsReady = true; 
togglePopInfo(true); 
    p.noLoop(); // redraw only when needed
    p.redraw();
    setupInteractions(p);
container.style.visibility = "visible";
    };
    

    // ---------------- DRAW ----------------
p.draw = function () {
  if (!buttonsReady) return;
if (Math.abs(zoomVelocity) > 0.00001) {
  const prevZoom = zoom;

  zoom *= Math.exp(zoomVelocity);
  zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

  const wx = (zoomAnchorX - panX) / prevZoom;
  const wy = (zoomAnchorY - panY) / prevZoom;

  panX = zoomAnchorX - wx * zoom;
  panY = zoomAnchorY - wy * zoom;

  zoomVelocity *= ZOOM_FRICTION;
  } else {
  zoomVelocity = 0;
  } 

  if (selectedButton) {
    drawSelect(p,selectedButton);
  } else {
    drawMap(p);
    }
  };
 
  });

});


function getSVGShapes(xml) {
  if (!xml) return [];
  return xml.getChildren("*").filter(n => {
    const t = n.getName();
    return t === "polygon" || t === "path"|| t === "rect";
    
  });
}

function drawShapeTo(g, shape, fillMode = false) {
  if (!shape || !shape.el) return;

  g.push();
  if (fillMode) {
    g.noStroke();
    g.fill(255);
  } else {
    g.noFill();
    g.stroke(255);
  }

  if (shape.type === "polygon") drawPolygon(g, shape.el);
  if (shape.type === "rect")    drawRect(g, shape.el);
  if (shape.type === "path")    drawPath(g, shape.el);

  g.pop();
}


function drawRect(p, el) {
  const x = parseFloat(el.getAttribute("x")) || 0;
  const y = parseFloat(el.getAttribute("y")) || 0;
  const w = parseFloat(el.getAttribute("width")) || 0;
  const h = parseFloat(el.getAttribute("height")) || 0;

  p.rect(x, y, w, h);
}


function drawPolygon(p, el) {
  const pts = el.getAttribute("points");
  if (!pts) return;

  const nums = pts
    .trim()
    .split(/[ ,]+/)
    .map(Number);

  p.beginShape();
  for (let i = 0; i < nums.length; i += 2) {
    p.vertex(nums[i], nums[i + 1]);
  }
  p.endShape(p.CLOSE);
}


function drawPath(p, el) {
  const d = el.getAttribute("d");
  if (!d) return;

  const path = new Path2D(d);
  p.drawingContext.fill(path, "evenodd");
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}


function generateSquaresForButton(b) {
  if (!b.fillSquares || !b.fillSquares.length) return;

  const positions = [...b.fillSquares];
  shuffleArray(positions);

  b.shapeSquares = [];

  if (isEverybodyMode) {
  const totalSquares = Math.min(b.squareCount, positions.length);
    
  // 1. How many migrant squares total
  let totalMigSquares = Math.round((b.migShare2024 * totalSquares) / 100);
  if (totalMigSquares > 0 && totalMigSquares < 1) totalMigSquares = 1;
  totalMigSquares = Math.min(totalMigSquares, totalSquares);

  // 2. Compute destination proportions
  const sumMig = Object.values(b.dataMig2024).reduce((a, v) => a + v, 0);
  const destCounts = {};

  if (sumMig > 0 && totalMigSquares > 0) {    
    let assigned = 0;// initial fractional assignment
    const remainders = [];

    for (const dest in b.dataMig2024) {
      const raw = (b.dataMig2024[dest] / sumMig) * totalMigSquares;
      const count = Math.floor(raw);
      destCounts[dest] = count;
      assigned += count;
      remainders.push({ dest, rem: raw - count });
    }
   // distribute remaining squares by largest remainder
    let remaining = totalMigSquares - assigned;
    remainders.sort((a, b) => b.rem - a.rem);

    for (let i = 0; i < remaining; i++) {
      destCounts[remainders[i % remainders.length].dest]++;
    }
  }

// 3. Build migrant destination list
  const migrantList = [];
  for (const dest in destCounts) {
    for (let i = 0; i < destCounts[dest]; i++) {
      migrantList.push(dest);
    }
  }
const destCountriesCount = Object.keys(destCounts).filter(dest => destCounts[dest] > 0).length;
  b.numDestCountries = destCountriesCount;  
  //shuffleArray(migrantList);
  shuffleArray(positions);

// 4. Assign squares
  b.shapeSquares = [];

  for (let i = 0; i < totalSquares; i++) {
    const pos = positions[i];

  if (i < migrantList.length) {
    const dest = migrantList[i];

    b.shapeSquares.push({
      x: pos.x,
      y: pos.y,
      shapeId: countryToShape[dest],
      color: getColorForCountry(dest),
      destName: dest // ← store the country name directly
    });
  } else {
    b.shapeSquares.push({
      x: pos.x,
      y: pos.y,
      shapeId: countryToShape[b.originalName],
      color: getColorForCountry(b.originalName),
      destName: b.originalName
    });
  }
}

  return;
}
  // === MIGRANTS-ONLY / DEFAULT MODE ===
  if (!b.dataMigSquares2024) return;

  // build destination list
  const destList = [];
  for (let dest in b.dataMigSquares2024) {
    const n = b.dataMigSquares2024[dest];
    for (let i = 0; i < n; i++) destList.push(dest);
  }

  const total = Math.min(positions.length, destList.length);

  for (let i = 0; i < total; i++) {
    const pos = positions[i];
    const dest = destList[i];

    b.shapeSquares.push({
      x: pos.x,
      y: pos.y,
      shapeId: countryToShape[dest],
      color: getColorForCountry(dest)
    });
  }
  
}



function createButtonsFromDOM() {
  buttons = [];

  const svgEl = document.querySelector("#svg-wrapper svg");
  if (!svgEl) {
    console.warn("SVG not found in DOM");
    return;
  }

  // 1 - GROUPS (<g id="Italy"> ...)
  const groups = Array.from(svgEl.querySelectorAll("g[id]"));
  groups.forEach(g => {
    const rawID = g.id;
    if (!rawID) return;

    // ignore technical layers
    if (
      rawID === "squares-layer" ||
      rawID === "square-layer" ||
      rawID.startsWith("grid") ||
      rawID.startsWith("mask")
    ) return;

    const buttonId = rawID.replace(/_/g, " ");
    const shapes = [];

g.querySelectorAll("path, polygon, rect").forEach(el => {
      shapes.push({
        type: el.tagName.toLowerCase(),
        el,
        path: buildPath2D(el),
        polygons: buildPolygonsFromShape(el)
      });
    });

    if (shapes.length) {
      // Separate outer shapes and potential holes
      const outerShapes = shapes.filter(s => s.polygons.outer.length > 0);
      const candidateHoles = shapes.filter(s => s.polygons.outer.length > 0 && !outerShapes.includes(s));

      outerShapes.forEach(outer => {
        candidateHoles.forEach(h => {
          const allInside = h.polygons.outer.every(p =>
            pointInPolygon(p[0], p[1], outer.polygons.outer)
          );
          if (allInside) {
            outer.polygons.holes.push(h.polygons.outer);
          }
        });
      });

      buttons.push({
        buttonId,
        shapes: outerShapes,
        color: getColorForCountry(buttonId),
        
      });
    }
  });

  // 2️⃣ STANDALONE SHAPES (<path id="Japan"> ...)
  svgEl.querySelectorAll("path[id], polygon[id], rect[id]").forEach(el => {
    if (el.closest("g")) return; // already handled
    const rawID = el.id;
    if (!rawID) return;

    const buttonId = rawID.replace(/_/g, " ");
    const shape = {
      type: el.tagName.toLowerCase(),
      el,
      path: buildPath2D(el),
      polygons: buildPolygonsFromShape(el)
    };

    buttons.push({
      buttonId,
      shapes: [shape],
      color: getColorForCountry(buttonId)
    });
  });

  return buttons;
}

function buildPolygonsFromShape(el) {
  const type = el.tagName.toLowerCase();

  if (type === "polygon") {
    const pts = el.getAttribute("points");
    if (!pts) return { outer: [], holes: [] };
    const nums = pts.trim().split(/[ ,]+/).map(Number);
    const outer = [];
    for (let i = 0; i < nums.length; i += 2) outer.push([nums[i], nums[i+1]]);
    return { outer, holes: [] };
  }

  if (type === "rect") {
    const x = parseFloat(el.getAttribute("x")) || 0;
    const y = parseFloat(el.getAttribute("y")) || 0;
    const w = parseFloat(el.getAttribute("width")) || 0;
    const h = parseFloat(el.getAttribute("height")) || 0;
    return { outer: [[x,y],[x+w,y],[x+w,y+h],[x,y+h]], holes: [] };
  }

if (type === "path") {
  const d = el.getAttribute("d");
  if (!d) return { outer: [], holes: [] };

  // Convert path to points
  const path = new Path2D(d);
  const length = el.getTotalLength?.();
  const poly = [];

  if (el.getTotalLength) {
    const numPoints = Math.ceil(length / 2); // sample every 2px
    for (let i = 0; i <= numPoints; i++) {
      const pt = el.getPointAtLength((i / numPoints) * length);
      poly.push([pt.x, pt.y]);
    }
  }

  return { outer: poly, holes: [] };
}

  return { outer: [], holes: [] };
}

function buildPath2D(el) {
  const type = el.tagName.toLowerCase();

  if (type === "path") {
    const d = el.getAttribute("d");
    if (!d) return null;
    return new Path2D(d);
  }

  if (type === "polygon") {
    const pts = el.getAttribute("points");
    if (!pts) return null;
    const nums = pts.trim().split(/[ ,]+/).map(Number);
    const path = new Path2D();
    path.moveTo(nums[0], nums[1]);
    for (let i = 2; i < nums.length; i += 2) path.lineTo(nums[i], nums[i+1]);
    path.closePath();
    return path;
  }

  if (type === "rect") {
    const x = parseFloat(el.getAttribute("x")) || 0;
    const y = parseFloat(el.getAttribute("y")) || 0;
    const w = parseFloat(el.getAttribute("width")) || 0;
    const h = parseFloat(el.getAttribute("height")) || 0;
    const path = new Path2D();
    path.rect(x, y, w, h);
    return path;
  }

  return null;
}

function drawShapeOutline(p, s, color = 255) {
  
  p.noFill();
  p.stroke(color);
  //p.noStroke();
  p.strokeWeight(0.5);

  if (s.type === "polygon") drawPolygon(p, s.el);
  else if (s.type === "rect") drawRect(p, s.el);
  else if (s.type === "path") {
    const d = s.el.getAttribute("d");
    if (!d) return;

    const path = new Path2D(d);
    const ctx = p.drawingContext;
  ctx.save(); // preserve p5 state

  ctx.strokeStyle = typeof color === "number"
    ? `rgb(${color},${color},${color})`
    : color;

  ctx.lineWidth = 0.5;
  ctx.fillStyle = "transparent";

  ctx.stroke(path);

  ctx.restore();
  }
}

function getCachedCells(button, AGG) {
  const key = button.id + "|" + AGG;
  if (cellCache.has(key)) return cellCache.get(key);

  const squares = button.shapeSquares ?? [];
  if (!squares.length) return [];

  const { minX, minY } = getButtonBounds(button);
  const cells = new Map();

  for (const sq of squares) {
    const cx = Math.floor((sq.x - minX) / (BASE_CELL * AGG));
    const cy = Math.floor((sq.y - minY) / (BASE_CELL * AGG));
    const cellKey = cx + "," + cy;

    let cell = cells.get(cellKey);
    if (!cell) {
      cell = {
        x: minX + cx * (BASE_CELL * AGG),
        y: minY + cy * (BASE_CELL * AGG),
        counts: new Map()
      };
      cells.set(cellKey, cell);
    }

    const destKey = sq.shapeId + "|" + sq.color;
    cell.counts.set(destKey, (cell.counts.get(destKey) || 0) + 1);
  }

  const cellArray = Array.from(cells.values());
  cellCache.set(key, cellArray);
  return cellArray;
}
function getScaledShapes(shapeId, AGG) {
  const key = shapeId + "|" + AGG;
  if (scaledCache.has(key)) return scaledCache.get(key);

  const nodes = getCachedSVG(shapeId);
  if (!nodes) return [];

  const scaleFactor = AGG; // CELL / BASE_CELL

  const scaled = nodes.map(node => {
    if (node.type === "polygon") {
      const pts = node.pts.map(v => v * scaleFactor);
      return { type: "polygon", pts };
    }
    if (node.type === "rect") {
      return {
        type: "rect",
        x: node.x * scaleFactor,
        y: node.y * scaleFactor,
        w: node.w * scaleFactor,
        h: node.h * scaleFactor
      };
    }
    if (node.type === "path") {
      const path = new Path2D(node.path); // optional: multiply via transform in draw
      return { type: "path", path, scaleFactor };
    }
    return null;
  }).filter(Boolean);

  scaledCache.set(key, scaled);
  return scaled;
}

const svgCache = new Map();  // shapeId -> raw parsed nodes
const cellCache = new Map(); // buttonId + AGG -> aggregated cells with counts
const scaledCache = new Map();

function getCachedSVG(shapeId) {
  if (svgCache.has(shapeId)) return svgCache.get(shapeId);

  const xml = shapeSVGs[shapeId];
  if (!xml) return null;

  const nodes = getSVGShapes(xml).map(node => {
    const type = node.getName();

    if (type === "polygon") {
      const pts = node.getString("points")
        .replace(/,/g, " ")
        .trim()
        .split(/\s+/)
        .map(Number);

      return { type, pts };
    }

    if (type === "rect") {
      return {
        type,
        x: node.getNum("x"),
        y: node.getNum("y"),
        w: node.getNum("width"),
        h: node.getNum("height")
      };
    }

    if (type === "path") {
      return {
        type,
        path: new Path2D(node.getString("d"))
      };
    }

    return null;
  }).filter(Boolean);

  svgCache.set(shapeId, nodes);
  return nodes;
}

function getAggregationFactor(zoom) {
  if (zoom >= 2) return 1;
  if (zoom >= 1) return 2;
  return 4;
}

function drawMap(p) {
  p.background(0);

  p.push();
  p.translate(panX, panY);
  p.scale(zoom);

  const BASE_CELL = 2;
  const AGG = getAggregationFactor(zoom);
  const CELL = BASE_CELL * AGG;

  const left   = (-panX) / zoom;
  const top    = (-panY) / zoom;
  const right  = (p.width - panX) / zoom;
  const bottom = (p.height - panY) / zoom;

  buttons.forEach(b => {
    const squares = b.shapeSquares ?? [];
    if (!squares.length) return;

    if (zoom >= 2) {
      const outlineColor = getColorForCountry(b.originalName);
      b.shapes.forEach(s => drawShapeOutline(p, s, outlineColor));
    }

    const { minX, minY } = getButtonBounds(b);

    // BUILD AGGREGATED CELLS
    const cells = new Map();

    for (const sq of squares) {
      const cx = Math.floor((sq.x - minX) / CELL);
      const cy = Math.floor((sq.y - minY) / CELL);
      const key = cx + "," + cy;

      let cell = cells.get(key);
      if (!cell) {
        cell = {
          x: minX + cx * CELL,
          y: minY + cy * CELL,
          counts: new Map()
        };
        cells.set(key, cell);
      }

      const destKey = sq.shapeId + "|" + sq.color;
      cell.counts.set(destKey, (cell.counts.get(destKey) || 0) + 1);
    }

    // DRAW CELLS
    for (const cell of cells.values()) {
      if (cell.x + CELL < left || cell.x > right || cell.y + CELL < top || cell.y > bottom) continue;

      let bestKey = null;
      let bestCount = 0;
      for (const [k, c] of cell.counts) {
        if (c > bestCount) {
          bestCount = c;
          bestKey = k;
        }
      }
      if (!bestKey) continue;

      const [shapeId, color] = bestKey.split("|");
      const nodes = getCachedSVG(shapeId);
      if (!nodes) continue;

      p.push();
      p.translate(cell.x, cell.y);
      p.noStroke();
      p.fill(color);

      const scaleFactor = CELL / BASE_CELL;

      for (const node of nodes) {
        if (node.type === "polygon") {
          p.beginShape();
          for (let i = 0; i < node.pts.length; i += 2) {
            p.vertex(node.pts[i] * scaleFactor, node.pts[i+1] * scaleFactor);
          }
          p.endShape(p.CLOSE);
        } else if (node.type === "rect") {
          p.rect(node.x * scaleFactor, node.y * scaleFactor, node.w * scaleFactor, node.h * scaleFactor);
        } else if (node.type === "path") {
          const ctx = p.drawingContext;
          ctx.save();
          ctx.scale(scaleFactor, scaleFactor);
          ctx.fillStyle = color;
          ctx.fill(node.path, "evenodd");
          ctx.restore();
        }
      }

      p.pop();
    }
  });

  p.pop();
}


function getButtonBounds(b) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  b.shapes.forEach(s => {
    const el = s.el;
    if (!el || !el.getBBox) return;

    const bb = el.getBBox();
    minX = Math.min(minX, bb.x);
    minY = Math.min(minY, bb.y);
    maxX = Math.max(maxX, bb.x + bb.width);
    maxY = Math.max(maxY, bb.y + bb.height);
  });

  return { minX,minY,maxX,maxY,
    center: {x: (minX + maxX) / 2,y: (minY + maxY) / 2 }
  };
}

function computeFillSquaresForButton(p, b) {
  if (!b || !b.shapes || !b.shapes.length) return;

  const { minX, minY, maxX, maxY } = getButtonBounds(b);
  if (!isFinite(minX) || !isFinite(minY)) return;

  const w = Math.ceil(maxX - minX) + 2;
  const h = Math.ceil(maxY - minY) + 2;

  // create offscreen graphics using p
  const off = p.createGraphics(w, h);
  off.pixelDensity(1);
  off.background(0);

  off.push();
  off.translate(-minX, -minY);

  b.shapes.forEach(shape => drawShapeTo(off, shape, true));

  off.pop();
  off.loadPixels();

  const step = 2;
  const squares = [];

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = 4 * (y * w + x);
      if (off.pixels[idx] > 127) {
        squares.push({ x: x + minX, y: y + minY });
      }
    }
  }
  b.fillSquares = squares;
  b.squareCount = squares.length;
}



// ----------------- initData -----------------
function initData(p) {
  if (!buttons.length) {
    console.warn("initData: no buttons");
    return;
  }

  buttons.forEach(b => {
    const key = findCountryKey(b.buttonId);

  const bounds = getButtonBounds(b);
    if (!key) {
      console.warn("No country match for", b.buttonId);
      b.population2024 = 0;
      b.dataMig2024 = {};
      b.dataMigSquares2024 = {};
      b.fillSquares = [];
      b.shapeSquares = [];
      b.migShare2024 = 0;
      return;
    }
b.color = getColorForCountry(b.originalName);
b.originalName = key;
b.population2024 = countryData[key]?.["2024"]?.population ?? 0;
b.dataMig2024 = dataMig[key]?.raw2024 ?? {};
b.migShare2024 = countryData[key]?.["2024"]?.migShare ?? 0;
b.migTotalRaw = b.population2024 * (b.migShare2024 / 100);
    computeFillSquaresForButton(p, b);

    // convert migration → squares
    const sumMig = Object.values(b.dataMig2024).reduce((a, v) => a + v, 0);
    b.dataMigSquares2024 = {};
    if (sumMig > 0 && b.squareCount > 0) {
      const ratio = b.squareCount / sumMig;
const rawMigSquare = (b.migShare2024 * b.squareCount) / 100;
const migSquare = rawMigSquare > 0 ? Math.max(1, Math.round(rawMigSquare)) : 0;

      for (let dest in b.dataMig2024) {
        b.dataMigSquares2024[dest] = b.dataMig2024[dest] * ratio;
      }

      // rounding
      let floorTotal = 0;
      const floors = {};
      const remainders = {};

      for (let dest in b.dataMigSquares2024) {
        const v = b.dataMigSquares2024[dest];
        const f = Math.floor(v);
        floors[dest] = f;
        remainders[dest] = v - f;
        floorTotal += f;
      }

      let needed = b.squareCount - floorTotal;
      const order = Object.keys(remainders).sort(
        (a, b2) => remainders[b2] - remainders[a]
      );

      for (let i = 0; i < needed; i++) {
        floors[order[i % order.length]]++;
      }

      b.dataMigSquares2024 = floors;
    }

    generateSquaresForButton(b);
  });

}


// ----------------- drawSquares -----------------
function drawSVGShape(p, shapeId, x, y, color, size = 2) {
  const xml = shapeSVGs[shapeId];
  if (!xml) return;

  const children = getSVGShapes(xml);
  if (!children.length) return;

  p.push();
  p.translate(x, y);
  p.fill(color);
  p.noStroke();

  for (let node of children) {
    const type = node.getName();

    if (type === "polygon") {
      const pts = node.getString("points");
      if (!pts) continue;
      const nums = pts.replace(/,/g, " ").trim().split(/\s+/).map(Number);
      if (nums.length < 4) continue;

      p.beginShape();
      for (let i = 0; i < nums.length; i += 2) p.vertex(nums[i], nums[i + 1]);
      p.endShape(p.CLOSE);

    } else if (type === "rect") {
      const x = node.getNum("x");
      const y = node.getNum("y");
      const w = node.getNum("width");
      const h = node.getNum("height");
      p.rect(x, y, w, h);

    } else if (type === "path") {
      const d = node.getString("d");
      if (!d) continue;
      const path = new Path2D(d);
      p.drawingContext.fillStyle = color;
      p.drawingContext.fill(path);
    }
  }

  p.pop();
}


function pointInPolygon(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    const intersect = ((yi > py) !== (yj > py)) &&
                      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}


function pointInsideButton(mouseX, mouseY, button) {
  const px = (mouseX - panX) / zoom;
  const py = (mouseY - panY) / zoom;

  return button.shapes.some(shape => {
    if (!shape.polygons) return false;
    if (!pointInPolygon(px, py, shape.polygons.outer)) return false;
    if (shape.polygons.holes) {
      for (const hole of shape.polygons.holes) {
        if (pointInPolygon(px, py, hole)) return false;
      }
    }
    return true;
  });
}

