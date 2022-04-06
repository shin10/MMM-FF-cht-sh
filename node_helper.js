/* Magic Mirror
 * Module: MMM-FF-cht-sh
 *
 * By Michael Trenkler
 * ISC Licensed.
 */

const NodeHelper = require("node_helper");
const SheetFetcher = require("./sheetFetcher.js");

module.exports = NodeHelper.create({
  fetcherInstances: [],

  start: function () {
    console.log("Starting node helper: " + this.name);
  },

  getFetcher: function (config) {
    let instance = this.fetcherInstances.filter(
      (instance) => instance.moduleId === config.moduleId
    )[0];
    if (!instance) {
      instance = new SheetFetcher(this, config);
      this.fetcherInstances.push(instance);
    }
    return instance;
  },

  socketNotificationReceived: function (notification, payload) {
    if (!payload.config) return;

    const fetcher = this.getFetcher(payload.config);

    switch (notification) {
      case "GET_INITIAL_CHEAT_SHEET":
        fetcher.getInitialCheatSheet();
        break;
      case "GET_PREVIOUS_CHEAT_SHEET_LIST_ITEM":
        fetcher.getPreviousCheatSheet();
        break;
      case "GET_NEXT_CHEAT_SHEET_LIST_ITEM":
        fetcher.getNextCheatSheet();
        break;
      case "GET_RANDOM_CHEAT_SHEET_LIST_ITEM":
        fetcher.getRandomCheatSheetListItem();
        break;
      case "GET_RANDOM_CHEAT_SHEET":
        fetcher.getRandomCheatSheet();
        break;
      case "GET_CHEAT_SHEET":
        fetcher.getCheatSheet(payload.sheet);
        break;
      case "SUSPEND":
        fetcher.suspend();
        break;
      case "RESUME":
        fetcher.resume();
        break;
      default:
        break;
    }
  }
});
