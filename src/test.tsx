import Didact from "./index"

function App(props: Record<string, any>) {
  return (
    <div id="foo">
      <a>bar</a>
      <b />
      <input
        onInput={e => {
          console.log(e.srcElement.value)
        }}
      ></input>
    </div>
  )
}

Didact.render(<App />, document.querySelector("#app")!)

export default {}
