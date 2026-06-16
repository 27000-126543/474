import { NavLink } from 'react-router-dom'
import {
  Compass,
  Library,
  BarChart3,
  Upload,
  Shield,
  Headphones,
  User
} from 'lucide-react'
import NotificationCenter from './NotificationCenter'

const navItems = [
  { path: '/', icon: Compass, label: '发现' },
  { path: '/subscriptions', icon: Library, label: '订阅' },
  { path: '/report', icon: BarChart3, label: '报告' },
  { path: '/upload', icon: Upload, label: '上传' },
  { path: '/admin', icon: Shield, label: '管理员' }
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-deepnavy/90 backdrop-blur-sm border-r border-warmgray-700/30 flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-warmgray-700/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Headphones className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-warmgray-100">
                播客空间
              </h1>
              <p className="text-xs text-warmgray-500">聆听你的世界</p>
            </div>
          </div>
          <NotificationCenter />
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'text-warmgray-400 hover:bg-warmgray-700/20 hover:text-warmgray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-warmgray-700/30">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-warmgray-700/20 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <User className="w-5 h-5 text-midnight" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warmgray-100 truncate">
              聆听者
            </p>
            <p className="text-xs text-warmgray-500 truncate">user@podcast.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
