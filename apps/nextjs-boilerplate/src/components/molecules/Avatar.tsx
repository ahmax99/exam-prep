'use client'

import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'

import { cn } from '@/utils/mergeClass'

function Avatar({
  className,
  size = 'default',
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: 'default' | 'sm' | 'lg'
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'group/avatar relative flex size-8 shrink-0 select-none rounded-full after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten',
        className
      )}
      data-size={size}
      data-slot="avatar"
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: Readonly<AvatarPrimitive.Image.Props>) {
  return (
    <AvatarPrimitive.Image
      className={cn(
        'aspect-square size-full rounded-full object-cover',
        className
      )}
      data-slot="avatar-image"
      {...props}
    />
  )
}

export { Avatar, AvatarImage }
