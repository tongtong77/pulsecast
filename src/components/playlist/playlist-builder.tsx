'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Media, PlaylistItem } from '@/generated/prisma/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  GripVertical,
  Plus,
  Trash2,
  FileImage,
  FileVideo,
  Save,
  Loader2,
  Clock,
  Sparkles,
  ImageOff,
} from 'lucide-react'
import { updatePlaylistItems } from '@/lib/actions/playlist'
import { toast } from 'sonner'

type BuilderItem = {
  id: string
  mediaId: string
  media: Media
  order: number
  duration: number
  transition: string
}

const TRANSITIONS = [
  { value: 'NONE', label: 'Tanpa Transisi' },
  { value: 'FADE', label: 'Fade' },
  { value: 'SLIDE_LEFT', label: 'Geser Kiri' },
  { value: 'SLIDE_RIGHT', label: 'Geser Kanan' },
  { value: 'SLIDE_UP', label: 'Geser Atas' },
  { value: 'SLIDE_DOWN', label: 'Geser Bawah' },
  { value: 'ZOOM_IN', label: 'Zoom In' },
  { value: 'ZOOM_OUT', label: 'Zoom Out' },
]

export function PlaylistBuilder({
  playlistId,
  initialItems,
  allMedia,
}: {
  playlistId: string
  initialItems: (PlaylistItem & { media: Media })[]
  allMedia: Media[]
}) {
  const router = useRouter()
  const [items, setItems] = useState<BuilderItem[]>(
    initialItems.map((item) => ({
      id: item.id,
      mediaId: item.mediaId,
      media: item.media,
      order: item.order,
      duration: item.duration,
      transition: item.transition,
    }))
  )
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const addMedia = useCallback(
    (media: Media) => {
      setItems((prev) => [
        ...prev,
        {
          id: `temp_${Date.now()}`,
          mediaId: media.id,
          media,
          order: prev.length,
          duration: 10,
          transition: 'FADE',
        },
      ])
    },
    []
  )

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateItem = useCallback(
    (index: number, field: 'duration' | 'transition', value: number | string) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      )
    },
    []
  )

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return

    setItems((prev) => {
      const newItems = [...prev]
      const [removed] = newItems.splice(dragIndex, 1)
      newItems.splice(index, 0, removed)
      return newItems
    })
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePlaylistItems({
        playlistId,
        items: items.map((item, index) => ({
          mediaId: item.mediaId,
          order: index,
          duration: item.duration,
          transition: item.transition as Parameters<typeof updatePlaylistItems>[0]['items'][0]['transition'],
        })),
      })
      toast.success('Playlist berhasil disimpan!')
      router.refresh()
    } catch {
      toast.error('Gagal menyimpan playlist.')
    } finally {
      setSaving(false)
    }
  }

  // Media not yet in playlist
  const availableMedia = allMedia.filter(
    (m) => !items.some((i) => i.mediaId === m.id)
  )

  const totalDuration = items.reduce((sum, item) => sum + item.duration, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Playlist items */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Clock className="w-4 h-4" />
            {items.length} item • Total {totalDuration}s
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan Perubahan
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
            <Sparkles className="w-12 h-12 mb-3 text-zinc-700" />
            <p className="font-medium text-zinc-400">Playlist kosong</p>
            <p className="text-sm mt-1">
              Pilih media dari panel kanan untuk memulai
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={`${item.mediaId}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-zinc-900/50 transition-all ${
                  dragIndex === index
                    ? 'border-blue-500/50 bg-blue-500/5 scale-[0.98]'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Order number */}
                <span className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-400 text-xs flex items-center justify-center font-mono">
                  {index + 1}
                </span>

                {/* Thumbnail */}
                <div className="w-16 h-10 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                  {item.media.type === 'IMAGE' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.media.url}
                      alt={item.media.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileVideo className="w-5 h-5 text-violet-400" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">
                    {item.media.name}
                  </p>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={3600}
                    value={item.duration}
                    onChange={(e) =>
                      updateItem(index, 'duration', parseInt(e.target.value) || 10)
                    }
                    className="w-16 h-8 bg-zinc-800 border-zinc-700 text-zinc-200 text-center text-xs"
                  />
                  <span className="text-[10px] text-zinc-500">dtk</span>
                </div>

                {/* Transition */}
                <Select
                  value={item.transition}
                  onValueChange={(v) => updateItem(index, 'transition', v)}
                >
                  <SelectTrigger className="w-32 h-8 bg-zinc-800 border-zinc-700 text-zinc-300 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {TRANSITIONS.map((t) => (
                      <SelectItem
                        key={t.value}
                        value={t.value}
                        className="text-zinc-300 focus:bg-zinc-800 text-xs"
                      >
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Remove */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="w-8 h-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Media picker */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Media Library
        </h3>
        <ScrollArea className="h-[calc(100vh-280px)]">
          {availableMedia.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-zinc-500">
              <ImageOff className="w-8 h-8 mb-2 text-zinc-700" />
              <p className="text-xs">Semua media sudah ditambahkan</p>
            </div>
          ) : (
            <div className="space-y-2 pr-3">
              {availableMedia.map((media) => (
                <button
                  key={media.id}
                  onClick={() => addMedia(media)}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left group"
                >
                  {/* Thumb */}
                  <div className="w-12 h-8 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                    {media.type === 'IMAGE' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={media.url}
                        alt={media.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileVideo className="w-4 h-4 text-violet-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 truncate">
                      {media.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] mt-0.5 ${
                        media.type === 'IMAGE'
                          ? 'border-blue-500/20 text-blue-400'
                          : 'border-violet-500/20 text-violet-400'
                      }`}
                    >
                      {media.type === 'IMAGE' ? (
                        <FileImage className="w-2.5 h-2.5 mr-0.5" />
                      ) : (
                        <FileVideo className="w-2.5 h-2.5 mr-0.5" />
                      )}
                      {media.type}
                    </Badge>
                  </div>
                  <Plus className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
