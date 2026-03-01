import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    // Validate file type
    const allAllowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]
    if (!allAllowed.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung: ${file.type}. Gunakan JPG, PNG, WebP, GIF, MP4, atau WebM.` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file melebihi batas 50MB.` },
        { status: 400 }
      )
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Calculate SHA-256 checksum
    const checksum = createHash('sha256').update(buffer).digest('hex')

    // Check for duplicate in same organization
    const existing = await prisma.media.findUnique({
      where: {
        organizationId_checksum: {
          organizationId: session.user.organizationId,
          checksum,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `File ini sudah pernah diunggah dengan nama "${existing.name}".` },
        { status: 409 }
      )
    }

    // Determine media type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const mediaType = isImage ? 'IMAGE' : 'VIDEO'

    // Create directory structure
    const orgSlug = session.user.organizationSlug || 'default'
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', orgSlug)
    await fs.mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const ext = path.extname(file.name)
    const timestamp = Date.now()
    const safeBaseName = file.name
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 50)
    const fileName = `${safeBaseName}_${timestamp}${ext}`
    const filePath = path.join(uploadDir, fileName)

    // Write file to disk
    await fs.writeFile(filePath, buffer)

    // URL relative to /public
    const url = `/uploads/${orgSlug}/${fileName}`

    // Determine approval status based on role
    const role = session.user.role
    const approvalStatus = role === 'CONTENT_CREATOR' ? 'PENDING_REVIEW' : 'APPROVED'

    // Save to database
    const media = await prisma.media.create({
      data: {
        name: file.name.replace(ext, ''),
        originalName: file.name,
        type: mediaType,
        url,
        mimeType: file.type,
        fileSize: file.size,
        checksum,
        duration: null, // Will be set client-side for videos
        approvalStatus,
        organizationId: session.user.organizationId,
        uploadedById: session.user.id,
      },
    })

    return NextResponse.json({ success: true, media }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Gagal mengunggah file. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
