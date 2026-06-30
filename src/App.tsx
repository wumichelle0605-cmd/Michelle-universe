import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Reading from './pages/Reading'
import DailyFortune from './pages/DailyFortune'
import Diary from './pages/Diary'
import Dashboard from './pages/Dashboard'
import Influencers from './pages/Influencers'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/reading" element={<Reading />} />
        <Route path="/daily" element={<DailyFortune />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/influencers" element={<Influencers />} />
      </Route>
    </Routes>
  )
}
