![Magic Mirror² displaying a cheat sheet from https://cht.sh](screenshot.png)

# MMM-Ff-cht-sh

[![ISC License](https://img.shields.io/badge/license-ISC-blue.svg)](https://choosealicense.com/licenses/isc)

A module for [MagicMirror²](https://github.com/MichMich/MagicMirror) presenting your most treasured [cheat sheets](https://cht.sh).

## Installation

Navigate to the modules directory of your MagicMirror² installation and clone this repository.

```sh
git clone https://github.com/shin10/MMM-Ff-cht-sh.git
$(
  cd MMM-Ff-cht-sh &&
  npm i
)
```

## Configuration

**Example:**

```js
modules: [
  {
    module: "MMM-Ff-cht-sh",
    position: "fullscreen_above",
    header: "cht.sh",
    config: {
      baseURL: "https://cht.sh/",
      sheets: [
        // some special pages
        { path: ":firstpage" },
        { path: ":firstpage-v1" },
        { path: ":random", style: "default", weight: 10 },
        { path: ":help", options: "qT" },
        { path: ":styles-demo" },

        // some examples
        { path: "bash/:learn" },
        { path: "bash/shortcuts" },
        { path: "bash/forkbomb" },
        { path: "awk" },
        { path: "git/:learn" },
        { path: "tmux" },
        { path: "fzf" },
        { path: "go/hello" },

        // all sources or a specific one
        { path: "tar" },
        { path: "cheat.sheets:tar" },
        { path: "cheat:tar" },
        { path: "tldr:tar" }
      ],
      options: "q",
      style: ["default", "monokai"],
      sequence: null,
      updateOnSuspension: null,
      updateInterval: 1 * 60 * 1000,
      showTitle: false,
      scrollAmount: 1600,
      animationSpeed: 1000,
      loadingCursor: " _",
      events: {
        CHEAT_SHEET_PAGE_UP: "CHEAT_SHEET_PAGE_UP",
        CHEAT_SHEET_PAGE_DOWN: "CHEAT_SHEET_PAGE_DOWN",
        CHEAT_SHEET_LIST_ITEM_PREVIOUS: "CHEAT_SHEET_LIST_ITEM_PREVIOUS",
        CHEAT_SHEET_LIST_ITEM_NEXT: "CHEAT_SHEET_LIST_ITEM_NEXT",
        CHEAT_SHEET_RANDOM_LIST_ITEM: "CHEAT_SHEET_RANDOM_LIST_ITEM",
        CHEAT_SHEET_LIST_ITEM_RANDOM: "CHEAT_SHEET_LIST_ITEM_RANDOM"
      }
    }
  }
];
```

## Config

| **Option**           | **Description**                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseURL`            | Basically that. Doesn't have to be changed unless you're selfhosting.                                                                                                                                                  |
| `sheets`             | The list of cheat sheets to rotate through                                                                                                                                                                             |
| `options`            | The url options `qTcCQ` as described [here](https://cht.sh/:help)                                                                                                                                                      |
| `style`              | Your favourite color theme. You can provide a string, `:random`, or an Array of themes. [Demo](https://cht.sh/:styles-demo)                                                                                            |
| `sequence`           | The direction to loop through the urls list. `null`/`default`, `reverese`, `random`. The weight property `w` of an url item will only be respected if sequence is set to `random`.                                     |
| `updateInterval`     | The duration of the update interval in ms.                                                                                                                                                                             |
| `updateOnSuspension` | If `true` the sheet will wait till the interval timer fired and the module goes to the background. If `false` the sheet will not update as long as in background. If `null` it will update whenever the timer is done. |
| `showTitle`          | A boolean to show/hide the title.                                                                                                                                                                                      |
| `animationSpeed`     | The duration of the page transition.                                                                                                                                                                                   |
| `loadingCursor`      | The Text cursor indicating that the module is loading a cheat sheet. Default is ` &block;` but could be any string.                                                                                                    |
| `scrollAmount`       | The amount of pixels to scroll up/down if the page is too long. Scrolling is controlled through the events listed beneath.                                                                                             |
| `events`             | An object of events to remap if necessary.                                                                                                                                                                             |
| `events.sender`      | If this is set, only events sent by the modules with this id will be processed.                                                                                                                                        |

### Sheet list items

The items in the sheet list need a path. All other properties are optional. The `weight` property will be used if the `CHEAT_SHEET_LIST_ITEM_RANDOM` event is dispatched, or sequence is set to `random`. Options and styles can be set to override the defaults for single items.

```js
{
  path: ":random",
  options: "qTcCQ",
  style: "lovelace",
  weight: 10
}
```

[&pi;](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
