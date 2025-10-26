import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary.jsx'
import './index.css'
import App from './App.jsx'
import './views/ViewStyles.css'


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>,
)

/* createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
 */