/**
 * Positions in a run's queue that were passed over without being answered,
 * in run order.
 *
 * `frontier` is the furthest position reached, never the current one — jumping
 * back into the list must not make the entries after the landing spot vanish.
 * A finished run's frontier is the whole queue; a live one's is how far it has
 * actually got, because a question you haven't reached yet wasn't skipped.
 */
export const selectSkippedIndexes = (
  questionIds: readonly string[],
  isAnswered: (questionId: string) => boolean,
  frontier: number
): number[] =>
  questionIds
    .slice(0, frontier)
    .flatMap((questionId, index) => (isAnswered(questionId) ? [] : [index]))
