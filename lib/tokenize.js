// Korean words carry endings ("저장하려면", "맥에서"), so Hangul runs are indexed
// as single syllables and two-syllable pairs; the pair "저장" then matches
// "저장하려면". Syllables that are mostly endings and particles are left out.
const HANGUL = /\p{Script=Hangul}/u
const ENDINGS = new Set('이가은는을를에의도로와과서요다고나하한할해수있것그및등더또때니면며게지기어아'.split(''))
const ENGLISH_STOPWORDS = new Set(
  'a an the is are was be been can could do does did i it its on in to of for and or my me you your we our with this that what how when where which who why will would should not no if as at by from so there here use using'.split(' '),
)

export function tokenize(raw) {
  const tokens = new Set()
  const text = String(raw ?? '').normalize('NFKC').toLowerCase()
  for (const word of text.match(/[\p{L}\p{N}]+/gu) ?? []) {
    for (const part of word.match(/\p{Script=Hangul}+|[^\p{Script=Hangul}]+/gu)) {
      if (HANGUL.test(part)) {
        for (const syllable of part) if (!ENDINGS.has(syllable)) tokens.add(syllable)
        for (let i = 0; i + 1 < part.length; i++) tokens.add(part.slice(i, i + 2))
      } else if ((part.length > 1 || /\d/.test(part)) && !ENGLISH_STOPWORDS.has(part)) {
        tokens.add(part)
      }
    }
  }
  return [...tokens]
}
