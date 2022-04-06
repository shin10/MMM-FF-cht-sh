/* Magic Mirror
 * Module: MMM-FF-cht-sh
 *
 * By Michael Trenkler
 * ISC Licensed.
 */

Module.register("MMM-FF-cht-sh", {
  defaults: {
    header: "cht.sh",
    baseURL: "https://cht.sh/",
    sheets: [
      { path: ":firstpage", weight: 1 },
      { path: ":firstpage-v1", weight: 1 },
      { path: ":random", weight: 1 },
      { path: ":help", weight: 1 },
      { path: ":styles-demo", weight: 1 },
      { path: "awk" },
      { path: "awk/:learn" },
      { path: "fakedata" },
      { path: "tmux" },
      { path: "go/hello" },
      { path: "tar", weight: 0 },
      { path: "cheat.sheets:tar" },
      { path: "cheat:tar" },
      { path: "tldr:tar" }
    ],
    options: "q",
    style: "default",
    sequence: "default", // null, 'random', 'default', 'reverse'
    updateOnSuspension: null, // null, false or true
    updateInterval: 10 * 60 * 1000, // 10 minutes
    loadingCursor: "&nbsp;&block;",
    showTitle: true,
    animationSpeed: 1000,
    scrollAmount: null,
    events: {
      CHEAT_SHEET_SCROLL_UP: "CHEAT_SHEET_SCROLL_UP",
      CHEAT_SHEET_SCROLL_DOWN: "CHEAT_SHEET_SCROLL_DOWN",
      CHEAT_SHEET_LIST_ITEM_PREVIOUS: "CHEAT_SHEET_LIST_ITEM_PREVIOUS",
      CHEAT_SHEET_LIST_ITEM_NEXT: "CHEAT_SHEET_LIST_ITEM_NEXT",
      CHEAT_SHEET_LIST_ITEM_RANDOM: "CHEAT_SHEET_LIST_ITEM_RANDOM",
      CHEAT_SHEET_RANDOM: "CHEAT_SHEET_RANDOM"
    }
  },

  init: function () {
    this.cheatSheetData = null;
    this.error = null;
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.config.moduleId = this.identifier;
    this.sendSocketNotification("GET_INITIAL_CHEAT_SHEET", {
      config: this.config
    });
  },

  getScripts: function () {
    return [];
  },

  getStyles: function () {
    return [this.file("./styles/MMM-FF-cht-sh.css")];
  },

  getHeader: function () {
    if (!this.config.showTitle) return null;
    return this.config.header;
  },

  getDom: function () {
    let wrapper = document.createElement("div");
    wrapper.classList.add("cht-sh");

    if (this.error) {
      wrapper.innerHTML = "ERROR: " + JSON.stringify(this.error);
      return wrapper;
    }

    if (!this.cheatSheetData?.path) {
      wrapper.innerHTML = this.translate("LOADING");
      wrapper.className = "light small dimmed";
    } else if (!this.cheatSheetData?.html) {
      wrapper.innerHTML = this.cheatSheetData?.header;
    } else {
      wrapper.innerHTML =
        this.cheatSheetData?.style +
        this.cheatSheetData?.header +
        this.cheatSheetData?.html;
    }

    return wrapper;
  },

  scrollCheatSheet: function (direction) {
    const sheet = document.querySelector(`#${this.identifier} .cht-sh`);
    if (!sheet) return;
    sheet.scrollBy(
      0,
      direction * (this.config.scrollAmount || sheet.offsetHeight)
    );
  },

  socketNotificationReceived: function (notification, payload) {
    if (!payload.config || payload.config.moduleId !== this.config.moduleId)
      return;
    switch (notification) {
      case "ERROR":
        this.config.cheatSheet = this.cheatSheetData = null;
        this.error = payload;
        this.updateDom(this.config.animationSpeed);
        break;
      case "UPDATE_CHEAT_SHEET":
        this.error = null;
        this.config.cheatSheet = this.cheatSheetData =
          payload.config.cheatSheet;
        this.updateDom(this.config.animationSpeed);
        break;
      default:
        break;
    }
  },

  isAcceptableSender(sender) {
    if (!sender) return true;
    const acceptableSender = this.config.events.sender;
    return (
      !acceptableSender ||
      acceptableSender === sender.name ||
      acceptableSender === sender.identifier ||
      (Array.isArray(acceptableSender) &&
        (acceptableSender.includes(sender.name) ||
          acceptableSender.includes(sender.identifier)))
    );
  },

  notificationReceived: function (notification, payload, sender) {
    if (!this.isAcceptableSender(sender)) return;

    this.config.events[notification]?.split(" ").each((e) => {
      switch (e) {
        case "CHEAT_SHEET_SCROLL_DOWN":
          if (!this.hidden) this.scrollCheatSheet(1 * (payload || 1));
          break;
        case "CHEAT_SHEET_SCROLL_UP":
          if (!this.hidden) this.scrollCheatSheet(-1 * (payload || 1));
          break;
        case "CHEAT_SHEET_LIST_ITEM_PREVIOUS":
          if (!this.hidden)
            this.sendSocketNotification("GET_PREVIOUS_CHEAT_SHEET_LIST_ITEM", {
              config: this.config
            });
          break;
        case "CHEAT_SHEET_LIST_ITEM_NEXT":
          if (!this.hidden)
            this.sendSocketNotification("GET_NEXT_CHEAT_SHEET_LIST_ITEM", {
              config: this.config
            });
          break;
        case "CHEAT_SHEET_LIST_ITEM_RANDOM":
          if (!this.hidden)
            this.sendSocketNotification("GET_RANDOM_CHEAT_SHEET_LIST_ITEM", {
              config: this.config
            });
          break;
        case "CHEAT_SHEET_RANDOM":
          if (!this.hidden)
            this.sendSocketNotification("GET_RANDOM_CHEAT_SHEET", {
              config: this.config
            });
          break;
        default:
          break;
      }
    });
  },

  suspend: function () {
    this.suspended = true;
    this.sendSocketNotification("SUSPEND", { config: this.config });
  },

  resume: function () {
    if (this.suspended === false) return;
    this.suspended = false;
    this.sendSocketNotification("RESUME", { config: this.config });
  }
});
