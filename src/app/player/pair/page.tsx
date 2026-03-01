'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { pairDevice } from '@/lib/actions/player'
import { Monitor, Loader2 } from 'lucide-react'

export default function PairPage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ deviceName: string; orgName: string } | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Check if already paired
  useEffect(() => {
    const deviceId = localStorage.getItem('signage_device_id')
    if (deviceId) {
      router.replace(`/player/${deviceId}`)
    }
  }, [router])

  const handleInput = (index: number, value: string) => {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1)
    const newCode = [...code]
    newCode[index] = char
    setCode(newCode)
    setError('')

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all filled
    if (char && index === 5 && newCode.every((c) => c)) {
      handleSubmit(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newCode = pasted.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
      handleSubmit(pasted)
    }
  }

  const handleSubmit = async (pairingCode: string) => {
    setLoading(true)
    setError('')
    try {
      const result = await pairDevice(pairingCode)
      if (result.error) {
        setError(result.error)
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else if (result.success && result.deviceId) {
        localStorage.setItem('signage_device_id', result.deviceId)
        setSuccess({
          deviceName: result.deviceName!,
          orgName: result.organization!.name,
        })
        setTimeout(() => router.replace(`/player/${result.deviceId}`), 2000)
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-zinc-950 via-blue-950/20 to-zinc-950">
        <div className="text-center animate-pulse">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Monitor className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-emerald-400 mb-2">Pairing Berhasil!</h1>
          <p className="text-zinc-400">{success.deviceName} • {success.orgName}</p>
          <p className="text-zinc-600 text-sm mt-4">Memulai player...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-zinc-950 via-blue-950/20 to-zinc-950">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-8">
          <Monitor className="w-10 h-10 text-blue-400" />
        </div>

        <h1 className="text-3xl font-bold text-zinc-100 mb-2">
          Digital Signage
        </h1>
        <p className="text-zinc-400 mb-10">
          Masukkan kode pairing dari dashboard Admin
        </p>

        {/* OTP-style input */}
        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {code.map((char, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="text"
              maxLength={1}
              value={char}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className={`w-14 h-16 text-center text-2xl font-mono font-bold rounded-xl border-2 bg-zinc-900/50 outline-none transition-all ${
                error
                  ? 'border-red-500/50 text-red-400'
                  : char
                    ? 'border-blue-500/50 text-blue-400'
                    : 'border-zinc-700 text-zinc-200 focus:border-blue-500/50'
              }`}
            />
          ))}
        </div>

        {/* Status */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Memverifikasi kode...</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <p className="text-xs text-zinc-600 mt-8">
          Kode pairing tersedia di Dashboard → Layar TV → Tambah Device
        </p>
      </div>
    </div>
  )
}
