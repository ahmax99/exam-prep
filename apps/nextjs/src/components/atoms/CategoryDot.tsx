import type { CategoryColor } from '@/utils/categoryColor'
import { cn } from '@/utils/mergeClass'

interface CategoryDotProps {
  color: CategoryColor
  className?: string
}

const CategoryDot = ({ color, className }: Readonly<CategoryDotProps>) => (
  <span
    aria-hidden="true"
    className={cn('size-2 shrink-0 rounded-full', className)}
    data-slot="category-dot"
    style={{ backgroundColor: color }}
  />
)

export { CategoryDot }
