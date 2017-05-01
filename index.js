const http = require('http');
const cache = require('./mem-cache');
const urlModule = require('url');

function getStringFromArray(arr) {
  if (!arr) {
    return "";
  }
  arr.sort();
  let result = "";
  for (ele in arr) {
    result += ele;
  }
  return result;
}

const proxy = http.createServer((req, res) => {
  res.useChunkedEncodingByDefault = false;
  console.log(`[${new Date()}]: Request for ${req.url}`);
  let body = [];
  const {
    headers,
    httpVersion,
    method,
    rawHeaders,
    rawTrailers,
    trailers,
    url
  } = req;
  req.on('data', function(chunk) {
    body.push(chunk);
  }).on('end', function(chunk) {
    if (chunk) {
      body.push(chunk);
    }
    body = Buffer.concat(body);
    let reqData = [];
    const cookie = getStringFromArray(headers['set-cookie']) || undefined;
    const stored = cache.getCachedHeaderAndBody(url, cookie);
    if (stored.header) {
      console.dir(`[${new Date()}]: Using cache for request url ${url} and cookie ${cookie}`);
      res.writeHead(stored.statusCode || 200, stored.statusMessage, stored.headers);
      res.end(stored.body);
    } else {
      let responseContent = [];
      const realUrl = urlModule.parse(url || `http://${headers.host}`);
      console.log(`[${new Date()}]: Sending request to ${url || `http://${headers.host}`}`);
      const realReq = http.request({
        protocol: realUrl.protocol,
        hostname: realUrl.hostname,
        path: realUrl.path,
        port: realUrl.port,
        host: realUrl.host,
        method,
        headers
      })
      realReq.useChunkedEncodingByDefault = false;
      realReq.on('response', (serverRes, socket, head) => {
        res.writeHead(serverRes.statusCode, serverRes.statusMessage, serverRes.headers);
        const serverCookie = getStringFromArray(serverRes.headers['set-cookie']) || undefined;
        let cookieAge = serverRes.headers['expires'] ? (serverRes.headers['expires'] - new Date()) : serverRes.headers['maxAge'] ? serverRes.headers['maxAge'] + serverRes.headers['date'] - new Date() : undefined;
        cache.putCacheHeader(url, {
          statusCode: serverRes.statusCode,
          statusMessage: serverRes.statusMessage,
          headers: serverRes.headers
        }, serverCookie, cookieAge);
        if (!serverRes.headers["content-length"]) {
          res.end();
          return;
        }
        serverRes.on('data', (chunk) => {
          responseContent.push(chunk);
        }).on('end', (chunk) => {
          if (chunk) {
            responseContent.push(chunk);
          }
          responseContent = Buffer.concat(responseContent);
          cookieAge = serverRes.headers['expires'] ? (serverRes.headers['expires'] - new Date()) : serverRes.headers['maxAge'] ? serverRes.headers['maxAge'] + serverRes.headers['date'] - new Date() : undefined;
          cache.putCacheBody(url, responseContent, serverCookie, cookieAge);
          res.end(responseContent);
        }).on('error', (err) => {
          console.error(err);
          throw err;
        });
      }).on('error', (err) => {
        throw err;
      });
      realReq.end(body);
    }
  }).on('error', (err) => {
    throw err;
  });
});

proxy.listen(process.env.port || 3000);
