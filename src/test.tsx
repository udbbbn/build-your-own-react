import Didact from "./index"

function App(props: Record<string, any>) {
  const [state, setState] = Didact.useState(0)
  return (
    <div id="foo">
      <a>bar</a>
      <br />
      {state}
      <b />
      <input
        onInput={e => {
          setState(e.srcElement.value)
        }}
      ></input>
    </div>
  )
}

Didact.render(<App />, document.querySelector("#app")!)

export default {}
