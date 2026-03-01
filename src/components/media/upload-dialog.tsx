'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, FileImage, FileVideo, X, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface FilePreview {
  file: File
  url: string
  type: 'image' | 'video'
}

export function UploadDialog() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews] = useState<FilePreview[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles: FilePreview[] = []

    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        toast.error(`"${file.name}" — tipe file tidak didukung.`)
        continue
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error(`"${file.name}" — melebihi batas 50MB.`)
        continue
      }

      validFiles.push({
        file,
        url: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video',
      })
    }

    setPreviews((prev) => [...prev, ...validFiles])
  }

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleUpload = async () => {
    if (previews.length === 0) return
    setUploading(true)

    try {
      const results = await Promise.all(
        previews.map(async (p) => {
          const formData = new FormData()
          formData.append('file', p.file)
          const res = await fetch('/api/upload', { method: 'POST', body: formData })
          const data = await res.json()
          return { name: p.file.name, ok: res.ok, error: data.error }
        })
      )

      const succeeded = results.filter((r) => r.ok).length
      const failed = results.filter((r) => !r.ok)

      if (succeeded > 0) {
        toast.success(`${succeeded} file berhasil diunggah!`)
      }
      for (const f of failed) {
        toast.error(`"${f.name}" gagal: ${f.error}`)
      }

      setOpen(false)
      clearAll()
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan saat mengunggah.')
    } finally {
      setUploading(false)
    }
  }

  const clearAll = () => {
    for (const p of previews) URL.revokeObjectURL(p.url)
    setPreviews([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) clearAll()
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20">
          <Upload className="w-4 h-4 mr-2" />
          Upload Media
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Upload Media Baru</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Unggah gambar (JPG, PNG, WebP) atau video (MP4, WebM). Maks 50MB per file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Drop zone / file picker — always visible when no files or to add more */}
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
            <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-blue-400 transition-colors">
              <Upload className="w-8 h-8" />
              <span className="text-sm font-medium">
                {previews.length === 0 ? 'Klik untuk memilih file' : 'Tambah file lainnya'}
              </span>
              <span className="text-xs text-zinc-600">
                Mendukung multi-select
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />
          </label>

          {/* File previews */}
          {previews.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {previews.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  {p.type === 'image' ? (
                    <FileImage className="w-5 h-5 text-blue-400 shrink-0" />
                  ) : (
                    <FileVideo className="w-5 h-5 text-violet-400 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-200 truncate">{p.file.name}</p>
                    <p className="text-xs text-zinc-500">
                      {(p.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => removePreview(idx)}
                    className="w-6 h-6 rounded-full text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500">
              {previews.length > 0 && (
                <>
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  {previews.length} file dipilih
                </>
              )}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setOpen(false); clearAll() }}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Batal
              </Button>
              <Button
                onClick={handleUpload}
                disabled={previews.length === 0 || uploading}
                className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengunggah...
                  </span>
                ) : (
                  `Upload ${previews.length > 0 ? `(${previews.length})` : ''}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
