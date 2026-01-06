function initAllCountryData() {
  let globalContinentMax = {}; 
  let unknownList = new Set(); 

  const paysmig = countryMig["Pays"];
  const currentYear = "2024";   // année active visible
  

  for (let countryName in paysmig) {
    if (!paysmig.hasOwnProperty(countryName)) continue;

    const migYearData = paysmig[countryName][currentYear];
    if (!migYearData) continue;

    // Filtre : on enlève les valeurs nulles / 0
    const cleaned = {};
    for (let dst in migYearData) {
      if (migYearData[dst] > 0) cleaned[dst] = migYearData[dst];
    }

    // Structure légère, aucune rupture dans le reste du code
    dataMig[countryName] = {
      raw2024: cleaned
    };
  }


  const countries = worldPopData["Country"]; 

  for (let countryName in countries) {
    if (!countries.hasOwnProperty(countryName)) continue;

    countryData[countryName] = {};
    const countryObj = countries[countryName];

    for (let year in countryObj) {
      if (!countryObj.hasOwnProperty(year)) continue;

      const entry = countryObj[year];

      countryData[countryName][year] = {
        population:  entry["population"],
        malePop:     entry["male pop"],
        femalePop:   entry["female pop"],
        density:     entry["density"],
        migShare:     entry["migShare"]
      };
    }
  }

  return globalContinentMax;
}


function findGroupId(node) {
  while (node) {
    if (node.getName() === "g" && node.getString("id")) {
      return node.getString("id");
    }
    node = node.getParent();
  }
  return null;
}

function normalizeCountryName(name) {
  return name
    .replace(/[_\s’']/g, "")       // remove spaces, underscores, apostrophes
    .normalize("NFD")               // decompose accents
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .toLowerCase();                 // lowercase
}

function findCountryKey(name) {
  if (!name) return null;
  const norm = normalizeCountryName(name);

  for (let k in countryData) {
    if (normalizeCountryName(k) === norm) return k; // returns original country name
  }

  return null;
}


function findContinentOfCountry(country) {
  for (let cont in continents) {
    if (continents[cont].includes(country)) {
      return cont;
    }
  }
  return "Unknown";
}


//svg helpers
function polygonToSVG(node, color) {
  const pts = node.getString("points").trim().replace(/,/g, " ");
  return `<polygon points="${pts}" fill="${color}"/>\n`;
}

function rectToSVG(node, color) {
  const x = node.getNum("x");
  const y = node.getNum("y");
  const w = node.getNum("width");
  const h = node.getNum("height");
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>\n`;
}

function pathToSVG(node, color) {
  const d = node.getString("d");
  return `<path d="${d}" fill="${color}"/>\n`;
}

function drawSVGShapeToString(shapeId, x, y, color) {
  const xml = shapeSVGs[shapeId];
  if (!xml) return "";

  const children = getSVGShapes(xml);
  if (!children.length) return "";

  let str = `<g transform="translate(${x},${y})">\n`;

  for (let node of children) {
    const type = node.getName();
    if (type === "polygon") str += polygonToSVG(node, color);
    else if (type === "rect") str += rectToSVG(node, color);
    else if (type === "path") str += pathToSVG(node, color);
  }

  str += `</g>\n`;
  return str;
}
