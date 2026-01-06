// --- HELPERS ---
function getFillColor(node) {
  const style = node.getString("style") || "";
  const match = style.match(/fill\s*:\s*([^;]+)/i);
  return match ? match[1].trim() : "#cccccc";
}




function pointInPath(px, py, pathNode, countryName = "UNKNOWN") {
if (!isFinite(px) || !isFinite(py)) {
    console.warn(
        "pointInPath called with invalid coords:",
        { country: countryName, px, py }
    );
    return false;
}


  const d = pathNode.getString("d");
  if (!d) return false;

  // Use a hidden SVG for hit-testing
  let svgHit = document.getElementById("hitSVG");
  if (!svgHit) {
    svgHit = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgHit.setAttribute("id", "hitSVG");
    svgHit.style.position = "absolute";
    svgHit.style.left = "-1000px";   // hide offscreen
    svgHit.style.width = "0";
    svgHit.style.height = "0";
    document.body.appendChild(svgHit);
  }

  const temp = document.createElementNS("http://www.w3.org/2000/svg", "path");
  temp.setAttribute("d", d);
  svgHit.appendChild(temp);

  const pt = svgHit.createSVGPoint();
  pt.x = px;
  pt.y = py;

  const inside = temp.isPointInFill(pt);
  svgHit.removeChild(temp);
  return inside;
}

// --- POINT IN POLYGON ---
function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    const intersect = ((yi > y) != (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi + 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

