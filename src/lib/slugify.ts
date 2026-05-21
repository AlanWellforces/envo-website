export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // drop non-word, non-space, non-dash
    .replace(/[\s_-]+/g, '-')   // collapse runs of space/underscore/dash
    .replace(/^-+|-+$/g, '')    // trim leading/trailing dashes
}
