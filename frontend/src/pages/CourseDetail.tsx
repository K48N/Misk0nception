import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseService } from '../services/courseService'
import { noteService } from '../services/noteService'
import { Plus, ArrowLeft, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { NoteCardSkeleton } from '../components/Skeleton'



// Helper for dynamic gradient with transparency
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

function getNoteCardGradient(tagColors: string[]): string {
  if (tagColors.length === 0) {
    return 'linear-gradient(135deg, #23272f 0%, #3a3f4b 100%)';
  }
  if (tagColors.length === 1) {
    return `linear-gradient(135deg, ${hexToRgba(tagColors[0], 0.18)} 0%, ${hexToRgba(tagColors[0], 0.38)} 100%)`;
  }
  const stops = tagColors.map((color, i) => `${hexToRgba(color, 0.22)} ${(i * 100) / (tagColors.length - 1)}%`).join(', ');
  return `linear-gradient(135deg, ${stops})`;
}

// Add Transcript tag if not present (for demo, in real app this should be in DB)
const TRANSCRIPT_TAG = { id: -1, name: 'Transcript', color: '#ff9800' };

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()


  const { data: course, isLoading: courseLoading, isError: courseError, error: courseErrorMsg, refetch: refetchCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getById(Number(courseId)),
    enabled: !!courseId,
    retry: 2,
  })

  const { data: notes, isLoading: notesLoading, isError: notesError, error: notesErrorMsg, refetch: refetchNotes } = useQuery({
    queryKey: ['notes', courseId],
    queryFn: () => noteService.getAll(Number(courseId)),
    enabled: !!courseId,
    retry: 2,
  })

  // Helper to delete all notes in a course
  async function deleteAllNotesForCourse(courseId: number) {
    const notes = await noteService.getAll(courseId);
    await Promise.all(notes.map(note => noteService.delete(note.id)));
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteAllNotesForCourse(id);
      await courseService.delete(id);
    },
    onSuccess: () => {
      toast.success('Course deleted!')
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      navigate('/courses')
    },
    onError: () => {
      toast.error('Failed to delete course')
    },
  })



  const handleDeleteCourse = () => {
    if (confirm(`Are you sure you want to delete "${course?.name}"? This will delete all notes in this course.`)) {
      deleteMutation.mutate(Number(courseId))
    }
  }

  if (courseError || notesError) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold">Error Loading Course</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load course details</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {courseError && courseErrorMsg instanceof Error 
              ? courseErrorMsg.message 
              : notesErrorMsg instanceof Error 
              ? notesErrorMsg.message 
              : 'An error occurred'}
          </p>
          <button 
            onClick={() => { 
              refetchCourse(); 
              refetchNotes(); 
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

  if (courseLoading || notesLoading) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-9 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!course) {
    return <div>Course not found</div>
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: course.color }}
            />
            <h1 className="text-3xl font-bold">{course.name}</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{course.code}</p>
        </div>
        <button
          onClick={handleDeleteCourse}
          className="btn-secondary text-sm py-2 px-4 text-red-600 dark:text-red-400"
          title="Delete Course"
        >
          Delete
        </button>
        <button
          onClick={() => navigate(`/courses/${courseId}/notes/new`)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Note
        </button>
      </div>

      {course.description && (
        <div className="card p-4 mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-shadow transition-transform hover:shadow-xl hover:scale-[1.03] transition-colors">
          <p className="text-gray-700 dark:text-gray-300">{course.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes && notes.length > 0 ? (
          notes.map((note) => {
            // Add Transcript tag if note is a transcript (demo logic)
            let tags = note.tags;
            if (note.title.toLowerCase().includes('transcript') && !tags.some(t => t.name === 'Transcript')) {
              tags = [...tags, TRANSCRIPT_TAG];
            }
            const tagColors = tags.map(t => t.color);
            const cardGradientStyle = { background: getNoteCardGradient(tagColors) };
            return (
              <div
                key={note.id}
                className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 transition-shadow transition-transform hover:shadow-xl hover:scale-[1.03] hover:border-kit-green/40 hover:bg-kit-green/5 transition-colors cursor-pointer min-h-[180px] flex flex-col justify-between"
                style={{ minHeight: '180px', ...cardGradientStyle }}
              >
                <h3 className="font-semibold text-lg mb-2">{note.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>{format(new Date(note.updated_at), 'MMM d, yyyy')}</span>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, i) => (
                      <span
                        key={tag.id || tag.name || i}
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
                )}
                {note.attachment_count > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    📎 {note.attachment_count} attachment{note.attachment_count !== 1 ? 's' : ''}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/courses/${courseId}/notes/${note.id}`)}
                    className="btn-primary flex-1 text-sm py-2"
                  >
                    Open
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this note?')) {
                        noteService.delete(note.id).then(() => refetchNotes());
                      }
                    }}
                    className="btn-secondary text-sm py-2 px-4 text-red-600 dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 dark:text-gray-400">No notes found.</div>
        )}
      </div>
    </div>
  );
}
