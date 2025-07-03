import express from "express";
import fs from "fs";
import https from "https";
import path from "path";
import send from "send";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const sslOptions = {
  key: process.env.SSL_KEY_FILE ? fs.readFileSync(process.env.SSL_KEY_FILE) : undefined,
  cert: process.env.SSL_CRT_FILE ? fs.readFileSync(process.env.SSL_CRT_FILE) : undefined,
};

// Serve static files - check if they exist first
const staticPath = path.join(__dirname, "../lib/static");
console.log(`Serving static files from: ${staticPath}`);

// Log what files exist in the static directory
if (fs.existsSync(staticPath)) {
  console.log('Static files found:', fs.readdirSync(staticPath));
}

app.use("/static", express.static(staticPath));

// Serve index.html for all routes
app.get("/*splat", (req, res) => {
  const htmlPath = path.join(__dirname, "views", "hello.html");
  send(req, htmlPath).pipe(res);
});


// Create HTTP server
const port = process.env.PORT || process.env.port || 53000;

if (sslOptions.key && sslOptions.cert) {
  https.createServer(sslOptions, app).listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
} else {
  app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
}