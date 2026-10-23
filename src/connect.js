// The AI connect help page: a Claude or ChatGPT subscription, or a free AI,
// each as a pointer walkthrough (src/player.js) over a redrawn IeumOffice
// window. The card states follow the app's connect guide (decision 0047).
import './font.css'
import './style.css'
import './ask.js'
import './install.css'
import './connect.css'
import { openDetailsFromHash, setupPlayers } from './player.js'

// install → sign in → connected; the two subscriptions click the same places
const SUBSCRIPTION = [
  { at: [], moves: [{ t: 'path', add: ['open', 'c-install'] }] },
  {
    at: ['open', 'c-install'],
    moves: [{ t: 'install', add: ['term'] }, { wait: 2600, add: ['term-done'] }],
  },
  {
    at: ['open', 'c-install', 'term', 'term-done'],
    moves: [{ t: 'close', remove: ['term', 'term-done', 'c-install'], add: ['c-login'] }],
  },
  {
    at: ['open', 'c-login'],
    moves: [
      { t: 'login', remove: ['c-login'], add: ['c-signing', 'browser'] },
      { t: 'allow', add: ['allowed'] },
    ],
  },
  {
    at: ['open', 'c-signing', 'browser', 'allowed'],
    moves: [
      { wait: 1400, remove: ['browser', 'allowed', 'c-signing', 'open'], add: ['c-ready'] },
      { t: 'model', hover: true },
    ],
  },
]

const SCENES = {
  claude: SUBSCRIPTION,
  codex: SUBSCRIPTION,
  free: [
    { at: [], moves: [{ t: 'path', add: ['open'] }] },
    { at: ['open'], moves: [{ t: 'connect-free', add: ['settings'] }] },
    {
      at: ['open', 'settings'],
      moves: [
        { t: 'or-connect', add: ['or-wait', 'browser'] },
        { t: 'allow', add: ['allowed'] },
      ],
    },
    {
      at: ['open', 'settings', 'or-wait', 'browser', 'allowed'],
      moves: [{ wait: 1400, remove: ['browser', 'allowed', 'or-wait'], add: ['or-on'] }],
    },
  ],
}

setupPlayers(SCENES)
// a link to #login-stuck, #mac … opens that answer
openDetailsFromHash()
