import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Clock, FileText, BookOpen, Target, AlertCircle, RefreshCw } from 'lucide-react'
import AnimatedCounter from '../components/AnimatedCounter'
import Skeleton from '../components/Skeleton'

export default function Analytics() {
  const { data: usageData, isLoading: usageLoading, isError: usageError, refetch: refetchUsage } = useQuery({
    queryKey: ['usage-data'],
    queryFn: analyticsService.getUsageData,
    retry: 2,
  })

  const { data: studySessions, isLoading: sessionsLoading, isError: sessionsError, refetch: refetchSessions } = useQuery({
    queryKey: ['study-sessions'],
    queryFn: () => analyticsService.getStudySessions(7),
    retry: 2,
  })

  const { data: pomodoroSessions, isLoading: pomodoroLoading } = useQuery({
    queryKey: ['pomodoro-sessions'],
    queryFn: analyticsService.getPomodoroSessions,
    retry: 2,
  })

  const isLoading = usageLoading || sessionsLoading || pomodoroLoading
  const isError = usageError || sessionsError

  if (isError) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Analytics</h1>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load analytics</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to fetch usage statistics and study sessions
          </p>
          <button 
            onClick={() => { 
              refetchUsage(); 
              refetchSessions(); 
            }} 
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Analytics</h1>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-16" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="card p-6 mb-8">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>

        {/* Sessions Skeleton */}
        <h2 className="text-xl font-semibold mb-4">Recent Study Sessions</h2>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-7 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const chartData = studySessions?.map((session) => ({
    date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    minutes: Math.floor(session.total_time / 60),
    notes: session.note_count,
  })) || []

  const completedPomodoros = pomodoroSessions?.filter(s => s.completed).length || 0

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-kit-green/20 shadow-inner rounded-xl">
              <FileText className="w-5 h-5 text-kit-green" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Notes Created
            </h3>
          </div>
          <p className="text-3xl font-bold"><AnimatedCounter value={usageData?.notes_created || 0} duration={900} /></p>
        </div>

  <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-kit-blue/20 shadow-inner rounded-xl">
              <BookOpen className="w-5 h-5 text-kit-blue" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Courses
            </h3>
          </div>
          <p className="text-3xl font-bold"><AnimatedCounter value={usageData?.courses_created || 0} duration={900} /></p>
        </div>

  <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-kit-orange/20 shadow-inner rounded-xl">
              <Clock className="w-5 h-5 text-kit-orange" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Study Time
            </h3>
          </div>
          <p className="text-3xl font-bold">
            <AnimatedCounter value={Math.floor((usageData?.total_study_time || 0) / 60)} duration={900} />h
          </p>
        </div>

  <div className="card p-8 bg-gradient-to-br from-kit-green/10 via-white to-blue-100 dark:from-kit-green/20 dark:via-gray-900 dark:to-blue-900 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-kit-green-light/20 shadow-inner rounded-xl">
              <Target className="w-5 h-5 text-kit-green-light" />
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pomodoros
            </h3>
          </div>
          <p className="text-3xl font-bold"><AnimatedCounter value={completedPomodoros} duration={900} /></p>
        </div>
      </div>

      {/* Study Time Chart */}
      {chartData.length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Study Time (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="minutes" fill="#00876C" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Study Sessions */}
      {studySessions && studySessions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Study Sessions</h2>
          <div className="space-y-3">
            {studySessions.map((session, index) => (
              <div key={index} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {session.note_count} notes • {session.quiz_count} quizzes
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-kit-green">
                    <Clock className="w-5 h-5" />
                    <span className="text-xl font-bold">
                      {Math.floor(session.total_time / 60)}m
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!studySessions || studySessions.length === 0) && (
        <div className="card p-12 text-center text-gray-500 dark:text-gray-400">
          <BarChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No study data yet</p>
          <p className="text-sm">Start creating notes and taking quizzes to see your analytics</p>
        </div>
      )}
    </div>
  )
}
