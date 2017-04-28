const nonCookiedHeader = {};
const cookiedHeader = {};
const nonCookiedBody = {};
const cookiedBody = {};

module.exports = {
  getCachedHeaderAndBody: function(url, cookie) {
    if (!url) {
      throw new Error(`Missing required argument!`);
    }
    if (!cookie) {
      return {
        header: nonCookiedHeader[url],
        body: nonCookiedBody[url]
      };
    } else {
      return {
        statusCode: cookiedHeader[url][cookie].statusCode,
        statusMessage: cookiedHeader[url][cookie].statusMessage,
        header: cookiedHeader[url][cookie].header,
        body: cookiedBody[url][cookie]
      };
    }
  },

  putCacheHeader: function(url, content, cookie, timeout = 300000) {
    if (!url || content == undefined) {
      throw new Error(`Missing required argument! ${arguments[0]} ${arguments[1]} ${arguments[2]} ${arguments[3]}`);
    }

    if (!cookie) {
      delete content['set-cookie'];
      nonCookiedHeader[url] = content;
      setTimeout(() => {
        if (!delete nonCookiedHeader[url]) {
          console.warn('Failed to remove cached record');
        }
      }, timeout);
    } else {
      if (!cookiedHeader[url]) {
        cookiedHeader[url] = {};
      }
      cookiedHeader[url][cookie] = content;
      setTimeout(() => {
        if (cookiedHeader[url]) {
          if (!delete cookiedHeader[url][cookie]) {
            console.warn('Failed to remove cached record');
          }
          let size = 0;
          for (let key in cookiedHeader[url]) {
            if (obj.hasOwnProperty(key)) size++;
          }
          if (!size) {
            delete cookiedHeader[url];
          }
        }
      }, timeout);
    }
  },

  putCacheBody: function(url, content, cookie, timeout = 300000) {
    if (!url || content == undefined) {
      throw new Error(`Missing required argument! ${arguments[0]} ${arguments[1]} ${arguments[2]} ${arguments[3]}`);
    }

    if (!cookie) {
      nonCookiedBody[url] = content;
      setTimeout(() => {
        if (!delete nonCookiedBody[url]) {
          console.warn('Failed to remove cached record');
        }
      }, timeout);
    } else {
      if (!cookiedBody[url]) {
        cookiedBody[url] = {};
      }
      cookiedBody[url][cookie] = content;
      setTimeout(() => {
        if (!delete cookiedBody[url][cookie]) {
          console.warn('Failed to remove cached record');
        }
        let size = 0;
        for (let key in cookiedBody[url]) {
          if (obj.hasOwnProperty(key)) size++;
        }
        if (!size) {
          delete cookiedBody[url];
        }
      }, timeout);
    }
  }
};
