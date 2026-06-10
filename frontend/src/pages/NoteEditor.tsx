import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { noteService } from '../services/noteService'
// courseService removed — not used in this component after cleanup
import { tagService } from '../services/tagService'
import { attachmentService } from '../services/attachmentService'
import { useState, useEffect } from 'react'
// @ts-ignore: react-color types may be missing
import { SketchPicker } from 'react-color'

import { ArrowLeft, Save, Trash2, Paperclip, Download, X } from 'lucide-react'
import toast from 'react-hot-toast'
import AIToolsModal from '../components/AIToolsModal'
import AnimatedCounter from '../components/AnimatedCounter'

export default function NoteEditor() {
  const { courseId, noteId } = useParams<{ courseId: string; noteId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNewNote = noteId === 'new'

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [customTagName, setCustomTagName] = useState('')
  const [customTagColor, setCustomTagColor] = useState('#10b981')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  // file input and course query removed — not used in current UI

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', noteId],
    queryFn: () => noteService.getById(Number(noteId)),
    enabled: !isNewNote && !!noteId,
  })

  const { data: tagsRaw, refetch: refetchTags } = useQuery({
    queryKey: ['tags'],
    queryFn: tagService.getAll,
  })
  // Ensure Transcript tag always exists
  const tags = tagsRaw ? (tagsRaw.some(t => t.name === 'Transcript') ? tagsRaw : [{ id: -1, name: 'Transcript', color: '#6366f1' }, ...tagsRaw]) : []

  const createTagMutation = useMutation({
    mutationFn: tagService.create,
    onSuccess: () => {
      toast.success('Custom tag created!')
      setCustomTagName('')
      setCustomTagColor('#10b981')
      setShowColorPicker(false)
      refetchTags()
    },
    onError: () => {
      toast.error('Failed to create tag')
    },
  })

  const handleCreateCustomTag = () => {
    if (!customTagName.trim()) {
      toast.error('Enter a tag name')
      return
    }
    createTagMutation.mutate({ name: customTagName, color: customTagColor })
  }

  const { data: attachments, refetch: refetchAttachments } = useQuery({
    queryKey: ['attachments', noteId],
    queryFn: () => attachmentService.getNoteAttachments(Number(noteId)),
    enabled: !isNewNote && !!noteId,
  })

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setSelectedTags(note.tags.map((t) => t.id))
    }
  }, [note])

  const createMutation = useMutation({
    mutationFn: noteService.create,
    onSuccess: (data) => {
      toast.success('Note created successfully!')
      queryClient.invalidateQueries({ queryKey: ['notes', courseId] })
      navigate(`/courses/${courseId}/notes/${data.id}`)
    },
    onError: () => {
      toast.error('Failed to create note')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      noteService.update(id, data),
    onSuccess: () => {
      toast.success('Note saved successfully!')
      queryClient.invalidateQueries({ queryKey: ['note', noteId] })
      queryClient.invalidateQueries({ queryKey: ['notes', courseId] })
    },
    onError: () => {
      toast.error('Failed to save note')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: noteService.delete,
    onSuccess: () => {
      toast.success('Note deleted successfully!')
      navigate(`/courses/${courseId}`)
    },
    onError: () => {
      toast.error('Failed to delete note')
    },
  })

  // handleSave/handleDelete removed — saving/deleting handled via mutations directly in UI elsewhere

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleInsertAIText = (text: string) => {
    setContent(content + text)
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (isNewNote) {
      createMutation.mutate({
        title,
        content,
        course_id: Number(courseId),
        tag_ids: selectedTags,
      })
    } else {
      updateMutation.mutate({
        id: Number(noteId),
        data: {
          title,
          content,
          tag_ids: selectedTags,
        },
      })
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteMutation.mutate(Number(noteId))
    }
  }

  const deleteAttachmentMutation = useMutation({
    mutationFn: attachmentService.deleteAttachment,
    onSuccess: () => {
      toast.success('Attachment deleted!')
      refetchAttachments()
    },
    onError: () => {
      toast.error('Failed to delete attachment')
    },
  })

  // file upload handler removed (no active file input in markup)

  const handleDownload = async (attachment: any) => {
    try {
      const blob = await attachmentService.downloadAttachment(attachment.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error('Failed to download file')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  // Compute gradient for note card based on selected tag colors
  // cardGradient variable removed; use cardGradientStyle only
  // Inline style for gradient
  let cardGradientStyle = {};
  if (tags && selectedTags.length > 0) {
    const selColors = tags.filter(t => selectedTags.includes(t.id)).map(t => t.color);
    if (selColors.length === 1) {
      cardGradientStyle = {
        background: `linear-gradient(135deg, ${selColors[0]}20 0%, ${selColors[0]}80 100%)`,
      };
    } else if (selColors.length > 1) {
      const stops = selColors.map((c, i) => `${c} ${(i/(selColors.length-1))*100}%`).join(', ');
      cardGradientStyle = {
        background: `linear-gradient(135deg, ${stops})`,
      };
    }
  }
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Save"
          >
            <Save className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-red-600"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
  <div className={`card p-8 mb-4 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl`} style={cardGradientStyle}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="w-full text-3xl font-bold bg-transparent border-none outline-none mb-4"
        />

        {/* Animated Stat Counters */}
        <div className="flex flex-wrap gap-6 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Words:</span>
            <AnimatedCounter value={content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length} duration={100} className="font-bold text-kit-green" />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Tags:</span>
            <AnimatedCounter value={selectedTags.length} duration={100} className="font-bold text-kit-blue" />
          </div>
          {attachments && (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Attachments:</span>
              <AnimatedCounter value={attachments.length} duration={100} className="font-bold text-kit-orange" />
            </div>
          )}
        </div>

        {/* Tag Selector with Custom Tag Creation */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</div>
            <button
              className="ml-2 px-2 py-1 rounded bg-kit-green text-white text-xs hover:bg-kit-green/80 transition-colors"
              onClick={() => setShowColorPicker((v) => !v)}
              type="button"
            >
              + Custom Tag
            </button>
          </div>
          {showColorPicker && (
            <div className="mb-2 flex flex-col gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-fit">
              <input
                type="text"
                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent text-sm mb-2"
                placeholder="Tag name"
                value={customTagName}
                onChange={e => setCustomTagName(e.target.value)}
              />
              {/*
              <SketchPicker
                color={customTagColor}
                onChange={(color: { hex: string }) => setCustomTagColor(color.hex)}
                disableAlpha
              />
              */}
              <button
                className="mt-2 px-3 py-1 rounded bg-kit-green text-white text-sm hover:bg-kit-green/80"
                onClick={handleCreateCustomTag}
                type="button"
              >
                Create Tag
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {tags && tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors font-semibold border-2 ${selectedTags.includes(tag.id) ? 'opacity-100 scale-105 ring-2 ring-offset-2 ring-kit-green' : 'opacity-60 hover:opacity-80'}`}
                style={{
                  background: `linear-gradient(90deg, ${tag.color}20 0%, ${tag.color}40 100%)`,
                  color: tag.color,
                  borderColor: tag.color,
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your note..."
          className="w-full min-h-[400px] bg-transparent border-none outline-none resize-none font-mono text-sm"
        />
      </div>

      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <div className="card p-4 mb-4">
          <h3 className="text-sm font-medium mb-3">Attachments</h3>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.filename}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {attachment.filesize_str}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-600"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AIToolsModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        noteContent={content}
        onInsertText={handleInsertAIText}
      />
    </div>
  )
}
