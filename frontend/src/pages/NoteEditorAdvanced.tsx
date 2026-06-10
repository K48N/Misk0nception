import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService, Note, NoteCreate } from '../services/noteService';
import { tagService, Tag } from '../services/tagService';
import { attachmentService, Attachment } from '../services/attachmentService';
import { useState, useEffect, useRef } from 'react';
// @ts-ignore: react-color types may be missing
// import { SketchPicker } from 'react-color';
import { Paperclip, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AIToolsModal from '../components/AIToolsModal';
import AnimatedCounter from '../components/AnimatedCounter';
import MarkdownPreview from '../components/MarkdownPreview';
import AudioRecorder from '../components/AudioRecorder';
import CodeBlockEditor from '../components/CodeBlockEditor';
import RichTextToolbar from '../components/RichTextToolbar';
import WordCount from '../components/WordCount';
import Breadcrumbs from '../components/Breadcrumbs';
import AutoSaveIndicator from '../components/AutoSaveIndicator';
import MathSolver from '../components/MathSolver';
import DiagramGenerator from '../components/DiagramGenerator';
import ScreenCapture from '../components/ScreenCapture';
import FocusMode from '../components/FocusMode';
import SearchDialog from '../components/SearchDialog';

export default function NoteEditorAdvanced() {
  // State and hooks
  const { courseId, noteId } = useParams<{ courseId: string; noteId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewNote = noteId === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [customTagName, setCustomTagName] = useState('');
  const [customTagColor, setCustomTagColor] = useState('#10b981');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMathSolver, setShowMathSolver] = useState(false);
  const [showDiagramGen, setShowDiagramGen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [note, setNote] = useState<Note | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  // Only these default tags, as requested
  const DEFAULT_TAGS: Tag[] = [
    { id: -1, name: 'Transcript', color: '#ff9800' },
    { id: -2, name: 'Lecture', color: '#4664AA' },
    { id: -3, name: 'Excercise', color: '#10B981' },
    { id: -4, name: 'Tutorial', color: '#DF9B1B' },
    { id: -5, name: 'Important', color: '#A22223' },
  ];

  // Color palette for new tags (cycled)
  const TAG_COLORS = [
    '#00876C', // Green
    '#4664AA', // Blue
    '#DF9B1B', // Orange
    '#A22223', // Red
    '#8B5A3C', // Brown
    '#6B7280', // Gray
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#ff9800', // Deep orange
    '#e91e63', // Pink
    '#9c27b0', // Purple
    '#00bcd4', // Cyan
    '#4caf50', // Green
    '#ffc107', // Yellow
    '#795548', // Brown
    '#607d8b', // Blue Gray
  ];

  // Helper to get a unique color for a new tag
  function getNextTagColor(existingTags: Tag[]): string {
    const usedColors = new Set(existingTags.map(t => t.color.toLowerCase()));
    for (const color of TAG_COLORS) {
      if (!usedColors.has(color.toLowerCase())) return color;
    }
    // If all colors used, cycle
    return TAG_COLORS[(existingTags.length) % TAG_COLORS.length];
  }
  const [isTyping, setIsTyping] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  // const [error, setError] = useState<any>(null);
  // const [isError, setIsError] = useState(false);
  // const [isLoading, setIsLoading] = useState(false);

  // Fetch note
  const noteQuery = useQuery({
    queryKey: ['note', noteId],
    queryFn: async () => noteId ? await noteService.getById(Number(noteId)) : undefined,
    enabled: !isNewNote && !!noteId,
  });

  useEffect(() => {
    if (noteQuery.data) {
      setNote(noteQuery.data);
      setTitle(noteQuery.data.title);
      setContent(noteQuery.data.content);
      setSelectedTags(noteQuery.data.tags.map(tag => tag.id));
    }
    if (noteQuery.isError) {
      toast.error('Failed to load note');
    }
  }, [noteQuery.data, noteQuery.isError]);

  // Fetch tags
  useEffect(() => {
    tagService.getAll().then((userTags) => {
      // Only add default tags if not present by name
      const tagNames = userTags.map(t => t.name);
      const missingDefaults = DEFAULT_TAGS.filter(dt => !tagNames.includes(dt.name));
      setTags([...missingDefaults, ...userTags]);
    });
  }, []);

  // Fetch attachments
  useEffect(() => {
    if (!isNewNote && noteId) {
      attachmentService.getNoteAttachments(Number(noteId)).then(setAttachments);
    }
  }, [noteId, isNewNote]);

  // Save note mutation (handles both create and update)
  const saveNoteMutation = useMutation<Note, unknown, NoteCreate & { id?: string | number } | { id: number; [key: string]: any }>({
    mutationFn: async (data) => {
      if (isNewNote) {
        return await noteService.create(data as NoteCreate);
      } else {
        return await noteService.update(Number(noteId), data as NoteCreate);
      }
    },
    onSuccess: (data: Note) => {
      setLastSavedAt(new Date());
      setSaveStatus('saved');
      // Invalidate both the single note and the course notes list
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      queryClient.invalidateQueries({ queryKey: ['notes', courseId] });
      if (isNewNote && data.id) {
        navigate(`/courses/${courseId}/notes/${data.id}`);
      }
    },
    onError: () => {
      toast.error('Failed to save note');
    },
  });

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation<void, unknown, number>({
    mutationFn: (id: number) => attachmentService.deleteAttachment(id),
    onSuccess: () => {
      toast.success('Attachment deleted');
      attachmentService.getNoteAttachments(Number(noteId)).then(setAttachments);
    },
    onError: () => {
      toast.error('Failed to delete attachment');
    },
  });

  // Effects
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (content.trim() !== '') {
        // Always send a non-empty title to backend
        const safeTitle = title && title.trim().length > 0 ? title : 'Untitled Note';
        const data = { title: safeTitle, content, course_id: Number(courseId), tag_ids: selectedTags };
        saveNoteMutation.mutate(data);
      }
    }, 2000);
    return () => clearInterval(autoSaveInterval);
  }, [content, title, selectedTags, isNewNote, noteId, saveNoteMutation, courseId]);
  
  // Handler for creating a custom tag
  const handleCreateCustomTag = async () => {
    if (!customTagName.trim()) {
      toast.error('Enter a tag name');
      return;
    }
    // Pick a unique color for the new tag
    const color = getNextTagColor(tags);
    try {
      const newTag = await tagService.create({ name: customTagName, color });
      setTags([...tags, { ...newTag, id: Number(newTag.id) }]);
      setSelectedTags([...selectedTags, Number(newTag.id)]);
      setCustomTagName('');
      setCustomTagColor(getNextTagColor([...tags, { ...newTag, id: Number(newTag.id) }]));
      setShowColorPicker(false);
      toast.success('Custom tag created!');
    } catch {
      toast.error('Failed to create tag');
    }
  };

  // Handler for inserting AI text
  const handleInsertAIText = (text: string) => {
    setContent(content + '\n\n' + text);
  };

  // Handler for creating a note with AI content
  const handleCreateNoteWithAIContent = async (aiContent: string) => {
    try {
      const firstLine = aiContent.split('\n')[0].replace(/^#+\s*/, '').trim();
      const newTitle = firstLine.substring(0, 100) || 'AI Generated Note';
      const newNote = await noteService.create({
        title: newTitle,
        content: aiContent,
        course_id: Number(courseId),
        tag_ids: selectedTags,
      });
      toast.success('New note created!');
      navigate(`/courses/${courseId}/notes/${newNote.id}`);
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  // Handler for replacing content with AI content
  const handleReplaceWithAIContent = (aiContent: string) => {
    setContent(aiContent);
    toast.success('Note content replaced!');
  };

  // Handler for audio save
  const handleAudioSave = async (audioBlob: Blob, filename: string) => {
    if (isNewNote) {
      toast.error('Please save the note first before recording audio');
      return;
    }
    const file = new File([audioBlob], filename, { type: 'audio/webm' });
    await attachmentService.uploadAttachment(Number(noteId), file);
    attachmentService.getNoteAttachments(Number(noteId)).then(setAttachments);
  };

  // Handler for downloading attachments
  const handleDownload = async (attachment: Attachment) => {
    try {
      const blob = await attachmentService.downloadAttachment(attachment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  // Handlers
  const handleEditorInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsTyping(true);
  };
  
  const handleEditorFocus = () => {
    setIsTyping(true);
  };
  
  const handleEditorBlur = () => {
    setIsTyping(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor('  ');
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      insertAtCursor('\n');
    }
  };
  
  const handleFormat = (command: string) => {
    switch (command) {
      case 'bold':
        insertAtCursor('**', '**');
        break;
      case 'italic':
        insertAtCursor('*', '*');
        break;
      case 'underline':
        insertAtCursor('__', '__');
        break;
      case 'strikethrough':
        insertAtCursor('~~', '~~');
        break;
      case 'code':
        insertAtCursor('`', '`');
        break;
      case 'codeBlock':
        insertAtCursor('\n```\n', '\n```\n');
        break;
      case 'heading1':
        insertAtCursor('# ');
        break;
      case 'heading2':
        insertAtCursor('## ');
        break;
      case 'heading3':
        insertAtCursor('### ');
        break;
      case 'bulletList':
        insertAtCursor('- ');
        break;
      case 'numberedList':
        insertAtCursor('1. ');
        break;
      case 'checkList':
        insertAtCursor('- [ ] ');
        break;
      case 'quote':
        insertAtCursor('> ');
        break;
      case 'link':
        insertAtCursor('[', '](url)');
        break;
      case 'image':
        insertAtCursor('![alt text](', ')');
        break;
      case 'table':
        insertAtCursor('\n| Column 1 | Column 2 |\n|----------|----------|\n| ', ' |\n');
        break;
      case 'divider':
        insertAtCursor('\n---\n');
        break;
      case 'inlineMath':
        insertAtCursor('$', '$');
        break;
      case 'displayMath':
        insertAtCursor('\n$$\n', '\n$$\n');
        break;
    }
  };
  
  const handleHighlight = () => {
    insertAtCursor('==', '==');
  };
  
  const handleTextSize = (size: string) => {
    switch (size) {
      case 'small':
        insertAtCursor('<small>', '</small>');
        break;
      case 'large':
        insertAtCursor('## ');
        break;
      case 'xlarge':
        insertAtCursor('# ');
        break;
    }
  };
  
  const handleSearchHighlight = (matches: any[], _currentIndex: number) => {
    if (matches.length > 0 && editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  
  
  
  const insertAtCursor = (before: string, after: string = '') => {
    if (!textAreaRef.current) return;
    
    // Keep editor in typing mode
    setIsTyping(true);
    
    const textarea = textAreaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);
    
    const newText = beforeText + before + selectedText + after + afterText;
    setContent(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPos, newPos);
      setIsTyping(true);
    }, 0);
  };
  
  // Only show loading for existing notes, not for new notes
  if (noteQuery.isLoading && !isNewNote) {
    console.log('⌛ Loading existing note...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading note...</div>
          <div className="text-sm text-gray-500">Please wait</div>
        </div>
      </div>
    );
  }
  
  // Show error state
  // if (noteQuery.isError && !isNewNote) {
  //   console.error('❌ Error loading note:', noteQuery.error);
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-center">
  //         <div className="text-lg font-semibold text-red-600 mb-2">Error loading note</div>
  //         <div className="text-sm text-gray-500 mb-4">{noteQuery.error?.toString() || 'Unknown error'}</div>
  //         <button 
  //           onClick={() => navigate(`/courses/${courseId}`)}
  //           className="btn-primary"
  //         >
  //           Back to Course
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }
  
  return (
    <>
  <div className="max-w-5xl mx-auto py-6 px-4">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Course', href: `/courses/${courseId}` },
            { label: note?.title || title || 'New Note' },
          ]}
        />
  <div className="space-y-6">
          {/* WYSIWYG Editor Card - Edit directly in formatted view */}
          <div className="card p-8 space-y-4 border border-kit-green/20 dark:border-kit-green/30 rounded-2xl shadow-lg transition-shadow transition-transform hover:shadow-2xl bg-white dark:bg-gray-900">
            {/* Manual Save Button */}
            <div className="flex justify-end mb-2">
              <button
                className="btn-primary px-4 py-2 text-sm font-semibold rounded-lg shadow"
                onClick={() => {
                  const safeTitle = title && title.trim().length > 0 ? title : 'Untitled Note';
                  saveNoteMutation.mutate({ title: safeTitle, content, course_id: Number(courseId), tag_ids: selectedTags });
                }}
                disabled={saveNoteMutation.isPending}
                type="button"
                title="Save note"
              >
                {saveNoteMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled (will auto-generate on save)"
              className="w-full text-3xl font-bold bg-transparent border-none outline-none mb-4 placeholder:text-gray-400 placeholder:font-normal"
            />
            {/* Animated Stat Counters: Only show Tags and Attachments */}
            <div className="flex flex-wrap gap-6 mb-4">
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
            {/* Tags with Custom Tag Creation */}
            <div>
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
              <div className="flex flex-wrap gap-2 mb-4">
                {tags?.map((tag) => (
                  <div key={tag.id} className="relative group">
                    <button
                      onClick={() => {
                        if (selectedTags.includes(tag.id)) {
                          setSelectedTags(selectedTags.filter((id) => id !== tag.id))
                        } else {
                          setSelectedTags([...selectedTags, tag.id])
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors font-semibold border-2 ${selectedTags.includes(tag.id) ? 'opacity-100 scale-105 ring-2 ring-offset-2 ring-kit-green' : 'opacity-60 hover:opacity-80'}`}
                      style={{
                        background: `linear-gradient(90deg, ${tag.color}20 0%, ${tag.color}40 100%)`,
                        color: tag.color,
                        borderColor: tag.color,
                      }}
                      type="button"
                    >
                      {tag.name}
                    </button>
                    {/* Show delete button for custom tags only (id > 0) */}
                    {tag.id > 0 && (
                      <button
                        className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full p-0.5 shadow hover:bg-red-100 dark:hover:bg-red-900 text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete tag"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await tagService.delete(tag.id);
                            tagService.getAll().then((userTags) => {
                              const tagNames = userTags.map(t => t.name);
                              const missingDefaults = DEFAULT_TAGS.filter(dt => !tagNames.includes(dt.name));
                              setTags([...missingDefaults, ...userTags]);
                            });
                            setSelectedTags(selectedTags.filter(id => id !== tag.id));
                            toast.success('Tag deleted');
                          } catch {
                            toast.error('Failed to delete tag');
                          }
                        }}
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Rich Text Toolbar */}
            <RichTextToolbar
              onFormat={handleFormat}
              onHighlight={handleHighlight}
              onTextSize={handleTextSize}
            />
            {/* Hybrid Editor: Textarea for editing + Div for formatted preview */}
            <div className="relative min-h-[600px]">
              {/* Textarea for source (visible while typing) */}
              <textarea
                ref={textAreaRef}
                value={content || ''}
                onChange={handleEditorInput}
                onFocus={handleEditorFocus}
                onBlur={handleEditorBlur}
                onKeyDown={handleKeyDown}
                spellCheck="true"
                placeholder={`Start writing...\n\n**bold** *italic* \`code\` ==highlight==\n# Heading\n$x^2$ inline math\n$$E=mc^2$$ display math\n\`\`\`code block\`\`\`\n- List item`}
                className={`absolute inset-0 w-full h-full min-h-[600px] p-8 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-kit-green focus:ring-2 focus:ring-kit-green/20 transition-opacity resize-none font-mono text-sm leading-relaxed ${isTyping ? 'opacity-100 z-10' : 'opacity-0 z-10'}`}
                style={{ caretColor: '#10b981' }}
              />
              {/* Formatted preview (visible when not typing) */}
              <div
                ref={editorRef}
                className={`w-full min-h-[600px] p-8 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl transition-opacity cursor-text ${isTyping ? 'opacity-0 pointer-events-none' : 'opacity-100 z-0'}`}
                style={{ fontSize: '16px', lineHeight: '1.75' }}
                onClick={() => {
                  if (textAreaRef.current) {
                    textAreaRef.current.focus();
                    setIsTyping(true);
                  }
                }}
              >
                {!isTyping && <MarkdownPreview content={content} />}
              </div>
              {!content && !isTyping && (
                <div className="absolute top-8 left-8 text-gray-400 dark:text-gray-600 pointer-events-none select-none">
                  <p className="text-lg font-semibold">Start writing your note...</p>
                  <p className="text-sm opacity-75 mt-2">Click to begin or press any key</p>
                </div>
              )}
            </div>
            {/* Word/Char/Reading Time Counter & AI Tools */}
            <div className="flex items-center justify-between mt-4 px-2">
              <WordCount text={content} />
              <button
                className="ml-4 px-3 py-1 rounded bg-kit-green text-white hover:bg-kit-green/80 font-semibold shadow"
                onClick={() => setIsAIModalOpen(true)}
                type="button"
              >
                <span role="img" aria-label="AI">🤖</span> AI Tools
              </button>
            </div>
            {/* Formatting Quick Reference */}
            <details className="mt-4 p-4 bg-gradient-to-r from-kit-green/5 to-blue-500/5 dark:from-kit-green/10 dark:to-blue-500/10 rounded-lg text-sm border border-kit-green/20">
              <summary className="cursor-pointer font-semibold text-gray-900 dark:text-gray-100 hover:text-kit-green transition-colors flex items-center gap-2">
                📖 Markdown Formatting Guide
                <span className="text-xs font-normal text-gray-500">(Click to expand)</span>
              </summary>
              <div className="mt-4 grid grid-cols-2 gap-6 text-gray-600 dark:text-gray-400">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    ✏️ Text Formatting
                  </h4>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-kit-green font-mono">**bold**</code>
                      <span>→</span>
                      <strong>bold text</strong>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-kit-green font-mono">*italic*</code>
                      <span>→</span>
                      <em>italic text</em>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-kit-green font-mono">==highlight==</code>
                      <span>→</span>
                      <mark className="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded">highlight</mark>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-kit-green font-mono">~~strike~~</code>
                      <span>→</span>
                      <del>strikethrough</del>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-kit-green font-mono">__underline__</code>
                      <span>→</span>
                      <u className="underline decoration-2 decoration-kit-green">underline</u>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-kit-green font-mono">`code`</code>
                      <span>→</span>
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-kit-green font-mono">inline code</code>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    📐 Structure
                  </h4>
                  <ul className="space-y-2 text-xs font-mono">
                    <li><code># Heading 1</code> → <span className="text-2xl font-bold">Large</span></li>
                    <li><code>## Heading 2</code> → <span className="text-xl font-bold">Medium</span></li>
                    <li><code>### Heading 3</code> → <span className="text-lg font-bold">Small</span></li>
                    <li><code>- List item</code> → Bullet list</li>
                    <li><code>1. Numbered</code> → Ordered list</li>
                    <li><code>&gt; Quote</code> → Blockquote</li>
                    <li><code>---</code> → Horizontal rule</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    🧮 Math (TeX/LaTeX)
                  </h4>
                  <ul className="space-y-2 text-xs">
                    <li className="flex flex-col gap-1">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-kit-green font-mono">$x^2 + y^2 = z^2$</code>
                      <span className="text-blue-600 dark:text-blue-400 italic">→ Inline math</span>
                    </li>
                    <li className="flex flex-col gap-1">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-kit-green font-mono">$$E = mc^2$$</code>
                      <span className="text-blue-600 dark:text-blue-400 italic">→ Display math (centered)</span>
                    </li>
                    <li className="flex flex-col gap-1">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-kit-green font-mono">$\frac{'{a}'}{'{b}'}$</code>
                      <span className="text-blue-600 dark:text-blue-400 italic">→ Fractions</span>
                    </li>
                    <li className="flex flex-col gap-1">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-kit-green font-mono">$\sum_{'{i=1}'}^{'{n}'}$</code>
                      <span className="text-blue-600 dark:text-blue-400 italic">→ Summation</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    ⌨️ Tips & Shortcuts
                  </h4>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Ctrl+Z</kbd>
                      <span>Undo changes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Ctrl+Y</kbd>
                      <span>Redo changes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Ctrl+F</kbd>
                      <span>Search in note</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Ctrl+S</kbd>
                      <span>Save manually</span>
                    </li>
                    <li>✨ See changes instantly in preview</li>
                    <li>📝 Edit markdown directly, no HTML</li>
                    <li>🔄 Auto-save every 2 seconds</li>
                  </ul>
                </div>
              </div>
            </details>
          </div>
        </div>
        <AIToolsModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          noteContent={content || ''}
          onInsertText={handleInsertAIText}
          onCreateNewNote={handleCreateNoteWithAIContent}
          onReplaceContent={handleReplaceWithAIContent}
        />
        <SearchDialog
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          content={content}
          onHighlight={handleSearchHighlight}
        />
        {/* New Features */}
        <MathSolver 
          isOpen={showMathSolver} 
          onClose={() => setShowMathSolver(false)} 
        />
        <DiagramGenerator 
          isOpen={showDiagramGen} 
          onClose={() => setShowDiagramGen(false)} 
        />
        <ScreenCapture
          isActive={isCapturing}
          onCapture={(imageData) => {
            setContent(content + `\n![Screenshot](${imageData})\n`)
            setIsCapturing(false)
            toast.success('Screenshot captured!')
          }}
          onCancel={() => setIsCapturing(false)}
        />
        <FocusMode
          isActive={showFocusMode}
          onExit={() => setShowFocusMode(false)}
          content={content}
          onContentChange={setContent}
        />
        {/* Auto-save Indicator */}
        {!isNewNote && saveStatus !== 'idle' && (
          <AutoSaveIndicator 
            status={saveStatus} 
            lastSavedAt={lastSavedAt || undefined}
          />
        )}
      </div>
    </>
  );
}

// Example stubs for missing code block handlers (implement as needed)
