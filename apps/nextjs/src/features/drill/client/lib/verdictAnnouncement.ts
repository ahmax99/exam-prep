import { stripInlineMarkdown } from '@/features/drill/lib/inlineMarkdown'
import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'
import type { QuestionType } from '@/lib/prisma'

interface AnnouncementQuestion {
  type: QuestionType
  options: { letter: string; text: string }[]
}

// Composes the sentence a screen-reader hears on submit — the option badges
// and FillInField's reveal text already say this visually, but nothing was
// ever announced (aria-live), so it's restated here as one sentence rather
// than wiring aria-live onto scattered existing markup.
export const buildVerdictAnnouncement = (
  question: AnnouncementQuestion,
  verdict: AnswerVerdict,
  selectedLetters: string[]
): string => {
  // Spoken, not rendered: bank text reaches this sentence as characters, so
  // its markdown delimiters would otherwise be read aloud as punctuation.
  const textFor = (letters: string[]) => {
    const letterSet = new Set(letters)
    return question.options
      .filter((option) => letterSet.has(option.letter))
      .map((option) => stripInlineMarkdown(option.text))
      .join(', ')
  }

  // One top-level switch on the full AnswerVerdict union — not nested under
  // an `if (question.type === 'FILL_IN')` branch — so a fourth verdict value
  // added later fails to compile here instead of silently reusing the wrong
  // branch's wording.
  switch (verdict.verdict) {
    case 'matched':
      return question.type === 'FILL_IN'
        ? 'Correct.'
        : `Correct. ${textFor(verdict.correctLetters)}.`
    case 'wrong':
      return question.type === 'FILL_IN'
        ? `Incorrect. The correct answer is ${verdict.answerDisplay ? stripInlineMarkdown(verdict.answerDisplay) : 'shown below'}.`
        : `Incorrect. You chose ${textFor(selectedLetters)}. The correct answer is ${textFor(verdict.correctLetters)}.`
    case 'no-match':
      return "We couldn't automatically match your answer. Did you have it?"
    default:
      return verdict satisfies never
  }
}
