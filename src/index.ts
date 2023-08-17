type EnumElementType = "NODE_ELEMENT"
type ElementType = keyof HTMLElementTagNameMap | EnumElementType
const TextElementType = "NODE_ELEMENT"
interface ElementProps {
  nodeValue?: string
  children: DidactElement[]
}
type DidactElement = {
  type: ElementType
  props: ElementProps
}

const Didact = {
  createElement,
  render,
}

function createElement(
  type: ElementType,
  props: ElementProps,
  ...children: DidactElement[]
): DidactElement {
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
 * @param text string
 * @returns
 */
function createTextElement(text: string): DidactElement {
  return {
    type: TextElementType,
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

/**
 * We start by creating the element by element type and then append child to the container.
 * @param element DidactElement
 * @param container HTMLElement
 */
function render(element: DidactElement, container: HTMLElement) {
  const dom =
    element.type === TextElementType
      ? document.createTextNode("")
      : document.createElement(element.type)

  /**
   * We also need to assign property to Dom node.
   * @param key keyof ElementProps
   * @returns boolean
   */
  const isProperty = (key: string) => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(key => {
      Reflect.set(dom, key, element.props[key as keyof ElementProps])
    })
  /**
   * And we recursively do the same for each child.
   * The children always an empty array when type is TextElementType.
   */
  element.props.children.forEach(child => {
    render(child, dom as HTMLElement)
  })

  container.appendChild(dom)
}

export default Didact
