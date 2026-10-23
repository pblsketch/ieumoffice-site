// The install help page: Edge, SmartScreen, finding the file and the
// installer, each as a pointer walkthrough (src/player.js).
import './font.css'
import './style.css'
import './ask.js'
import './install.css'
import { wireDownload } from './release.js'
import { openDetailsFromHash, setupPlayers } from './player.js'

const SCENES = {
  edge: [
    { at: [], moves: [{ t: 'site-btn', add: ['flyout'] }] },
    {
      at: ['flyout'],
      moves: [
        { t: 'item', hover: true, add: ['hover'] },
        { t: 'more', add: ['menu'] },
      ],
    },
    { at: ['flyout', 'hover', 'menu'], moves: [{ t: 'keep', remove: ['menu', 'hover'], add: ['dialog'] }] },
    { at: ['flyout', 'dialog'], moves: [{ t: 'showmore', add: ['more'] }] },
    { at: ['flyout', 'dialog', 'more'], moves: [{ t: 'continue', remove: ['dialog', 'more'], add: ['kept'] }] },
    { at: ['flyout', 'kept'], moves: [{ t: 'open', add: ['opened'] }] },
  ],
  'pc-protect': [
    { at: [], moves: [{ t: 'moreinfo', add: ['info'] }] },
    {
      at: ['info'],
      moves: [
        { t: 'publisher', hover: true },
        { t: 'run', add: ['ran'] },
      ],
    },
  ],
  'find-file': [
    { at: [], moves: [{ keys: ['Ctrl', 'J'], add: ['flyout'] }] },
    { at: ['flyout'], moves: [{ t: 'open', add: ['opened'] }] },
    {
      at: ['flyout'],
      moves: [
        { t: 'folder', remove: ['flyout'], add: ['explorer'] },
        { t: 'exfile', dbl: true, add: ['exopen'] },
      ],
    },
  ],
  installer: [
    {
      at: [],
      moves: [
        { t: 'me', hover: true },
        { t: 'next', add: ['dir'] },
      ],
    },
    { at: ['dir'], moves: [{ t: 'install', remove: ['dir'], add: ['progress'] }] },
    { at: ['progress'], moves: [{ wait: 2800, remove: ['progress'], add: ['finish'] }] },
    {
      at: ['finish'],
      moves: [
        { t: 'launch', hover: true },
        { t: 'finish', add: ['done'] },
      ],
    },
  ],
}

setupPlayers(SCENES)
// a link to #mac or #linux opens that guide
openDetailsFromHash()
wireDownload()
