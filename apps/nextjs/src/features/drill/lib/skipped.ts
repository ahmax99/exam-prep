export const selectSkippedIndexes = (
  questionIds: readonly string[],
  isAnswered: (questionId: string) => boolean,
  frontier: number
): number[] =>
  questionIds
    .slice(0, frontier)
    .flatMap((questionId, index) => (isAnswered(questionId) ? [] : [index]))
