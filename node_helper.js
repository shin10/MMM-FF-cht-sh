/* Magic Mirror
 * Module: MMM-FF-cht-sh
 *
 * By Michael Trenkler
 * ISC Licensed.
 */

const NodeHelper = require("node_helper");
const axios = require("axios").default;
const cheerio = require("cheerio");

module.exports = NodeHelper.create({
  instanceData: {},

  start: function () {
    console.log("Starting node helper: " + this.name);
  },

  stopInterval(config) {
    const timerObj = this.instanceData[config.moduleId]?.timerObj;
    if (!timerObj) return;
    if (timerObj) clearTimeout(timerObj);
    this.instanceData[config.moduleId].timerObj = null;
  },

  startInterval: function (config) {
    this.stopInterval(config);
    if (config.updateInterval === null) return;

    config.updateOnVisibilityChangeRequested = false;
    if (!this.instanceData[config.moduleId])
      this.instanceData[config.moduleId] = config;
    const instanceConfig = this.instanceData[config.moduleId];

    const timerObj = setTimeout(
      () => this.intervalCallback(instanceConfig),
      config.updateInterval
    );

    timerObj.unref();

    instanceConfig.timerObj = timerObj;
  },

  intervalCallback: function (config) {
    this.stopInterval(config);
    if (!config.hidden && config.updateOnSuspension !== true) {
      this.proceed(config);
    } else if (config.hidden && config.updateOnSuspension === null) {
      this.proceed(config);
    } else {
      config.updateOnVisibilityChangeRequested = true;
    }
  },

  proceed: function (config) {
    this.stopInterval(config);

    const instanceConfig = this.instanceData[config.moduleId];
    if (!instanceConfig?.cheatSheet?.html) return;

    switch (config.sequence) {
      case "random":
        this.getRandomCheatSheetListItem(config);
        break;
      case "reverse":
        this.getPreviousCheatSheet(config);
        break;
      default:
      case "default":
        this.getNextCheatSheet(config);
        break;
    }
  },

  getPreviousCheatSheet: function (config) {
    const instanceConfig = this.instanceData[config.moduleId];
    if (!instanceConfig) return;
    const cheatSheet = instanceConfig.cheatSheet;
    if (!cheatSheet?.path) return;
    let num = instanceConfig.sheets.findIndex(
      (_) => _.path === cheatSheet.path
    );
    --num;
    if (num < 0) num = instanceConfig.sheets.length - 1;
    this.getCheatSheet(config, instanceConfig.sheets[num]);
  },

  getNextCheatSheet: function (config) {
    const instanceConfig = this.instanceData[config.moduleId];
    if (!instanceConfig) return;
    const cheatSheet = instanceConfig.cheatSheet;
    let num = instanceConfig.sheets.findIndex(
      (_) => _.path === cheatSheet.path
    );
    ++num;
    if (num >= instanceConfig.sheets.length) num = 0;
    this.getCheatSheet(config, instanceConfig.sheets[num]);
  },

  prepareNotificationConfig: function (config) {
    const copy = Object.assign({}, config);
    delete copy.timerObj; // keeping the timerObj would lead to a circular reference error when serializing the notification payload
    return copy;
  },

  socketNotificationReceived: function (notification, payload) {
    const config = payload.config;
    const instanceConfig = this.instanceData[config.moduleId] || config;

    switch (notification) {
      case "GET_INITIAL_CHEAT_SHEET":
        if (this.instanceData[config.moduleId]) {
          this.sendSocketNotification("UPDATE_CHEAT_SHEET", {
            config: this.prepareNotificationConfig(instanceConfig)
          });
        } else {
          let initialUrlIdx;
          switch (instanceConfig.sequence) {
            case "random":
              this.getRandomCheatSheetListItem(instanceConfig);
              return;
            case "reverse":
              initialUrlIdx = instanceConfig.sheets.lenght - 1;
              break;
            default:
            case "default":
              initialUrlIdx = 0;
              break;
          }
          const initialSheet = instanceConfig.sheets[initialUrlIdx];
          this.getCheatSheet(config, initialSheet);
        }
        break;
      case "GET_PREVIOUS_CHEAT_SHEET_LIST_ITEM":
        this.getPreviousCheatSheet(instanceConfig);
        break;
      case "GET_NEXT_CHEAT_SHEET_LIST_ITEM":
        this.getNextCheatSheet(instanceConfig);
        break;
      case "GET_RANDOM_CHEAT_SHEET_LIST_ITEM":
        this.getRandomCheatSheetListItem(instanceConfig);
        break;
      case "GET_RANDOM_CHEAT_SHEET":
        this.getRandomCheatSheet(instanceConfig);
        break;
      case "GET_CHEAT_SHEET":
        this.getCheatSheet(config, payload.sheet);
        break;
      case "SUSPEND":
        instanceConfig.hidden = true;
        if (
          instanceConfig.updateOnVisibilityChangeRequested &&
          instanceConfig.updateOnSuspension === true
        ) {
          this.proceed(instanceConfig);
        } else if (
          !instanceConfig.timerObj &&
          instanceConfig.updateOnSuspension !== true
        ) {
          this.startInterval(instanceConfig);
        }
        break;
      case "RESUME":
        instanceConfig.hidden = false;
        if (
          instanceConfig.updateOnVisibilityChangeRequested &&
          instanceConfig.updateOnSuspension === false
        ) {
          this.proceed(instanceConfig);
        } else if (!instanceConfig.timerObj) {
          this.startInterval(instanceConfig);
        }
        break;
      default:
        break;
    }
  },

  updateCheatSheet: function (config, path, markup) {
    const instanceConfig = (this.instanceData[config.moduleId] = config);
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
    instanceConfig.cheatSheet = {
      path: path,
      header: $.html(header),
      style: $.html(style),
      html: $.html(pre)
    };
    this.sendSocketNotification("UPDATE_CHEAT_SHEET", {
      config: this.prepareNotificationConfig(instanceConfig)
    });
    this.startInterval(config);
  },

  getRandomCheatSheetListItem: function (config) {
    if (!config.sheets.length) return;
    let weightCorrectedItems = config.sheets.map((_) => {
      _.weight = _.weight !== undefined ? _.weight : 1 / config.sheets.length;
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
    this.getCheatSheet(config, sheet);
  },

  getRandomCheatSheet: function (config) {
    this.getCheatSheet(config, { path: ":random" });
  },

  showPreloader: function (config, path) {
    let num, total;
    const instanceConfig = (this.instanceData[config.moduleId] = config);
    if (instanceConfig) {
      num = instanceConfig.sheets.findIndex((_) => _.path === path) + 1;
      total = instanceConfig.sheets.length;
    }

    instanceConfig.cheatSheet = {
      path: path,
      header:
        `<pre class="curl-input">` +
        `$ curl cheat.sh/${path}` +
        `<span class="cursor-loading">${instanceConfig.loadingCursor}</span>` +
        `</pre>` +
        (total ? `<pre class="loading-pager">[${num}/${total}]</pre>` : "")
    };
    this.sendSocketNotification("UPDATE_CHEAT_SHEET", {
      config: this.prepareNotificationConfig(instanceConfig)
    });
  },

  getRandomStyle: function (styles) {
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
  },

  getCheatSheet: function (config, sheet) {
    const instanceConfig = this.instanceData[config.moduleId] || config;
    const isLoading =
      instanceConfig.cheatSheet && !instanceConfig.cheatSheet.html;
    if (isLoading) return;

    this.showPreloader(config, sheet.path);

    // the cht.sh server is experiencing issues with the valueless `options`
    let options = sheet.options ?? config.options;
    let style = sheet.style ?? config.style;
    if (style === ":random") style = this.getRandomStyle();
    if (Array.isArray(style)) style = this.getRandomStyle(style);

    const params = [];
    if (options) params.push(options);
    if (style) params.push("style=" + style);

    const url = [config.baseURL + sheet.path];
    if (params.length) url.push(params.join("&"));

    axios
      .get(url.join("?"))
      .then((response) => {
        this.updateCheatSheet(config, sheet.path, response.data);
      })
      .catch((err) => this.sendSocketNotification("ERROR", { error: err }));
  }
});
