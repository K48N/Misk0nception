import { useQuery } from '@tanstack/react-query'
import { courseService } from '../services/courseService'
import { noteService } from '../services/noteService'
import { BookOpen, FileText, CreditCard, TrendingUp } from 'lucide-react'
import AnimatedCounter from '../components/AnimatedCounter'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getAll,
  })

  const { data: notes } = useQuery({
    queryKey: ['notes'],
    queryFn: () => noteService.getAll(),
  })

  const totalNotes = notes?.length || 0
  const totalCourses = courses?.length || 0

  const recentNotes = notes?.slice(0, 5) || []

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-kit-green/10 rounded-lg">
              <FileText className="w-5 h-5 text-kit-green" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Notes
            </h3>
          </div>
          <p className="text-3xl font-bold"><AnimatedCounter value={totalNotes} duration={900} /></p>
        </div>
        
          <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-kit-blue/20 shadow-inner rounded-xl">
              <BookOpen className="w-5 h-5 text-kit-blue" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Courses
            </h3>
          </div>
          <p className="text-3xl font-bold"><AnimatedCounter value={totalCourses} duration={900} /></p>
        </div>
        
          <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-kit-orange/20 shadow-inner rounded-xl">
              <CreditCard className="w-5 h-5 text-kit-orange" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Flashcards
            </h3>
          </div>
          <p className="text-3xl font-bold"><AnimatedCounter value={0} duration={900} /></p>
        </div>
        
          <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-kit-green-light/20 shadow-inner rounded-xl">
              <TrendingUp className="w-5 h-5 text-kit-green-light" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Study Streak
            </h3>
          </div>
          <p className="text-3xl font-bold"><AnimatedCounter value={0} duration={900} /> days</p>
        </div>
      </div>

      {recentNotes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Notes</h2>
          <div className="space-y-3">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  const course = courses?.find((c) => c.id === note.course_id)
                  if (course) {
                    navigate(`/courses/${course.id}/notes/${note.id}`)
                  }
                }}
                  className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl hover:scale-105 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {courses?.find((c) => c.id === note.course_id)?.name || 'Unknown Course'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
