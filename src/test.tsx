import Didact from "./index"

const element: any = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)

Didact.render(element, document.querySelector("#app")!)

export default {}
