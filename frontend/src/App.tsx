import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import Main from './components/Main/Main'
import Loader from './components/Loader/Loader'
import Results from './components/Results/Results'

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import background from "./images/back-main-2x.jpeg";

function App() {

  return (
      <div  className="App">
        <BrowserRouter>
          <Routes>
              <Route path="/" element={<Main />}> </Route>
              <Route path="loading" element={<Loader />}></Route>
              <Route path="results" >
                <Route path=":requestId" element={<Results />}/>
              </Route>
          </Routes>
        </BrowserRouter>
      </div>
  )
}

export default App;
