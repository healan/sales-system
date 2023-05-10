import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from './component/login';
import Home from './component/home';
import Product from "./component/Product.js";
// import Bom from './component/Bom';
function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />}></Route>
          <Route path="/home" element={<Home />}></Route>
          <Route path="/product" element={<Product />}></Route>
          {/* <Route path="/bom" element={<Bom />}></Route> */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
