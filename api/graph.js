const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const bodyStr = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    const bodyObj = JSON.parse(bodyStr);
    const { _path, ...payload } = bodyObj;
    const postData = JSON.stringify(payload);

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'graph.facebook.com',
        path: _path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      const r = https.request(options, (resp) => {
        let raw = '';
        resp.on('data', c => raw += c);
        resp.on('end', () => resolve({ status: resp.statusCode, body: raw }));
      });
      r.on('error', reject);
      r.write(postData);
      r.end();
    });

    res.setHeader('Content-Type', 'application/json');
    return res.status(result.status).send(result.body);
  } catch(err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};
