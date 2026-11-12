// The sentence the question helper starts with when its material has no answer,
// one per site language. The prompt (lib/qa.js) asks for it word for word and the
// log (lib/log.js) reads it back to mark the row "자료에 없음".

export const NO_ANSWER = {
  ko: '제가 가진 안내 자료에는 그 내용이 없어요.',
  en: 'My guide material does not cover that.',
  ja: '私の手元の案内資料には、その内容がありません。',
  'zh-TW': '我手上的指南資料沒有這項內容。',
  es: 'Mis guías no cubren eso.',
}

/** whether an answer opens with (or contains) one of the sentences above */
export function saysNoAnswer(answer) {
  // the Korean check stays loose: older prompts let the model end the sentence differently
  return answer.includes('제가 가진 안내 자료에는') || Object.values(NO_ANSWER).some((s) => answer.includes(s))
}
