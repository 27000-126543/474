import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()
const USER_ID = 'user-1'

router.get('/', (_req: Request, res: Response): void => {
  try {
    const downloads = db.prepare(
      'SELECT episodeId, podcastId, status, createdAt FROM downloads WHERE userId = ?'
    ).all(USER_ID) as any[]

    const result = downloads.map((d) => ({
      episodeId: d.episodeId,
      podcastId: d.podcastId,
      status: d.status,
      createdAt: d.createdAt,
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('获取下载列表失败:', error)
    res.status(500).json({ success: false, error: '获取下载列表失败' })
  }
})

router.post('/episodes/:episodeId', (req: Request, res: Response): void => {
  try {
    const { episodeId } = req.params

    const episode = db.prepare(
      'SELECT id, podcastId FROM episodes WHERE id = ?'
    ).get(episodeId) as any

    if (!episode) {
      res.status(404).json({ success: false, error: '剧集不存在' })
      return
    }

    const id = uuidv4()
    const now = new Date().toISOString()

    try {
      db.prepare(
        'INSERT INTO downloads (id, userId, episodeId, podcastId, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, USER_ID, episodeId, episode.podcastId, 'completed', now)
    } catch {
      res.json({ success: true, data: { episodeId, podcastId: episode.podcastId, status: 'completed' } })
      return
    }

    res.json({
      success: true,
      data: { episodeId, podcastId: episode.podcastId, status: 'completed' },
    })
  } catch (error) {
    console.error('下载失败:', error)
    res.status(500).json({ success: false, error: '下载失败' })
  }
})

router.delete('/episodes/:episodeId', (req: Request, res: Response): void => {
  try {
    const { episodeId } = req.params
    db.prepare(
      'DELETE FROM downloads WHERE userId = ? AND episodeId = ?'
    ).run(USER_ID, episodeId)
    res.json({ success: true, data: null })
  } catch (error) {
    console.error('删除下载失败:', error)
    res.status(500).json({ success: false, error: '删除下载失败' })
  }
})

export default router
