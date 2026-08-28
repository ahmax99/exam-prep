export const sanitizeFilename = (filename: string) =>
  filename
    .replaceAll(/[/\\]/g, '') // remove path separators
    .replaceAll('\0', '') // remove null bytes
    .replaceAll('..', '') // remove directory traversal
    .replaceAll(/[^\w.-]/g, '_') // replace unsafe chars with underscore
    .replaceAll(/_{2,}/g, '_') // collapse consecutive underscores
