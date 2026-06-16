import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import PlayerBar from '@/components/PlayerBar'
import Discover from '@/pages/Discover'
import PodcastDetail from '@/pages/PodcastDetail'
import Player from '@/pages/Player'
import Subscriptions from '@/pages/Subscriptions'
import Report from '@/pages/Report'
import Upload from '@/pages/Upload'
import Admin from '@/pages/Admin'
import { usePlayerStore } from '@/stores/playerStore'

function Layout() {
  const location = useLocation()
  const { currentEpisode } = usePlayerStore()

  return (
    <div className="min-h-screen bg-midnight">
      <Sidebar />
      <main
        className={`ml-60 transition-all duration-300 ${
          currentEpisode ? 'pb-24' : ''
        }`}
      >
        <div className="p-8 max-w-6xl mx-auto">
          <div key={location.pathname} className="animate-fade-in">
            <Routes>
              <Route path="/" element={<Discover />} />
              <Route path="/podcast/:id" element={<PodcastDetail />} />
              <Route path="/player/:podcastId/:episodeId" element={<Player />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/report" element={<Report />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </div>
      </main>
      <PlayerBar />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  )
}
