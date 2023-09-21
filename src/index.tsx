import { createRoot } from 'react-dom/client'
import './styles.css'
import App from '../../../.emacs.d/backup/!home!alex!source!buerli-2d-demo!src!App.tsx~'

const rootElement = document.getElementById('root')
if (rootElement){
  createRoot(rootElement).render(<App />)
}
