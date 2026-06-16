import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()
const USER_ID = 'user-1'

router.post('/', (req: Request, res: Response): void => {
  try {
    const { episodeId, podcastId, duration, position, completed } = req.body

    if (!episodeId || !podcastId) {
      res.status(400).json({ success: false, error: '缺少episodeId或podcastId' })
      return
    }

    const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId)
    if (!episode) {
      res.status(404).json({ success: false, error: '剧集不存在' })
      return
    }

    const id = uuidv4()
    const now = new Date().toISOString()
    db.prepare(
      'INSERT INTO listen_history (id, userId, episodeId, podcastId, duration, position, completed, listenedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, USER_ID, episodeId, podcastId, duration || 0, position || 0, completed ? 1 : 0, now)

    res.json({
      success: true,
      data: { id, userId: USER_ID, episodeId, podcastId, duration: duration || 0, position: position || 0, completed: completed ? 1 : 0, listenedAt: now },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '记录收听历史失败' })
  }
})

router.get('/history', (_req: Request, res: Response): void => {
  try {
    const history = db.prepare(`
      SELECT lh.*, e.title as episodeTitle, e.duration as episodeDuration, e.publishDate,
             p.name as podcastName, p.author as podcastAuthor
      FROM listen_history lh
      INNER JOIN episodes e ON lh.episodeId = e.id
      INNER JOIN podcasts p ON lh.podcastId = p.id
      WHERE lh.userId = ?
      ORDER BY lh.listenedAt DESC
    `).all(USER_ID) as any[]

    const result = history.map((h) => ({
      id: h.id,
      userId: h.userId,
      episodeId: h.episodeId,
      podcastId: h.podcastId,
      duration: h.duration,
      position: h.position,
      completed: h.completed,
      listenedAt: h.listenedAt,
      episode: {
        id: h.episodeId,
        title: h.episodeTitle,
        duration: h.episodeDuration,
        publishDate: h.publishDate,
      },
      podcast: {
        id: h.podcastId,
        name: h.podcastName,
        author: h.podcastAuthor,
      },
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取收听历史失败' })
  }
})

router.post('/episodes/:id/notes', (req: Request, res: Response): void => {
  try {
    const { id: episodeId } = req.params
    const { content, rating } = req.body

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, error: '笔记内容不能为空' })
      return
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      res.status(400).json({ success: false, error: '评分必须在1-5之间' })
      return
    }

    const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId)
    if (!episode) {
      res.status(404).json({ success: false, error: '剧集不存在' })
      return
    }

    const noteId = uuidv4()
    const now = new Date().toISOString()
    db.prepare(
      'INSERT INTO episode_notes (id, userId, episodeId, content, rating, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(noteId, USER_ID, episodeId, content.trim(), rating || 0, now)

    res.json({
      success: true,
      data: { id: noteId, userId: USER_ID, episodeId, content: content.trim(), rating: rating || 0, createdAt: now },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '添加笔记失败' })
  }
})

router.get('/episodes/:id/notes', (req: Request, res: Response): void => {
  try {
    const { id: episodeId } = req.params
    const notes = db.prepare(
      'SELECT * FROM episode_notes WHERE episodeId = ? ORDER BY createdAt DESC'
    ).all(episodeId)

    res.json({ success: true, data: notes })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取笔记失败' })
  }
})

export default router
