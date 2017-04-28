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
    const stored = false;//cache.getCache(url, cookie);
    if (stored) {
      console.dir(`[${new Date()}]: Using cache for request url ${url} and cookie ${cookie}`);
      res.end(stored);
    } else {
      let responseContent = [];
      const realUrl = urlModule.parse(url || `http://${headers.host}`);
      console.log(`Sending request to ${url || `http://${headers.host}`}`);
      console.log({
        protocol: realUrl.protocol,
        hostname: realUrl.hostname,
        path: realUrl.path,
        port: realUrl.port,
        host: realUrl.host,
        method,
        headers
      });
      const realReq = http.request({
        protocol: realUrl.protocol,
        hostname: realUrl.hostname,
        path: realUrl.path,
        port: realUrl.port,
        host: realUrl.host,
        method,
        headers
      }).on('response', (serverRes, socket, head) => {
        console.log('response');
        res.writeHead(serverRes.statusCode, serverRes.statusMessage, serverRes.headers);
        if (!serverRes.headers["content-length"]) {
          console.log('no data');
          res.end();
          return;
        }
        serverRes.on('data', (chunk) => {
          console.log('data');
          responseContent.push(chunk);
        }).on('end', (chunk) => {
          if (chunk) {
            responseContent.push(chunk);
          }
          console.log('end');
          responseContent = Buffer.concat(responseContent);
          const serverCookie = getStringFromArray(serverRes.headers['set-cookie']) || undefined;
          const cookieAge = serverRes.headers['expires'] ? (serverRes.headers['expires'] - new Date()) : serverRes.headers['maxAge'] ? serverRes.headers['maxAge'] + serverRes.headers['date'] - new Date() : undefined;
          cache.putCache(url, responseContent, serverCookie, cookieAge);
          res.end(responseContent);
        }).on('error', (err) => {
          console.log('server response');
          console.dir(err);
          throw err;
        });
      }).on('error', (err) => {
        console.log('server');
        console.dir(err);
        throw err;
      });
      realReq.end(body);
    }
  }).on('error', (err) => {
    console.log('client');
    console.dir(err);
    throw err;
  });
});

proxy.listen(process.env.port || 3000);
