import { useState } from "react";
import NavBar from "./components/Navigation.jsx";
import Router from "./routes/Router.jsx";

function App() {
  return (
    <>
      <Router />
      <NavBar />
    </>
  );
}

export default App;
