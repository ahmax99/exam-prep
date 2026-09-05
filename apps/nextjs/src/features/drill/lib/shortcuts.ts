export interface Shortcut {
  combo: string
  description: string
}

export interface ShortcutContext {
  optionLetters: string[]
  isAnswered: boolean
  canGoPrevious: boolean
  isSelfGrading: boolean
  hasSkipped: boolean
}

export const boundShortcuts = ({
  optionLetters,
  isAnswered,
  canGoPrevious,
  isSelfGrading,
  hasSkipped
}: ShortcutContext): Shortcut[] => [
  ...(optionLetters.length > 0
    ? [{ combo: 'A–Z', description: 'Select an option' }]
    : []),
  { combo: '↵', description: isAnswered ? 'Next question' : 'Submit' },
  ...(canGoPrevious ? [{ combo: '⌫', description: 'Previous question' }] : []),
  { combo: 'S', description: 'Skip' },
  ...(hasSkipped && !optionLetters.includes('L')
    ? [{ combo: 'L', description: 'Skipped questions' }]
    : []),
  ...(optionLetters.includes('B')
    ? []
    : [{ combo: 'B', description: 'Bookmark' }]),
  ...(isSelfGrading
    ? [
        { combo: 'Y', description: 'Had it' },
        { combo: 'N', description: 'Missed it' }
      ]
    : []),
  { combo: '?', description: 'This legend' }
]

export interface BindingContext {
  isAnswered: boolean
  isBlocked: boolean
  canGoPrevious: boolean
}

export interface ShortcutActions {
  goNext: () => void
  submit: () => void
  openSkippedList: () => void
  goPrevious: () => void
  selfGrade: (hadIt: boolean) => void
}

const noop = () => {}

export const bindShortcuts = (
  { isAnswered, isBlocked, canGoPrevious }: BindingContext,
  actions: ShortcutActions
) => ({
  onPrimary: isBlocked ? noop : isAnswered ? actions.goNext : actions.submit,
  onSkip: isBlocked ? noop : actions.goNext,
  onSkippedList: isBlocked ? noop : actions.openSkippedList,
  onSelfGradeHadIt: isBlocked ? () => actions.selfGrade(true) : undefined,
  onSelfGradeMissedIt: isBlocked ? () => actions.selfGrade(false) : undefined,
  onPrevious: canGoPrevious ? actions.goPrevious : undefined
})
