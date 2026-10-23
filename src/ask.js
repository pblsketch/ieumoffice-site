// The question helper's chat window: a button at the bottom right of every page
// that opens a small panel talking to /api/ask (api/ask.js). The conversation
// lives only in this page's memory; nothing is saved in the browser.

import './ask.css'

const EXAMPLES = ['정말 무료인가요?', 'Claude 구독은 어떻게 연결하나요?', '맥에서도 쓸 수 있나요?', '한글 파일도 고칠 수 있나요?']
const MAX_QUESTION = 500
const ERRORS = {
  busy: '질문이 몰려서 지금은 답을 만들 수 없어요. 잠시 뒤에 다시 물어봐 주세요.',
  limited: '짧은 시간에 질문이 많았어요. 1분쯤 뒤에 다시 물어봐 주세요.',
  invalid: `질문은 ${MAX_QUESTION}자까지 보낼 수 있어요.`,
  failed: '지금은 답을 만들 수 없어요.',
}

const history = []
let busy = false

const launcher = el('button', { class: 'ask-launcher', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'ask-panel' })
launcher.innerHTML =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3M12 16.5h.01"/></svg><span>궁금한 점 묻기</span>'

// a div, not a section: the site styles every section:not(.hero) as a page band
const panel = el('div', { class: 'ask-panel', id: 'ask-panel', role: 'dialog', 'aria-labelledby': 'ask-title', hidden: '' })
panel.innerHTML = `
  <header class="ask-head">
    <div>
      <h2 id="ask-title">이음오피스에 묻기</h2>
      <p>도움말과 안내 페이지에 적힌 내용으로 답해요</p>
    </div>
    <button type="button" class="ask-close" aria-label="닫기">×</button>
  </header>
  <div class="ask-log">
    <div class="ask-msg ask-bot">
      <p>설치, AI 연결, 기능 쓰는 법을 물어보세요. 안내 자료에 없는 내용은 없다고 말씀드려요.</p>
    </div>
    <div class="ask-chips"></div>
  </div>
  <p class="ask-status" role="status" aria-live="polite"></p>
  <form class="ask-form">
    <textarea rows="1" maxlength="${MAX_QUESTION}" placeholder="예: 맥에서도 쓸 수 있나요?" aria-label="질문"></textarea>
    <button type="submit" aria-label="보내기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
  </form>
  <p class="ask-note">개인정보나 문서 내용은 적지 마세요. 질문은 답을 만들기 위해 Anthropic의 Claude로 보내고, 저장하지 않아요. 답이 틀릴 수 있어요. <a href="/privacy.html#ask">자세히</a></p>`

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
  answer.innerHTML = '<p class="ask-wait">안내 자료를 찾는 중…</p>'
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
        if (event.type === 'found') answer.querySelector('.ask-wait').textContent = '답을 쓰는 중…'
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
    status.textContent = text ? '답을 다 썼어요.' : ''
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
    node.insertAdjacentHTML('beforeend', '<p>대신 이 안내를 읽어 보세요.</p>')
    node.append(sourceList(items))
  }
}

function showSources(node, items) {
  if (!items.length) return
  const box = el('div', { class: 'ask-sources' })
  box.innerHTML = '<p>참고한 안내</p>'
  box.append(sourceList(items))
  node.append(box)
  // the [n] marks in the answer link to the same places
  for (const item of items) {
    for (const mark of node.querySelectorAll(`.ask-cite[data-n="${item.n}"]`)) {
      if (!item.url) continue
      const link = el('a', { class: 'ask-cite', href: item.url, target: '_blank', rel: 'noopener' })
      link.textContent = mark.textContent
      mark.replaceWith(link)
    }
  }
}

function sourceList(items) {
  const list = el('ul', {})
  for (const item of items) {
    const li = el('li', {})
    const label = item.title.replace(/^앱 도움말 › /, '앱 도움말(F1) › ')
    if (item.url) {
      const link = el('a', { href: item.url, target: '_blank', rel: 'noopener' })
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
    .replace(/(https?:\/\/[^\s<)]+[^\s<).,])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
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
