/** Append STT text to an existing prompt without replacing prior content. */
export function appendPromptText(existing: string, addition: string): string {
  const add = addition.trim();
  if (!add) {
    return existing;
  }
  const base = existing.trimEnd();
  if (!base) {
    return add;
  }
  return `${base} ${add}`;
}
