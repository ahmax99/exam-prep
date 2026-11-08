'use client'

import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'

import { cn } from '@/utils/mergeClass'

function AlertDialog({ ...props }: Readonly<AlertDialogPrimitive.Root.Props>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: Readonly<AlertDialogPrimitive.Trigger.Props>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogContent({
  className,
  children,
  ...props
}: Readonly<AlertDialogPrimitive.Popup.Props>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        className="fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs"
        data-slot="alert-dialog-overlay"
      />
      <AlertDialogPrimitive.Popup
        className={cn(
          'bg-popover text-popover-foreground border-border fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border p-6 text-sm transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
          className
        )}
        data-slot="alert-dialog-content"
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  )
}

function AlertDialogTitle({
  className,
  ...props
}: Readonly<AlertDialogPrimitive.Title.Props>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn('text-foreground text-base font-semibold', className)}
      data-slot="alert-dialog-title"
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: Readonly<AlertDialogPrimitive.Description.Props>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('text-muted-foreground text-sm leading-[1.55]', className)}
      data-slot="alert-dialog-description"
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      data-slot="alert-dialog-footer"
      {...props}
    />
  )
}

function AlertDialogClose({
  ...props
}: Readonly<AlertDialogPrimitive.Close.Props>) {
  return (
    <AlertDialogPrimitive.Close data-slot="alert-dialog-close" {...props} />
  )
}

export {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger
}
