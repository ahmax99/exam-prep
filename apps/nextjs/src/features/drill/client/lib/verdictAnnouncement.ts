import { stripInlineMarkdown } from '@/features/drill/lib/inlineMarkdown'
import type { AnswerVerdict } from '@/features/drill/schemas/answerVerdict.schema'
import type { QuestionType } from '@/lib/prisma'

interface AnnouncementQuestion {
  type: QuestionType
  options: { letter: string; text: string }[]
}

export const buildVerdictAnnouncement = (
  question: AnnouncementQuestion,
  verdict: AnswerVerdict,
  selectedLetters: string[]
): string => {
  const textFor = (letters: string[]) => {
    const letterSet = new Set(letters)
    return question.options
      .filter((option) => letterSet.has(option.letter))
      .map((option) => stripInlineMarkdown(option.text))
      .join(', ')
  }

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

interface LiveAnnouncementInput {
  question: AnnouncementQuestion | undefined
  verdict: AnswerVerdict | null
  selfGradeOutcome: 'had-it' | 'missed-it' | null
  selectedLetters: string[]
  hasNavigated: boolean
  position: string
}

const SELF_GRADE_ANNOUNCEMENTS: Record<'had-it' | 'missed-it', string> = {
  'had-it': 'Recorded: had it.',
  'missed-it': 'Recorded: missed it.'
}

export const buildLiveAnnouncement = ({
  question,
  verdict,
  selfGradeOutcome,
  selectedLetters,
  hasNavigated,
  position
}: LiveAnnouncementInput): string => {
  if (selfGradeOutcome) return SELF_GRADE_ANNOUNCEMENTS[selfGradeOutcome]
  if (verdict && question)
    return buildVerdictAnnouncement(question, verdict, selectedLetters)
  return hasNavigated ? position : ''
}
