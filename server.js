/* FULL STACK SERVER */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
// YOUR NEW KEY
const API_KEY = "AIzaSyAHC2NPIW_Qy28FE93fsclxIOqlIHKOhqo"; 
const server = http.createServer((req, res) => {
  
  // 1. SERVE HTML (The Landing Page)
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error: index.html missing from Git repo.');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      }
    });
  } 
  
  // 2. SERVE AI (The API)
  else if (req.url === '/api/generate') {
    const data = JSON.stringify({
      contents: [{
        parts: [{ text: "Write a 1-sentence funny welcome message from a futuristic AI." }]
      }]
    });
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    const apiReq = https.request(options, (apiRes) => {
      let body = '';
      apiRes.on('data', c => body += c);
      apiRes.on('end', () => {
        try {
          const json = JSON.parse(body);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "System Offline.";
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ text: text }));
        } catch (e) {
          res.writeHead(500);
          res.end(JSON.stringify({ text: "Error" }));
        }
      });
    });
    apiReq.on('error', e => console.error(e));
    apiReq.end(data); // Send request
  } 
  
// 3. LEAD CAPTURE (Send to N8N)
  else if (req.url === '/api/join') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        const n8nReq = https.request({
            hostname: 'n8n.srv1238670.hstgr.cloud',
            path: '/webhook-test/02c9ff28-4f02-4bb5-8760-c49a574d8e12',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': body.length
            }
        }, (n8nRes) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'sent' }));
        });
        
        n8nReq.on('error', (e) => {
            console.error(e);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'N8N unreachable' }));
        });
        n8nReq.write(body);
        n8nReq.end();
    });
  }
  
  // 4. FALLBACK (404)
  else {
    res.writeHead(404);
    res.end("Not Found");
  }
});
const port = process.env.PORT || 3000;
server.listen(port, () => console.log('Server Live'));
