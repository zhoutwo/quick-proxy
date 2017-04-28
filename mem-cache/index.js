const nonCookied = {};
const cookied = {};

module.exports = {
  getCache: function(url, cookie) {
    if (!url) {
      throw new Error(`Missing required argument!`);
    }
    if (!cookie) {
      return nonCookied[url];
    } else {
      return cookied[url];
    }
  },

  putCache: function(url, content, cookie, timeout = 300000) {
    if (!url || content == undefined) {
      throw new Error(`Missing required argument! ${arguments[0]} ${arguments[1]} ${arguments[2]} ${arguments[3]}`);
    }
    const toAdd = cookie ? cookied : nonCookied;
    toAdd[url] = content;
    setTimeout(() => {
      delete toAdd[url];
    }, timeout);
  }
};
