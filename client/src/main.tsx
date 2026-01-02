import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')!).render(
  // react 18 ve üstünde bir istek iki defa gidiyomuş. strictmodelar yüzünden. strict modu  u kaldırırsan sorun çözülecekmiş
  <>
    <App />
  </>,
)
