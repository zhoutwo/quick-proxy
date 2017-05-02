const nonCookiedBody = {};
const cookiedBody = {};

module.exports = {
  getCachedBody: function(url, cookie) {
    if (!url) {
      throw new Error(`Missing required argument!`);
    }
    if (!cookie) {
      return {
        body: nonCookiedBody[url]
      };
    } else {
      return {
        body: cookiedBody[url][cookie]
      };
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
