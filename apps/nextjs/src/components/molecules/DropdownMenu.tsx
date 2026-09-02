'use client'

import { Menu as MenuPrimitive } from '@base-ui/react/menu'

import { cn } from '@/utils/mergeClass'

function DropdownMenu({ ...props }: Readonly<MenuPrimitive.Root.Props>) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({
  ...props
}: Readonly<MenuPrimitive.Trigger.Props>) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  className,
  side = 'bottom',
  sideOffset = 4,
  align = 'end',
  alignOffset = 0,
  children,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  >) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          className={cn(
            'w-fit min-w-[8rem] origin-(--transform-origin) rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
            className
          )}
          data-slot="dropdown-menu-content"
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: Readonly<MenuPrimitive.RadioGroup.Props>) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: Readonly<MenuPrimitive.RadioItem.Props>) {
  return (
    <MenuPrimitive.RadioItem
      className={cn(
        'flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground',
        className
      )}
      data-slot="dropdown-menu-radio-item"
      {...props}
    >
      <MenuPrimitive.RadioItemIndicator
        className="flex size-3.5 items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <span className="size-1.5 rounded-full bg-current" />
      </MenuPrimitive.RadioItemIndicator>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
}
