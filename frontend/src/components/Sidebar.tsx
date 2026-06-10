import { NavLink } from 'react-router-dom'
import {
  Home,
  BookOpen,
  CreditCard,
  BarChart3,
  Settings,
  Brain,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', to: '/', icon: Home },
  { name: 'Courses', to: '/courses', icon: BookOpen },
  { name: 'Flashcards', to: '/flashcards', icon: CreditCard },
  { name: 'Quiz', to: '/quiz', icon: Brain },
  { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  { name: 'Settings', to: '/settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-kit-green">Misk0nception</h1>
      </div>
      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-kit-green text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
