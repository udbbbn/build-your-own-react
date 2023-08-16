type ElementType = keyof HTMLElementTagNameMap
type ElementProps = Record<string, string | number | null | undefined> | null | undefined
type ElementChildren = Record<string, string | number | null | undefined> | string
const TextElementType = "NODE_ELEMENT"

const Didact = {
  createElement,
}

function createElement(type: ElementType, props: ElementProps, ...children: ElementChildren[]) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  }
}

/**
 * In order to simplify code, we specialise in a function to handle primitive data.
 * React doesn't create primitive value or create empty array when children is null.
 * @param text
 * @returns
 */
function createTextElement(text: string) {
  return {
    type: TextElementType,
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

export default Didact
