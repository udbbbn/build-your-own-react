type EnumElementType = "NODE_ELEMENT"
type ElementType = keyof HTMLElementTagNameMap | EnumElementType
interface ElementProps {
  nodeValue?: string
  children: DidactElement[]
  [key: string]: any
}
interface Fiber {
  type: ElementType
  props: ElementProps
  dom: HTMLElement | Text | null
  alternate?: Fiber | null
  parent: Fiber
  child?: Fiber
  sibling?: Fiber
  effectTag?: "UPDATE" | "PLACEMENT" | "DELETION"
}
type DidactElement = {
  type: ElementType
  props: ElementProps
}
const TextElementType = "NODE_ELEMENT"

let nextUnitOfWork: Fiber | null = null
/**
 * work in progress root.
 * remain reference of root node.
 */
let wipRoot: Fiber | null = null
/**
 * The fiber that we committed to the Dom in the previous commit phase.
 */
let currentRoot: Fiber | null = null

let delections: Fiber[] = []

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

  updateDom(
    dom,
    {
      children: [],
    },
    fiber.props
  )
  return dom
}

/**
 * We start by creating the element by element type and then append child to the container.
 * @param element DidactElement
 * @param container HTMLElement
 */
function render(element: DidactElement, container: HTMLElement) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  } as unknown as Fiber
  delections = []
  nextUnitOfWork = wipRoot
}

function commitRoot() {
  delections.forEach(commitWork)
  commitWork(wipRoot!.child!)
  currentRoot = wipRoot
  wipRoot = null
}

/**
 * Equally, the sequence of recursive is child, sibling and finally is sibling of parent.
 * @param fiber
 * @returns
 */
function commitWork(fiber: Fiber) {
  if (!fiber) return
  const parentDom = fiber.parent.dom
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    parentDom?.appendChild(fiber.dom!)
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props)
  } else if (fiber.effectTag === "DELETION") {
    parentDom?.removeChild(fiber.dom!)
  }
  commitWork(fiber.child!)
  commitWork(fiber.sibling!)
}

const isEvent = (key: string) => key.startsWith("on")
const isProperty = (key: string) => key !== "children" && !isEvent(key)
const isNew = (prev: Fiber["props"], next: Fiber["props"]) => (key: string) =>
  prev[key] !== next[key]
const isGone = (prev: Fiber["props"], next: Fiber["props"]) => (key: string) => !(key in next)
function updateDom(dom: Fiber["dom"], prevProps: Fiber["props"], nextProps: Fiber["props"]) {
  /* remove or changed event listeners */
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom?.removeEventListener(eventType, prevProps[name])
    })
  /* remove old properties */
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      ;(dom as any)[name] = ""
    })
  /* set new or changed properties */
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      ;(dom as any)[name] = nextProps[name]
    })
  /* add event listeners */
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom?.addEventListener(eventType, nextProps[name])
    })
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

  /**
   * Once the link table loop success, recursively append to Dom.
   */
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber: Fiber): Fiber | null {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  const elements = fiber.props.children
  reconcileChildren(fiber, elements)
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
    nextFiber = nextFiber.parent!
  }
  return null
}

function reconcileChildren(wipFiber: Fiber, elements: Fiber["props"]["children"]) {
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null

  /**
   * create the Fiber for each child.
   */
  while (index < elements.length || oldFiber !== null) {
    const element = elements[index]
    let newFiber: Fiber | null = null
    // TODO compare oldFiber to Element
    const sameType = oldFiber && element && oldFiber.type === element.type
    if (sameType) {
      /* only update with new props */
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        dom: oldFiber!.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if (element && !sameType) {
      /* adding new element */
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    if (oldFiber && !sameType) {
      /* remove old fiber */
      oldFiber.effectTag = "DELETION"
      delections.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }
    if (index === 0) {
      wipFiber.child = newFiber!
    } else {
      prevSibling!.sibling = newFiber!
    }
    prevSibling = newFiber
    index++
  }
}

export default Didact
