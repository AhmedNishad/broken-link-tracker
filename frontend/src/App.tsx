import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import Main from './components/Main/Main'
import Loader from './components/Loader/Loader'

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import background from "./images/back-main-2x.jpeg";
import Results from './components/Results/Results'

function App() {

  return (
      <div  className="App">
        <BrowserRouter>
          <Routes>
              <Route path="/" element={<Main />}> </Route>
              <Route path="loading" element={<Loader />}></Route>
              <Route path="results" element={<Results />}></Route>
          </Routes>
        </BrowserRouter>
      </div>
  )
}

export default App;
