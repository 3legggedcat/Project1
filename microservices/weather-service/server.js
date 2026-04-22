const http = require("http");
const path = require("path");
const { notFound, sendEmpty, sendJson } = require("../shared/http");
const { ensureJsonFile, readJsonFile, writeJsonFile } = require("../shared/storage");

const PORT = Number(process.env.PORT || 6004);
const CACHE_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "requests.json");
const CATALOG_FILE = path.join(__dirname, "data", "catalog.json");

const seedCatalog = [
  {
    city: "phoenix",
    displayName: "Phoenix",
    condition: "Sunny",
    temperatureF: 88,
    humidity: 18,
    windMph: 9,
  },
  {
    city: "seattle",
    displayName: "Seattle",
    condition: "Cloudy",
    temperatureF: 61,
    humidity: 67,
    windMph: 6,
  },
  {
    city: "denver",
    displayName: "Denver",
    condition: "Breezy",
    temperatureF: 70,
    humidity: 31,
    windMph: 13,
  },
  {
    city: "miami",
    displayName: "Miami",
    condition: "Humid",
    temperatureF: 84,
    humidity: 74,
    windMph: 11,
  },
];

ensureJsonFile(CACHE_FILE, []);
ensureJsonFile(CATALOG_FILE, seedCatalog);

const defaultWeather = city => ({
  city,
  displayName: city.charAt(0).toUpperCase() + city.slice(1),
  condition: "Clear",
  temperatureF: 72,
  humidity: 40,
  windMph: 7,
});

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    sendEmpty(res, 204);
    return;
  }

  if (url.pathname === "/health") {
    sendJson(res, 200, { service: "weather-service", status: "ok" });
    return;
  }

  if (req.method !== "GET" || url.pathname !== "/weather") {
    notFound(res);
    return;
  }

  const city = (url.searchParams.get("city") || "phoenix").trim().toLowerCase();
  const catalog = readJsonFile(CATALOG_FILE, seedCatalog);
  const weather = catalog.find(entry => entry.city === city) || defaultWeather(city || "phoenix");
  const response = {
    ...weather,
    queriedAt: new Date().toISOString(),
    source: "local-sample-data",
  };

  const requests = readJsonFile(CACHE_FILE, []);
  requests.unshift({ city: response.city, queriedAt: response.queriedAt });
  writeJsonFile(CACHE_FILE, requests.slice(0, 25));

  sendJson(res, 200, response);
});

server.listen(PORT, () => {
  console.log(`weather-service listening on ${PORT}`);
});
