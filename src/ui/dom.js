export function el(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (name === 'onClick') {
      element.addEventListener('click', value);
    } else if (value !== undefined && value !== false) {
      element.setAttribute(name, value === true ? '' : value);
    }
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}

export function replaceContent(container, children) {
  container.replaceChildren(...[].concat(children));
}
