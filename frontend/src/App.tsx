import { Routes, Route, useParams } from 'react-router-dom'
import { useThemeStore } from './store/themeStore'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import NoteEditorAdvanced from './pages/NoteEditorAdvanced'
import Flashcards from './pages/Flashcards'
import Quiz from './pages/Quiz'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import GlobalAudioRecorder from './components/GlobalAudioRecorder'

function LayoutWithAudioRecorder() {
  const { courseId } = useParams()
  
  return (
    <>
      <Layout />
      {courseId && <GlobalAudioRecorder courseId={Number(courseId)} />}
    </>
  )
}

function App() {
  const { theme } = useThemeStore()

  useEffect(() => {
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <Routes>
      <Route path="/" element={<LayoutWithAudioRecorder />}>
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:courseId" element={<CourseDetail />} />
        <Route path="courses/:courseId/notes/:noteId" element={<NoteEditorAdvanced />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App

