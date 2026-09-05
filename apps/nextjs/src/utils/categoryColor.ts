type CategoryColor = `var(--category-${number})`

const CATEGORY_COLORS: readonly CategoryColor[] = [
  'var(--category-1)',
  'var(--category-2)',
  'var(--category-3)',
  'var(--category-4)',
  'var(--category-5)'
]

const categoryColors = (keys: readonly string[]) => {
  const assigned = new Map<string, CategoryColor>()
  for (const key of keys) {
    if (assigned.has(key)) continue
    assigned.set(
      key,
      CATEGORY_COLORS[assigned.size % CATEGORY_COLORS.length] ??
        'var(--category-1)'
    )
  }
  return assigned
}

export { categoryColors }
export type { CategoryColor }
