type EnumElementType = "NODE_ELEMENT"
type ElementType = keyof HTMLElementTagNameMap | EnumElementType
interface ElementProps {
  nodeValue?: string
  children: DidactElement[]
}
interface Fiber {
  type: ElementType
  props: ElementProps
  dom: HTMLElement | Text | null
  parent: Fiber
  child?: Fiber
  sibling?: Fiber
}
type DidactElement = {
  type: ElementType
  props: ElementProps
}
const TextElementType = "NODE_ELEMENT"

let nextUnitOfWork: any = null

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

function createDom(fiber: Fiber): HTMLElement | Text {
  const dom =
    fiber.type === TextElementType
      ? document.createTextNode("")
      : document.createElement(fiber.type)
  /**
   * We also need to assign property to Dom node.
   * @param key keyof ElementProps
   * @returns boolean
   */
  const isProperty = (key: string) => key !== "children"
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(key => {
      Reflect.set(dom, key, fiber.props[key as keyof ElementProps])
    })
  return dom
}

/**
 * We start by creating the element by element type and then append child to the container.
 * @param element DidactElement
 * @param container HTMLElement
 */
function render(element: DidactElement, container: HTMLElement) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  }
}

/**
 * React use the messagechannel instead of requestIdleCallback.
 * @param deadline
 */
function workLoop(deadline: IdleDeadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  if (fiber.parent) {
    fiber.parent.dom!.appendChild(fiber.dom)
  }
  const elements = fiber.props.children
  let index = 0
  let prevSibling = null

  /**
   * create the Fiber for each child.
   */
  while (index < elements.length) {
    const element = elements[index]
    const newFiber: Fiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }
    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling!.sibling = newFiber
    }
    prevSibling = newFiber
    index++
  }

  /**
   * first dispose of the Child, then with the sibling, last with the sibling of the parent, and repeating.
   */
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

export default Didact
