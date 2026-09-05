export const isTextEntryTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest(
    'input:not([type=radio]):not([type=checkbox]), textarea, select, [contenteditable="true"]'
  ) !== null
