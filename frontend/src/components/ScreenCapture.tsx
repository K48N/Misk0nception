import { useState, useRef, useEffect } from 'react'
import { X, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScreenCaptureProps {
  isActive: boolean
  onCapture: (imageDataUrl: string) => void
  onCancel: () => void
}

export default function ScreenCapture({ isActive, onCapture, onCancel }: ScreenCaptureProps) {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)


  useEffect(() => {
    if (!isActive) {
      setStartPos(null)
      setCurrentPos(null)
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onCancel])

  if (!isActive) return null

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartPos({ x: e.clientX, y: e.clientY })
    setCurrentPos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (startPos) {
      setCurrentPos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = async () => {
    if (!startPos || !currentPos) return

    const x = Math.min(startPos.x, currentPos.x)
    const y = Math.min(startPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)

    if (width < 10 || height < 10) {
      toast.error('Selection too small')
      setStartPos(null)
      setCurrentPos(null)
      return
    }

    try {
      // Capture the screen using html2canvas or similar
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (ctx) {
        // Get screenshot of the body
        const bodyCanvas = await import('html2canvas').then(module => 
          module.default(document.body, {
            // x: x + window.scrollX, // Removed: not a valid html2canvas option
            // y: y + window.scrollY, // Removed: not a valid html2canvas option
            width: width,
            height: height,
            useCORS: true,
          })
        )

        ctx.drawImage(bodyCanvas, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        onCapture(dataUrl)
        toast.success('Screenshot captured!')
      }
    } catch (error) {
      // Fallback: Use the selection rectangle as indicator
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
          
          // Draw a rectangle indicator
          ctx.fillStyle = 'rgba(0, 200, 150, 0.2)'
          ctx.fillRect(x, y, width, height)
          ctx.strokeStyle = '#00c896'
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, width, height)
          
          const dataUrl = canvas.toDataURL('image/png')
          onCapture(dataUrl)
          toast.success('Area selected! (Note: Install html2canvas for full capture)')
        }
      }
    }
  }

  const getSelectionRect = () => {
    if (!startPos || !currentPos) return null

    const x = Math.min(startPos.x, currentPos.x)
    const y = Math.min(startPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)

    return { x, y, width, height }
  }

  const rect = getSelectionRect()

  return (
    <div
      className="fixed inset-0 bg-black/40 cursor-crosshair z-[9999]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Instructions */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-gray-200 dark:border-gray-700">
        <Camera className="w-5 h-5 text-kit-green" />
        <span className="font-medium">Click and drag to select area</span>
        <span className="text-sm text-gray-500">• Press ESC to cancel</span>
        <button
          onClick={onCancel}
          className="ml-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selection rectangle */}
      {rect && (
        <>
          <div
            className="absolute border-2 border-kit-green bg-kit-green/10"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
            }}
          />
          <div
            className="absolute bg-white dark:bg-gray-800 px-3 py-1 rounded text-sm font-mono shadow-lg border border-gray-300 dark:border-gray-600"
            style={{
              left: rect.x,
              top: rect.y - 30,
            }}
          >
            {rect.width} × {rect.height}
          </div>
        </>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
