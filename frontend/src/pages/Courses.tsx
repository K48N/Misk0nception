import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseService, CourseCreate } from '../services/courseService'
import { Plus, AlertCircle, RefreshCw } from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AnimatedCounter from '../components/AnimatedCounter'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { CourseCardSkeleton } from '../components/Skeleton'
import KITAsyncSpinner from '../components/KITAsyncSpinner'
import '../components/KITAsyncSpinner.css'

const COURSE_COLORS = [
  '#00876C', // KIT Green
  '#4664AA', // KIT Blue
  '#DF9B1B', // KIT Orange
  '#A22223', // KIT Red
  '#8B5A3C', // Brown
  '#6B7280', // Gray
  '#10B981', // Emerald
  '#F59E0B', // Amber
]

export default function Courses() {
  const createMutation = useMutation({
    mutationFn: courseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsModalOpen(false);
      setFormData({
        name: '',
        code: '',
        color: COURSE_COLORS[0],
        icon: '📚',
        description: '',
      });
    },
    onError: () => {
      toast.error('Failed to create course.');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(formData);
  }
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<CourseCreate>({
    name: '',
    code: '',
    color: COURSE_COLORS[0],
    icon: '📚',
    description: '',
  })

  const { data: courses, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getAll,
    retry: 2,
  })
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Courses</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <div
            key={course.id}
            onClick={() => navigate(`/courses/${course.id}`)}
            className="card border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:scale-105 transition-shadow transition-transform transition-colors cursor-pointer min-h-[180px] flex flex-col justify-between bg-white dark:bg-gray-800"
            style={{
              minHeight: '180px',
              background: `linear-gradient(135deg, ${course.color}22 0%, ${course.color}cc 100%)`,
              borderColor: course.color,
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{course.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {course.code}
                </p>
              </div>
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: course.color }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
              <AnimatedCounter value={course.note_count} className="font-bold text-kit-blue" /> notes
            </p>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Course"
      >
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-1 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">
              Course Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
              placeholder="e.g., Linear Algebra"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Course Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="input-field bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
              placeholder="e.g., MATH-101"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
              placeholder="Optional course description..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex gap-2 mt-1">
              {COURSE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${formData.color === color ? 'border-white ring-2 ring-kit-green' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                >
                  {formData.color === color && <span className="w-4 h-4 rounded-full border-2 border-kit-green" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
