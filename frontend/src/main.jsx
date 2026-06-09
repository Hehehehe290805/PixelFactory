import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import 'drag-drop-touch'  // polyfill: makes HTML5 drag-drop work on touch screens

// Restore path from GitHub Pages 404 redirect
const params = new URLSearchParams(window.location.search)
const redirectPath = params.get('p')
if (redirectPath) {
  window.history.replaceState(null, '', redirectPath)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/PixelFactory">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
