import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { compressImage } from '@/lib/imageCompression'
import { cn } from '@/lib/utils'

interface BannerUploadProps {
  value: string | null
  onChange: (dataUrl: string | null) => void
  label?: string
}

export function BannerUpload({ value, onChange, label = 'Banner image' }: BannerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    setLoading(true)
    try {
      const dataUrl = await compressImage(file, 1280, 0.75)
      onChange(dataUrl)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e: DragEvent) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e: DragEvent) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
        className={cn(
          'relative aspect-[16/7] rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-200',
          'flex items-center justify-center group',
          dragOver ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/5 scale-[1.01]' : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))]/50 hover:bg-[rgb(var(--color-surface-alt))]'
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">Click to change</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--color-text-muted))]" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[rgb(var(--color-text-muted))]">
            <ImagePlus className="h-6 w-6 transition-transform group-hover:scale-110 group-hover:text-[rgb(var(--color-primary))]" />
            <span className="text-xs">Click or drag a banner photo here</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  )
}

interface GalleryUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  label?: string
  max?: number
}

export function GalleryUpload({ images, onChange, label = 'Interior photos', max = 8 }: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return
    const remaining = max - images.length
    const toProcess = Array.from(files).slice(0, remaining)
    if (!toProcess.length) return
    setLoading(true)
    try {
      const compressed = await Promise.all(toProcess.map((f) => compressImage(f, 1000, 0.7)))
      onChange([...images, ...compressed])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium mb-1.5">{label} <span className="text-[rgb(var(--color-text-muted))] font-normal">({images.length}/{max})</span></label>}
      <div className="grid grid-cols-4 gap-2">
        {images.map((img, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
            <img src={img} alt={`Interior ${i + 1}`} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-[rgb(var(--color-border))] flex items-center justify-center text-[rgb(var(--color-text-muted))] transition-all duration-200 hover:border-[rgb(var(--color-primary))]/50 hover:bg-[rgb(var(--color-surface-alt))] hover:scale-105"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  )
}
