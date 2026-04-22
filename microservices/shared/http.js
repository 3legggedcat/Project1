const sendJson = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Content-Type": "application/json; charset=UTF-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
};

const sendEmpty = (res, statusCode) => {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  });
  res.end();
};

const getJsonBody = req =>
  new Promise((resolve, reject) => {
    let data = "";

    req
      .on("data", chunk => {
        data += chunk;
      })
      .on("end", () => {
        if (!data) {
          resolve({});
          return;
        }

        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error("Invalid JSON payload."));
        }
      })
      .on("error", reject);
  });

const notFound = res => sendJson(res, 404, { message: "Route not found." });
const methodNotAllowed = res => sendJson(res, 405, { message: "Method not allowed." });

module.exports = {
  getJsonBody,
  methodNotAllowed,
  notFound,
  sendEmpty,
  sendJson,
};
