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

/**
 * The shortcuts bound right now, in legend order. Both surfaces that document
 * the keyboard model render this list and nothing else, so a combo can never be
 * advertised without being bound (or bound without being advertised) — the
 * caller derives the context once, from the same expressions useDrillKeys gets.
 *
 * A combo that collides with a visible option letter belongs to the option: B
 * and L drop out of the legend exactly when the handler stops answering them.
 */
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

/**
 * What each bound shortcut actually runs, over the same context `boundShortcuts`
 * renders — the two halves of the keyboard model live together so a combo can't
 * be advertised without being bound.
 *
 * `isBlocked` (a no-match verdict awaiting its self-grade) neutralises every
 * navigation key rather than unbinding it: the run must not advance past a
 * question whose attempt hasn't been written, and Y/N are the only way out.
 */
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
