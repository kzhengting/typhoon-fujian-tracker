const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const mt = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer((q, s) => {
  let f = decodeURIComponent(q.url.split("?")[0]);
  if (f === "/") f = "/index.html";
  const fp = path.join(root, f);
  fs.readFile(fp, (e, d) => {
    if (e) { s.statusCode = 404; s.end("404"); return; }
    s.setHeader("Content-Type", mt[path.extname(fp)] || "application/octet-stream");
    s.end(d);
  });
}).listen(8777, () => console.log("serving on http://127.0.0.1:8777"));
