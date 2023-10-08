import Didact from "./index"

const element: any = (
  <div id="foo">
    <a>bar</a>
    <b />
    <input
      key={Math.random()}
      onInput={e => {
        console.log(e.srcElement.value)
      }}
    ></input>
  </div>
)

Didact.render(element, document.querySelector("#app")!)

export default {}
