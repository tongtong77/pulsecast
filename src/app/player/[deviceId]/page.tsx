import { getPlayableContent } from '@/lib/actions/player'
import { PlaybackEngine } from '@/components/player/playback-engine'
import { IdleScreen } from '@/components/player/idle-screen'
import { TickerMarquee } from '@/components/player/ticker-marquee'
import { InfoWidget } from '@/components/player/info-widget'
import { SSEListener } from '@/components/player/sse-listener'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ deviceId: string }>
}) {
  const { deviceId } = await params
  const content = await getPlayableContent(deviceId)

  if (content.status === 'NOT_FOUND') notFound()

  const brandColor = content.organization?.brandColor ?? '#3b82f6'
  const logoUrl = content.organization?.logoUrl ?? content.organization?.logo ?? null

  if (content.status === 'IDLE') {
    return (
      <>
        <SSEListener deviceId={content.device!.id} />
        <IdleScreen
          deviceId={content.device!.id}
          deviceName={content.device!.name}
          organizationName={content.organization!.name}
          organizationLogo={logoUrl}
          brandColor={brandColor}
        />
      </>
    )
  }

  const layoutType = content.device!.layoutType || 'FULLSCREEN'
  const tickerText = content.device!.tickerText

  // ========== MULTI-ZONE: BOTTOM_TICKER ==========
  if (layoutType === 'BOTTOM_TICKER' && tickerText) {
    return (
      <div className="h-screen w-screen flex flex-col bg-black overflow-hidden">
        <SSEListener deviceId={content.device!.id} />
        <div className="flex-1" style={{ height: '90%' }}>
          <PlaybackEngine
            deviceId={content.device!.id}
            items={content.items}
            playlistId={content.playlistId ?? undefined}
            organizationName={content.organization!.name}
            organizationLogo={logoUrl}
          />
        </div>
        <div style={{ height: '10%' }}>
          <TickerMarquee text={tickerText} brandColor={brandColor} />
        </div>
      </div>
    )
  }

  // ========== MULTI-ZONE: SPLIT_VERTICAL (2-column) ==========
  if (layoutType === 'SPLIT_VERTICAL') {
    return (
      <div className="h-screen w-screen grid grid-cols-[1fr_320px] bg-black overflow-hidden">
        <SSEListener deviceId={content.device!.id} />
        {/* Left: Main media content */}
        <div className="h-full">
          <PlaybackEngine
            deviceId={content.device!.id}
            items={content.items}
            playlistId={content.playlistId ?? undefined}
            organizationName={content.organization!.name}
            organizationLogo={logoUrl}
          />
        </div>
        {/* Right: Info Widget (clock, logo, date) */}
        <div className="h-full border-l border-zinc-800">
          <InfoWidget
            organizationName={content.organization!.name}
            organizationLogo={logoUrl}
            brandColor={brandColor}
          />
        </div>
      </div>
    )
  }

  // ========== MULTI-ZONE: L_SHAPE ==========
  if (layoutType === 'L_SHAPE') {
    return (
      <div className="h-screen w-screen grid grid-rows-[1fr_80px] bg-black overflow-hidden">
        <SSEListener deviceId={content.device!.id} />
        {/* Top row: main content + sidebar */}
        <div className="grid grid-cols-[1fr_280px]">
          {/* Main content (75%) */}
          <div className="h-full">
            <PlaybackEngine
              deviceId={content.device!.id}
              items={content.items}
              playlistId={content.playlistId ?? undefined}
              organizationName={content.organization!.name}
              organizationLogo={logoUrl}
            />
          </div>
          {/* Right sidebar (25%) — info widget */}
          <div className="h-full border-l border-zinc-800">
            <InfoWidget
              organizationName={content.organization!.name}
              organizationLogo={logoUrl}
              brandColor={brandColor}
            />
          </div>
        </div>
        {/* Bottom bar — ticker */}
        <div className="border-t border-zinc-800">
          <TickerMarquee
            text={tickerText || content.organization!.name}
            brandColor={brandColor}
          />
        </div>
      </div>
    )
  }

  // ========== DEFAULT: FULLSCREEN ==========
  return (
    <>
      <SSEListener deviceId={content.device!.id} />
      <PlaybackEngine
        deviceId={content.device!.id}
        items={content.items}
        playlistId={content.playlistId ?? undefined}
        organizationName={content.organization!.name}
        organizationLogo={logoUrl}
      />
    </>
  )
}
