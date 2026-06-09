import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Restore path from GitHub Pages 404 redirect
const params = new URLSearchParams(window.location.search)
const redirectPath = params.get('p')
if (redirectPath) {
  window.history.replaceState(null, '', redirectPath)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/pixelfactory">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
