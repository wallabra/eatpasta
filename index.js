// Generated by CoffeeScript 1.12.6

/*
+----------+
| EatPasta |
+----------+

Your favorite paste website S&S system in Node.JS:
Searching and Scraping

©2017 Gustavo6046. The MIT license.
 */
var Website, cheerio, fs, getPage, ior, request, resolveURL,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

request = require('request');

fs = require('fs');

cheerio = require('cheerio');

resolveURL = function(url, base) {
  if (!/^[a-z0-9]+:\/\//i.test(base)) {
    base = "http://" + base;
  }
  return (new (require('url').URL)(url, base)).href;
};

if (!(resolveURL("sub", "example.com") === "http://example.com/sub")) {
  throw new Error("[debug] Function resolveURL does not work!");
}

cheerio.prototype.outerHTML = function(s) {
  if (s) {
    return this.before(s).remove();
  } else {
    return cheerio('<p>').append(this.eq(0).clone()).html();
  }
};

ior = function(l) {
  return l.reduce(function(a, b) {
    return a || b;
  });
};

getPage = function(uri) {
  return new Promise(function(resolve, reject) {
    return request.get({
      uri: uri
    }, function(error, response, body) {
      if (response.statusCode !== 200) {
        error = new Error("Status code " + response.statusCode + "!");
      }
      if (error) {
        return reject(error);
      } else {
        return resolve(body);
      }
    });
  });
};

Website = (function() {
  function Website(config1) {
    this.config = config1;
    this.mainLoop = bind(this.mainLoop, this);
    this.scrapePages = bind(this.scrapePages, this);
    this.individualPageHTML = bind(this.individualPageHTML, this);
    this.individualPage = bind(this.individualPage, this);
    this.getArchive = bind(this.getArchive, this);
  }

  Website.prototype.getArchive = function() {
    return getPage(this.config.archiveURL);
  };

  Website.prototype.individualPage = function(url) {
    var config;
    config = this.config;
    return new Promise(function(resolve, reject) {
      return getPage(url).then((function(body) {
        var $, next;
        $ = cheerio.load(body);
        next = function($, cpath, cpi, url) {
          var el, query;
          query = cpath[cpi].contentQuery;
          if (cpath[cpi].queryType === "link") {
            if (cpath[cpi].queryIndex != null) {
              if ($(query)[cpath[cpi].queryIndex] == null) {
                fs.writeFileSync(query + "\n" + ($(query)) + "\n" + cpath[cpi].queryIndex, "debug.log");
              }
              url = resolveURL($(query)[cpath[cpi].queryIndex].attribs["href"], url);
            } else {
              url = resolveURL($(query).attribs["href"], url);
            }
            return getPage(url).then((function(data) {
              if (cpi === cpath.length - 1) {
                return resolve({
                  data: data,
                  url: url
                });
              } else {
                return next(cheerio.load(data), cpath, cpi + 1, url);
              }
            }), (function(error) {
              console.log(error);
              return reject(error);
            }));
          } else if (cpath[cpi].queryType === "element") {
            if (cpath[cpi].queryIndex != null) {
              el = $(query)[cpath[cpi].queryIndex];
            } else {
              el = $(query);
            }
            return next(cheerio.load(el.outerHTML()), cpath, cpi + 1);
          }
        };
        return next($, config.pathToContent, 0, url);
      }), (function(error) {
        console.log(error);
        return reject(error);
      }));
    });
  };

  Website.prototype.individualPageHTML = function(body, lastURL) {
    var $, config;
    config = this.config;
    $ = cheerio.load(body);
    return new Promise(function(resolve, reject) {
      var next;
      next = function($, cpath, cpi, url) {
        var el, query;
        query = cpath[cpi].contentQuery;
        if (cpath[cpi].queryType === "link") {
          if (cpath[cpi].queryIndex != null) {
            url = resolveURL($(query)[cpath[cpi].queryIndex].attribs["href"], url);
          } else {
            url = resolveURL($(query).attribs["href"], url);
          }
          return getPage(url).then((function(data) {
            if (cpi === cpath.length - 1) {
              return resolve({
                data: data,
                url: url
              });
            } else {
              return next(cheerio.load(data), cpath, cpi + 1, url);
            }
          }), (function(error) {
            return reject(error);
          }));
        } else if (cpath[cpi].queryType === "element") {
          if (cpath[cpi].queryIndex != null) {
            el = $(query)[cpath[cpi].queryIndex];
          } else {
            el = $(query);
          }
          return next(cheerio.load(el.outerHTML()), cpath, cpi + 1, url);
        }
      };
      return next($, config.pathToContent, 0, lastURL);
    });
  };

  Website.prototype.scrapePages = function(callback) {
    var config, getArchive, individualPage;
    config = this.config;
    individualPage = this.individualPage;
    getArchive = this.getArchive;
    return new Promise(function(resolve, reject) {
      var errors;
      errors = [];
      return getArchive().then((function(data) {
        var $, i, j, k, l, len, len1, links, results, results1;
        $ = cheerio.load(data);
        links = $(config.individualPaste.selector);
        console.log("[" + config.name + "] Found " + links.length + " candidates to pastes.");
        if (config.individualPaste.type === "link") {
          results = [];
          for (j = 0, len = links.length; j < len; j++) {
            l = links[j];
            i = 0;
            if (l != null) {
              setTimeout((function() {
                return individualPage(resolveURL(l.attribs["href"], config.archiveURL)).then((function(res) {
                  return callback(res.url, res.data);
                }), (function(error) {
                  return reject(error);
                }));
              }), config.cooldowns.perLink * i);
              results.push(i++);
            } else {
              results.push(void 0);
            }
          }
          return results;
        } else if (config.individualPaste.type === "element") {
          results1 = [];
          for (k = 0, len1 = links.length; k < len1; k++) {
            l = links[k];
            results1.push(individualPageHTML(l.outerHTML(), config.archiveURL));
          }
          return results1;
        }
      }), (function(error) {
        return reject(error);
      }));
    });
  };

  Website.prototype.mainLoop = function(desired, callback) {
    var config, numErrors, old, scrape, scrapePages, scraped;
    scraped = [];
    old = 0;
    scrapePages = this.scrapePages;
    config = this.config;
    if ((typeof desired) === "string") {
      desired = new RegExp(desired, "ig");
    }
    numErrors = 0;
    scrape = function() {
      return scrapePages(function(url, data) {
        if (indexOf.call(scraped, url) < 0 && desired.test(data)) {
          callback(url, data);
          scraped.push(url);
        }
        if (scraped.length === old) {
          return setTimeout(scrape, config.cooldowns.noNewPaste * 1000);
        } else {
          console.log("[" + config.name + "] Found " + (scraped.length - old) + " new matching pastes this cycle!");
          old = scraped.length;
          return setTimeout(scrape, config.cooldowns.newPaste * 1000);
        }
      }).then(function() {}, function(error) {
        if (numErrors === 5) {
          throw error;
        } else {
          console.log("Error during scraping (total 5 errors to give up):");
          console.log(error);
          return numErrors++;
        }
      });
    };
    return scrape();
  };

  return Website;

})();

module.exports = Website;