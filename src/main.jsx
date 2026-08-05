import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { GlobalProvider } from './context/GlobalState'
import 'driver.js/dist/driver.css'
import './index.css'
import { TourProvider } from './context/TourContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <GlobalProvider>
      <TourProvider>
        <App />
      </TourProvider>
    </GlobalProvider>
  </BrowserRouter>
)
