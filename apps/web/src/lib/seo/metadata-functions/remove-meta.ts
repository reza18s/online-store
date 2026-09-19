export function removeMeta(document: Document, key: 'name' | 'property', value: string): void {
  document.head.querySelectorAll(`meta[${key}="${value}"]`).forEach((element) => element.remove());
}
