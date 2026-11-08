// Returns rows in the order of `ids`, dropping ids with no matching row.
export const orderByIds = <Row extends { id: string }>(
  ids: readonly string[],
  rows: readonly Row[]
): Row[] => {
  const byId = new Map(rows.map((row) => [row.id, row]))
  return ids.flatMap((id) => {
    const row = byId.get(id)
    return row ? [row] : []
  })
}
