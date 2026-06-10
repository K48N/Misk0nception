import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  showHome?: boolean
}

export default function Breadcrumbs({ items, showHome = true }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
      {showHome && (
        <>
          <Link 
            to="/dashboard" 
            className="hover:text-kit-green transition-colors flex items-center gap-1"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          {items.length > 0 && <ChevronRight className="w-4 h-4" />}
        </>
      )}
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        
        return (
          <div key={index} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link 
                to={item.href}
                className="hover:text-kit-green transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-gray-900 dark:text-gray-100 font-medium' : ''}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </div>
        )
      })}
    </nav>
  )
}
