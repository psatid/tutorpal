// Fixture approximation only: scale viewport conditions, never layout properties.
export function scaleViewportQueries(text, css = false) {
  const scale = query => query
    .replace(/((?:min|max)-(?:width|height)\s*:\s*)([\d.]+)px/g, (_, prefix, value) => prefix + Number(value) * 2 + 'px')
    .replace(/((?:width|height)\s*[<>]=?\s*)([\d.]+)px/g, (_, prefix, value) => prefix + Number(value) * 2 + 'px');
  return css ? text.replace(/(@media\s*)([^{}]+)(?=\{)/g, (_, prefix, query) => prefix + scale(query)) : scale(text);
}
