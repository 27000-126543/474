import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()
const USER_ID = 'user-1'
const MAX_FILE_SIZE = 50 * 1024 * 1024

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, audioFormat, fileSize, tags } = req.body

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: '节目名称不能为空' })
      return
    }

    if (!audioFormat || audioFormat.toLowerCase() !== 'mp3') {
      res.status(400).json({ success: false, error: '音频格式仅限MP3' })
      return
    }

    if (!fileSize || fileSize > MAX_FILE_SIZE) {
      res.status(400).json({ success: false, error: '音频文件大小不能超过50MB' })
      return
    }

    const id = uuidv4()
    const now = new Date().toISOString()
    const tagStr = tags && Array.isArray(tags) ? tags.join(',') : ''

    db.prepare(
      `INSERT INTO upload_requests (id, userId, podcastName, audioFormat, fileSize, status, rejectReason, createdAt, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, USER_ID, name.trim(), 'MP3', fileSize, 'pending', '', now, tagStr)

    res.json({
      success: true,
      data: {
        id,
        userId: USER_ID,
        name: name.trim(),
        audioFormat: 'MP3',
        fileSize,
        tags: tags || [],
        status: 'pending',
        createdAt: now,
      },
    })
  } catch (error) {
    console.error('上传请求失败:', error)
    res.status(500).json({ success: false, error: '上传请求失败，请稍后重试' })
  }
})

export default router
