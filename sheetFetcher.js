/* Magic Mirror
 * Module: MMM-FF-cht-sh
 *
 * By Michael Trenkler
 * ISC Licensed.
 */

const axios = require("axios").default;
const cheerio = require("cheerio");

const SheetFetcher = function (nodeHelper, config) {
  var {
    moduleId,
    baseURL,
    options,
    sheets,
    sequence,
    updateOnSuspension,
    updateInterval,
    loadingCursor
  } = config;

  // public for filtering
  this.moduleId = moduleId;

  var cheatSheet = null;
  var hidden = true;
  var timerObj = null;
  var updateOnVisibilityChangeRequested = false;

  const startInterval = () => {
    stopInterval();

    updateOnVisibilityChangeRequested = false;

    if (updateInterval === null) return;
    timerObj = setTimeout(() => intervalCallback(), updateInterval);
    timerObj.unref();
  };

  const stopInterval = () => {
    if (!timerObj) return;
    if (timerObj) clearTimeout(timerObj);
    timerObj = null;
  };

  const intervalCallback = () => {
    stopInterval();
    if (!hidden && updateOnSuspension !== true) {
      proceed();
    } else if (hidden && updateOnSuspension === null) {
      proceed();
    } else {
      updateOnVisibilityChangeRequested = true;
    }
  };

  const proceed = () => {
    stopInterval(config);

    if (cheatSheet?.html) return;

    switch (sequence) {
      case "random":
        this.getRandomCheatSheetListItem();
        break;
      case "reverse":
        this.getPreviousCheatSheet();
        break;
      default:
      case "default":
        this.getNextCheatSheet();
        break;
    }
  };

  this.getInitialCheatSheet = () => {
    if (cheatSheet) {
      if (cheatSheet?.html !== "") updateCheatSheet();
      return;
    }

    if (cheatSheet) {
      showPreloader(cheatSheet.path);
    } else {
      let idx;
      switch (sequence) {
        case "random":
          this.getRandomCheatSheetListItem();
          return;
        case "reverse":
          idx = sheets.length - 1;
          break;
        default:
        case "default":
          idx = 0;
          break;
      }
      const initialSheet = sheets[idx];
      this.getCheatSheet(initialSheet);
    }
  };

  this.getPreviousCheatSheet = () => {
    if (!cheatSheet?.path) return;
    let num = sheets.findIndex((_) => _.path === cheatSheet.path);
    --num;
    if (num < 0) num = sheets.length - 1;
    this.getCheatSheet(sheets[num]);
  };

  (this.getNextCheatSheet = () => {
    let num = sheets.findIndex((_) => _.path === cheatSheet.path);
    ++num;
    if (num >= sheets.length) num = 0;
    this.getCheatSheet(sheets[num]);
  }),
    (this.prepareNotificationConfig = () => {
      const copy = Object.assign({ cheatSheet }, config);
      return copy;
    });

  const updateCheatSheet = (path, markup) => {
    const $ = cheerio.load(markup);
    const style = $("head > style");
    const header = $("body > form > span");
    header.append(
      '<span class="path">' +
        $("body > form input[name=topic]").val() +
        '<span class="path">'
    );
    const pre = $("body > form + pre");
    pre
      .find(
        "script,link,img,image,svg,map,area,audio,video,track,object,applet,embed,iframe,param,picture,portal,source"
      )
      .remove();
    cheatSheet = {
      path: path,
      header: $.html(header),
      style: $.html(style),
      html: $.html(pre)
    };

    nodeHelper.sendSocketNotification("UPDATE_CHEAT_SHEET", {
      config: this.prepareNotificationConfig()
    });

    startInterval();
  };

  this.getRandomCheatSheetListItem = () => {
    if (!sheets.length) return;
    let weightCorrectedItems = sheets.map((_) => {
      _.weight = _.weight !== undefined ? _.weight : 1 / sheets.length;
      return _;
    });
    let weightTotal = weightCorrectedItems
      .map((_) => _.weight)
      .reduce((a, b) => a + b);
    let p = Math.random() * weightTotal;
    let wSum = 0;
    let sheet = null;
    weightCorrectedItems.every((item) => {
      wSum += item.weight || 0;
      if (p > wSum) {
        return true;
      } else {
        sheet = item;
        return false;
      }
    });
    this.getCheatSheet(sheet);
  };

  this.getRandomCheatSheet = () => {
    this.getCheatSheet({ path: ":random" });
  };

  const showPreloader = (path) => {
    let num = sheets.findIndex((_) => _.path === path) + 1;
    let total = sheets.length;

    cheatSheet = {
      path: path,
      header:
        `<pre class="curl-input">` +
        `$ curl cheat.sh/${path}` +
        `<span class="cursor-loading">${loadingCursor}</span>` +
        `</pre>` +
        (total ? `<pre class="loading-pager">[${num}/${total}]</pre>` : "")
    };
    nodeHelper.sendSocketNotification("UPDATE_CHEAT_SHEET", {
      config: this.prepareNotificationConfig()
    });
  };

  const getRandomStyle = (styles) => {
    const allStyles = [
      "abap",
      "algol",
      "algol_nu",
      "arduino",
      "autumn",
      "borland",
      "bw",
      "colorful",
      "default",
      "emacs",
      "friendly",
      "fruity",
      "igor",
      "inkpot",
      "lovelace",
      "manni",
      "monokai",
      "murphy",
      "native",
      "paraiso-dark",
      "paraiso-light",
      "pastie",
      "perldoc",
      "rainbow_dash",
      "rrt",
      "sas",
      "solarized-dark",
      "solarized-light",
      "stata",
      "stata-dark",
      "stata-light",
      "tango",
      "trac",
      "vim",
      "vs",
      "xcode"
    ];
    styles = styles ?? allStyles;
    return styles[Math.floor(Math.random() * styles.length)];
  };

  this.getCheatSheet = (sheet) => {
    // const isLoading =
    //   cheatSheet && !cheatSheet.html;

    // if (isLoading) return; // sometimes strange errors can't be catched :(

    showPreloader(sheet.path);

    // the cht.sh server is experiencing issues with the valueless `options`
    let flags = sheet.options ?? options;
    let style = sheet.style ?? style;
    if (style === ":random") style = getRandomStyle();
    if (Array.isArray(style)) style = getRandomStyle(style);

    const params = [];
    if (flags) params.push(flags);
    if (style) params.push("style=" + style);

    const url = [baseURL + sheet.path];
    if (params.length) url.push(params.join("&"));

    axios
      .get(url.join("?"))
      .then((response) => {
        updateCheatSheet(sheet.path, response.data);
      })
      .catch((error) => {
        console.error(error);
        sheet.html = "";
        cheatSheet = sheet;
        nodeHelper.sendSocketNotification("ERROR", { config, error });
      });
  };

  this.suspend = () => {
    hidden = true;
    if (updateOnVisibilityChangeRequested && updateOnSuspension === true) {
      proceed();
    } else if (!timerObj && updateOnSuspension !== true) {
      startInterval();
    }
  };

  this.resume = () => {
    hidden = false;
    if (updateOnVisibilityChangeRequested && updateOnSuspension === false) {
      proceed();
    } else if (!timerObj) {
      startInterval();
    }
  };
};

module.exports = SheetFetcher;
