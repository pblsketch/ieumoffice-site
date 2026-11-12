// The question helper's chat window: a button at the bottom right of every page
// that opens a small panel talking to /api/ask (api/ask.js). The conversation
// lives only in this page's memory; nothing is saved in the browser. The server
// keeps each finished turn for 90 days (lib/log.js).

import './ask.css'
import { LANG, localUrl, path, pick } from './i18n.js'

const MAX_QUESTION = 500
const T = pick({
  ko: {
    examples: ['정말 무료인가요?', 'Claude 구독은 어떻게 연결하나요?', '맥에서도 쓸 수 있나요?', '한글 파일도 고칠 수 있나요?'],
    busy: '질문이 몰려서 지금은 답을 만들 수 없어요. 잠시 뒤에 다시 물어봐 주세요.',
    limited: '짧은 시간에 질문이 많았어요. 1분쯤 뒤에 다시 물어봐 주세요.',
    invalid: `질문은 ${MAX_QUESTION}자까지 보낼 수 있어요.`,
    failed: '지금은 답을 만들 수 없어요.',
    launcher: '궁금한 점 묻기',
    title: '이음오피스에 묻기',
    subtitle: '도움말과 안내 페이지에 적힌 내용으로 답해요',
    close: '닫기',
    hello: '설치, AI 연결, 기능 쓰는 법을 물어보세요. 안내 자료에 없는 내용은 없다고 말씀드려요.',
    placeholder: '예: 맥에서도 쓸 수 있나요?',
    question: '질문',
    send: '보내기',
    note: '개인정보나 문서 내용은 적지 마세요. 질문은 답을 만들려고 Anthropic의 Claude로 보내고, 도우미를 고치는 데 쓰려고 질문과 답을 90일 동안 보관해요. 답이 틀릴 수 있어요.',
    more: '자세히',
    searching: '안내 자료를 찾는 중…',
    writing: '답을 쓰는 중…',
    done: '답을 다 썼어요.',
    instead: '대신 이 안내를 읽어 보세요.',
    sources: '참고한 안내',
  },
  en: {
    examples: ['Is it really free?', 'How do I connect my Claude subscription?', 'Does it work on a Mac?', 'Can it edit Hangul (HWP) files?'],
    busy: 'Too many questions are coming in right now. Please ask again in a little while.',
    limited: 'That was a lot of questions in a short time. Please ask again in about a minute.',
    invalid: `Questions can be up to ${MAX_QUESTION} characters.`,
    failed: 'An answer cannot be written right now.',
    launcher: 'Ask a question',
    title: 'Ask about IeumOffice',
    subtitle: 'Answers come from the help and guide pages',
    close: 'Close',
    hello: 'Ask about installing, connecting an AI, or using a feature. If the guides do not cover it, I will say so. The guides are written in Korean, so some source titles and links may be in Korean.',
    placeholder: 'e.g. Does it work on a Mac?',
    question: 'Question',
    send: 'Send',
    note: 'Do not include personal information or document contents. Your question is sent to Anthropic’s Claude to write the answer, and questions and answers are kept for 90 days to improve the helper. Answers can be wrong.',
    more: 'Details',
    searching: 'Looking through the guides…',
    writing: 'Writing the answer…',
    done: 'The answer is complete.',
    instead: 'Try reading these guides instead.',
    sources: 'Guides used',
  },
  ja: {
    examples: ['本当に無料ですか？', 'Claude のサブスクリプションはどう接続しますか？', 'Mac でも使えますか？', 'ハングル（HWP）ファイルも編集できますか？'],
    busy: '質問が集中していて、いまは回答を作れません。しばらくしてからもう一度お尋ねください。',
    limited: '短い時間に質問が続きました。1 分ほどしてからもう一度お尋ねください。',
    invalid: `質問は ${MAX_QUESTION} 文字まで送れます。`,
    failed: 'いまは回答を作れません。',
    launcher: '質問する',
    title: 'IeumOffice について質問',
    subtitle: 'ヘルプと案内ページの内容をもとに答えます',
    close: '閉じる',
    hello: 'インストール、AI の接続、機能の使い方を質問してください。案内資料にないことは、ないとお伝えします。案内資料は韓国語で書かれているため、参考資料の題名やリンク先が韓国語のことがあります。',
    placeholder: '例：Mac でも使えますか？',
    question: '質問',
    send: '送信',
    note: '個人情報や文書の内容は書かないでください。質問は回答を作るために Anthropic の Claude に送られ、アシスタントの改善のため質問と回答を 90 日間保存します。回答が間違っていることもあります。',
    more: '詳しく',
    searching: '案内資料を探しています…',
    writing: '回答を書いています…',
    done: '回答を書き終えました。',
    instead: '代わりにこちらの案内をお読みください。',
    sources: '参考にした案内',
  },
  'zh-TW': {
    examples: ['真的免費嗎？', 'Claude 訂閱要怎麼連接？', 'Mac 上也能用嗎？', '可以編輯 Hangul（HWP）檔案嗎？'],
    busy: '目前提問的人太多，暫時無法回答。請稍後再問一次。',
    limited: '短時間內問了很多問題。請大約一分鐘後再問。',
    invalid: `問題最多可以輸入 ${MAX_QUESTION} 個字。`,
    failed: '目前無法產生回答。',
    launcher: '提出問題',
    title: '詢問 IeumOffice',
    subtitle: '根據說明與指南頁面的內容回答',
    close: '關閉',
    hello: '歡迎詢問安裝、連接 AI、功能用法等問題。指南資料中沒有的內容，我會直接說沒有。指南資料以韓文撰寫，部分參考標題與連結可能是韓文。',
    placeholder: '例如：Mac 上也能用嗎？',
    question: '問題',
    send: '送出',
    note: '請不要輸入個人資料或文件內容。為了產生回答，問題會傳送給 Anthropic 的 Claude；為了改善小幫手，問題與回答會保存 90 天。回答可能有誤。',
    more: '詳細說明',
    searching: '正在查找指南資料…',
    writing: '正在撰寫回答…',
    done: '回答已完成。',
    instead: '可以先看看這些指南。',
    sources: '參考的指南',
  },
  es: {
    examples: ['¿De verdad es gratis?', '¿Cómo conecto mi suscripción de Claude?', '¿Funciona en Mac?', '¿Puede editar archivos de Hangul (HWP)?'],
    busy: 'Están llegando demasiadas preguntas. Vuelve a preguntar dentro de un rato.',
    limited: 'Han sido muchas preguntas en poco tiempo. Vuelve a preguntar dentro de un minuto.',
    invalid: `Las preguntas pueden tener hasta ${MAX_QUESTION} caracteres.`,
    failed: 'Ahora mismo no se puede escribir una respuesta.',
    launcher: 'Hacer una pregunta',
    title: 'Pregunta sobre IeumOffice',
    subtitle: 'Responde con lo que dicen la ayuda y las guías',
    close: 'Cerrar',
    hello: 'Pregunta sobre la instalación, cómo conectar una IA o cómo usar una función. Si las guías no lo cubren, te lo diré. Las guías están escritas en coreano, así que algunos títulos y enlaces de referencia pueden aparecer en coreano.',
    placeholder: 'Ej.: ¿Funciona en Mac?',
    question: 'Pregunta',
    send: 'Enviar',
    note: 'No escribas datos personales ni el contenido de tus documentos. La pregunta se envía a Claude, de Anthropic, para escribir la respuesta, y las preguntas y respuestas se guardan 90 días para mejorar el asistente. Las respuestas pueden contener errores.',
    more: 'Más información',
    searching: 'Buscando en las guías…',
    writing: 'Escribiendo la respuesta…',
    done: 'Respuesta terminada.',
    instead: 'Mientras tanto, puedes leer estas guías.',
    sources: 'Guías consultadas',
  },
})
const EXAMPLES = T.examples
const ERRORS = { busy: T.busy, limited: T.limited, invalid: T.invalid, failed: T.failed }

const history = []
let busy = false

const launcher = el('button', { class: 'ask-launcher', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'ask-panel' })
launcher.innerHTML =
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3M12 16.5h.01"/></svg><span>${T.launcher}</span>`

// a div, not a section: the site styles every section:not(.hero) as a page band
const panel = el('div', { class: 'ask-panel', id: 'ask-panel', role: 'dialog', 'aria-labelledby': 'ask-title', hidden: '' })
panel.innerHTML = `
  <header class="ask-head">
    <div>
      <h2 id="ask-title">${T.title}</h2>
      <p>${T.subtitle}</p>
    </div>
    <button type="button" class="ask-close" aria-label="${T.close}">×</button>
  </header>
  <div class="ask-log">
    <div class="ask-msg ask-bot">
      <p>${T.hello}</p>
    </div>
    <div class="ask-chips"></div>
  </div>
  <p class="ask-status" role="status" aria-live="polite"></p>
  <form class="ask-form">
    <textarea rows="1" maxlength="${MAX_QUESTION}" placeholder="${T.placeholder}" aria-label="${T.question}"></textarea>
    <button type="submit" aria-label="${T.send}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
  </form>
  <p class="ask-note">${T.note} <a href="${path('/privacy.html#ask')}">${T.more}</a></p>`

const log = panel.querySelector('.ask-log')
const status = panel.querySelector('.ask-status')
const form = panel.querySelector('.ask-form')
const input = form.querySelector('textarea')
const send = form.querySelector('button')

for (const text of EXAMPLES) {
  const chip = el('button', { type: 'button', class: 'ask-chip' })
  chip.textContent = text
  chip.addEventListener('click', () => submit(text))
  panel.querySelector('.ask-chips').append(chip)
}

document.body.append(launcher, panel)

launcher.addEventListener('click', () => (panel.hidden ? open() : close()))
panel.querySelector('.ask-close').addEventListener('click', close)
panel.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') close()
})
form.addEventListener('submit', (event) => {
  event.preventDefault()
  submit(input.value)
})
input.addEventListener('keydown', (event) => {
  // Enter sends, Shift+Enter breaks the line; never mid-way through composing Hangul
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    form.requestSubmit()
  }
})
input.addEventListener('input', grow)
if (location.hash === '#ask') open()

function open() {
  panel.hidden = false
  launcher.setAttribute('aria-expanded', 'true')
  document.documentElement.classList.add('ask-open')
  input.focus()
}

function close() {
  panel.hidden = true
  launcher.setAttribute('aria-expanded', 'false')
  document.documentElement.classList.remove('ask-open')
  launcher.focus()
}

function grow() {
  input.style.height = 'auto'
  input.style.height = `${Math.min(input.scrollHeight, 120)}px`
}

async function submit(raw) {
  const question = raw.trim()
  if (!question || busy) return
  if (question.length > MAX_QUESTION) {
    showError(bubble('ask-bot'), 'invalid')
    return
  }
  busy = true
  send.disabled = true
  input.value = ''
  grow()
  panel.querySelector('.ask-chips')?.remove()

  bubble('ask-user').textContent = question
  history.push({ role: 'user', content: question })
  const answer = bubble('ask-bot')
  answer.classList.add('is-waiting')
  answer.innerHTML = `<p class="ask-wait">${T.searching}</p>`
  status.textContent = ''

  let text = ''
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-6) }),
    })
    if (!response.ok || !response.body) {
      const event = await response.json().catch(() => ({}))
      throw Object.assign(new Error('ask'), { code: event.code })
    }
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += value
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines.filter(Boolean)) {
        const event = JSON.parse(line)
        if (event.type === 'found') answer.querySelector('.ask-wait').textContent = T.writing
        else if (event.type === 'text') {
          text += event.text
          answer.classList.remove('is-waiting')
          answer.innerHTML = render(text)
          scrollDown()
        } else if (event.type === 'sources') showSources(answer, event.items)
        else if (event.type === 'error') {
          if (!text) showError(answer, event.code, event.items)
        }
      }
    }
    if (text) history.push({ role: 'assistant', content: text })
    else history.pop()
    status.textContent = text ? T.done : ''
  } catch (error) {
    history.pop()
    showError(answer, error.code)
  } finally {
    busy = false
    send.disabled = false
    scrollDown()
  }
}

function bubble(kind) {
  const node = el('div', { class: `ask-msg ${kind}` })
  log.append(node)
  scrollDown()
  return node
}

function showError(node, code, items = []) {
  node.classList.remove('is-waiting')
  node.innerHTML = `<p>${escape(ERRORS[code] ?? ERRORS.failed)}</p>`
  if (items.length) {
    node.insertAdjacentHTML('beforeend', `<p>${T.instead}</p>`)
    node.append(sourceList(items))
  }
}

function showSources(node, items) {
  if (!items.length) return
  const box = el('div', { class: 'ask-sources' })
  box.innerHTML = `<p>${T.sources}</p>`
  box.append(sourceList(items))
  node.append(box)
  // the [n] marks in the answer link to the same places
  for (const item of items) {
    for (const mark of node.querySelectorAll(`.ask-cite[data-n="${item.n}"]`)) {
      if (!item.url) continue
      const link = el('a', { class: 'ask-cite', href: localUrl(item.url), target: '_blank', rel: 'noopener' })
      link.textContent = mark.textContent
      mark.replaceWith(link)
    }
  }
}

function sourceList(items) {
  const list = el('ul', {})
  for (const item of items) {
    const li = el('li', {})
    const label = LANG === 'ko' ? item.title.replace(/^앱 도움말 › /, '앱 도움말(F1) › ') : item.title
    if (item.url) {
      const link = el('a', { href: localUrl(item.url), target: '_blank', rel: 'noopener' })
      link.textContent = label
      li.append(link)
    } else {
      li.textContent = label
    }
    list.append(li)
  }
  return list
}

/** the answer's small markdown subset, escaped first so nothing it says becomes markup */
function render(markdown) {
  const html = []
  let list = null
  const closeList = () => {
    if (list) html.push(`</${list}>`)
    list = null
  }
  let code = null
  const closeCode = () => {
    if (code) html.push(`<pre><code>${escape(code.join('\n'))}</code></pre>`)
    code = null
  }
  for (const raw of markdown.split('\n')) {
    if (/^\s*```/.test(raw)) {
      closeList()
      if (code) closeCode()
      else code = []
      continue
    }
    if (code) {
      code.push(raw)
      continue
    }
    const line = raw.trim()
    const bullet = line.match(/^[-*•]\s+(.*)$/)
    const numbered = line.match(/^\d+[.)]\s+(.*)$/)
    if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol'
      if (list !== kind) {
        closeList()
        html.push(`<${kind}>`)
        list = kind
      }
      html.push(`<li>${inline((bullet ?? numbered)[1])}</li>`)
    } else if (line) {
      closeList()
      const heading = line.match(/^#{1,4}\s+(.*)$/)
      html.push(heading ? `<p><strong>${inline(heading[1])}</strong></p>` : `<p>${inline(line)}</p>`)
    } else {
      closeList()
    }
  }
  closeList()
  // an answer still streaming may have an open code block
  closeCode()
  return html.join('')
}

function inline(text) {
  return escape(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/(https?:\/\/[^\s<)]+[^\s<).,])/g, (url) => `<a href="${localUrl(url)}" target="_blank" rel="noopener">${url}</a>`)
    .replace(/\[(\d+)\]/g, '<sup class="ask-cite" data-n="$1">$1</sup>')
}

function escape(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function scrollDown() {
  log.scrollTop = log.scrollHeight
}

function el(tag, attrs) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value)
  return node
}
