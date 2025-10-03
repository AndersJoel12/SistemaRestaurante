import { useState } from "react";
import NavBar from "./components/Navigation.jsx";
import Router from "./routes/Router.jsx";
import Menu from "./views/Menu.jsx";

function App() {
  return (
    <>
      <Menu />
      <NavBar />
      <Router />
    </>
  );
}

export default App;
