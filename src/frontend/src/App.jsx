import {
  Routes, Route,
} from 'react-router';
import EventPage from './EventPage.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import './App.css'

function App() {

  return (
    <Routes>
      <Route path="event">
        <Route path=":eventId" element={<EventPage />} />
        <Route path="" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
