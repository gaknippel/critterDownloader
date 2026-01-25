import { createBrowserRouter } from 'react-router-dom'
import App from './App'  
import Home from './pages/Home/Home'
import About from './pages/About/About'
import Download from './pages/Download/Download'
import Settings from './pages/Settings/Settings'


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'download',
        element: <Download />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
])

export default router