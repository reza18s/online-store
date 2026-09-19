export function upsertMeta(
  document: Document,
  key: 'name' | 'property',
  value: string,
  content: string,
) {
  const selector = `meta[${key}="${key === 'name' ? value : value}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(key, value);
    element.dataset.novaSeo = 'true';
    document.head.append(element);
  }
  element.content = content;
}
