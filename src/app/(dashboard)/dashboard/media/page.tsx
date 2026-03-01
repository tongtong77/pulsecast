import { getMedia } from '@/lib/actions/media'
import { UploadDialog } from '@/components/media/upload-dialog'
import { MediaGrid } from '@/components/media/media-grid'
import { Image } from 'lucide-react'

export default async function MediaPage() {
  const media = await getMedia()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Image className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Media Library</h1>
            <p className="text-sm text-zinc-400">
              {media.length} file • Kelola gambar dan video untuk signage Anda
            </p>
          </div>
        </div>
        <UploadDialog />
      </div>

      {/* Grid */}
      <MediaGrid media={media} />
    </div>
  )
}
