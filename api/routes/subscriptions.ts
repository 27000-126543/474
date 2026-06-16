import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()
const USER_ID = 'user-1'

router.get('/', (_req: Request, res: Response): void => {
  try {
    const subscriptions = db.prepare(`
      SELECT s.id as subId, s.autoDownload, s.createdAt as subAt,
             p.id, p.name, p.description, p.author, p.coverUrl, p.createdAt
      FROM subscriptions s
      INNER JOIN podcasts p ON s.podcastId = p.id
      WHERE s.userId = ?
      ORDER BY s.createdAt DESC
    `).all(USER_ID) as any[]

    const result = subscriptions.map((sub) => {
      const tags = db.prepare(`
        SELECT t.name FROM tags t
        INNER JOIN podcast_tags pt ON t.id = pt.tagId
        WHERE pt.podcastId = ?
      `).all(sub.id).map((t: any) => t.name)

      const subCount = (db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE podcastId = ?').get(sub.id) as { count: number }).count

      return {
        id: sub.id,
        name: sub.name,
        description: sub.description,
        author: sub.author,
        coverUrl: sub.coverUrl,
        subscribeCount: subCount,
        createdAt: sub.createdAt,
        tags,
        autoDownload: sub.autoDownload === 1,
      }
    })

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('获取订阅列表失败:', error)
    res.status(500).json({ success: false, error: '获取订阅列表失败' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { podcastId } = req.body
    if (!podcastId) {
      res.status(400).json({ success: false, error: '缺少podcastId参数' })
      return
    }

    const podcast = db.prepare('SELECT * FROM podcasts WHERE id = ?').get(podcastId)
    if (!podcast) {
      res.status(404).json({ success: false, error: '播客不存在' })
      return
    }

    const existing = db.prepare('SELECT * FROM subscriptions WHERE userId = ? AND podcastId = ?').get(USER_ID, podcastId)
    if (existing) {
      res.status(400).json({ success: false, error: '已经订阅了该播客' })
      return
    }

    const id = uuidv4()
    const now = new Date().toISOString()
    db.prepare('INSERT INTO subscriptions (id, userId, podcastId, autoDownload, createdAt) VALUES (?, ?, ?, ?, ?)').run(id, USER_ID, podcastId, 1, now)

    const latestEpisode = db.prepare(
      'SELECT id, title FROM episodes WHERE podcastId = ? ORDER BY publishDate DESC LIMIT 1'
    ).get(podcastId) as any
    if (latestEpisode) {
      const downloadId = uuidv4()
      try {
        db.prepare(
          'INSERT INTO downloads (id, userId, episodeId, podcastId, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(downloadId, USER_ID, latestEpisode.id, podcastId, 'completed', now)
      } catch {}

      const notifId = uuidv4()
      db.prepare(
        'INSERT INTO notifications (id, userId, type, title, content, podcastId, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        notifId, USER_ID, 'download', '自动下载完成',
        `「${podcast.name}」最新一集《${latestEpisode.title}》已下载完毕`,
        podcastId, 0, now
      )
    }

    res.json({ success: true, data: { id, userId: USER_ID, podcastId, autoDownload: true, createdAt: now } })
  } catch (error) {
    console.error('添加订阅失败:', error)
    res.status(500).json({ success: false, error: '添加订阅失败' })
  }
})

router.delete('/:podcastId', (req: Request, res: Response): void => {
  try {
    const { podcastId } = req.params
    const existing = db.prepare('SELECT * FROM subscriptions WHERE userId = ? AND podcastId = ?').get(USER_ID, podcastId)
    if (!existing) {
      res.status(404).json({ success: false, error: '未订阅该播客' })
      return
    }

    db.prepare('DELETE FROM subscriptions WHERE userId = ? AND podcastId = ?').run(USER_ID, podcastId)
    res.json({ success: true, data: null })
  } catch (error) {
    console.error('取消订阅失败:', error)
    res.status(500).json({ success: false, error: '取消订阅失败' })
  }
})

router.patch('/:podcastId', (req: Request, res: Response): void => {
  try {
    const { podcastId } = req.params
    const { autoDownload } = req.body

    if (typeof autoDownload === 'undefined') {
      res.status(400).json({ success: false, error: '缺少autoDownload参数' })
      return
    }

    const existing = db.prepare('SELECT * FROM subscriptions WHERE userId = ? AND podcastId = ?').get(USER_ID, podcastId) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '未订阅该播客' })
      return
    }

    db.prepare('UPDATE subscriptions SET autoDownload = ? WHERE userId = ? AND podcastId = ?').run(autoDownload ? 1 : 0, USER_ID, podcastId)

    if (autoDownload) {
      const podcast = db.prepare('SELECT id, name FROM podcasts WHERE id = ?').get(podcastId) as any
      const latestEpisode = db.prepare(
        'SELECT id, title FROM episodes WHERE podcastId = ? ORDER BY publishDate DESC LIMIT 1'
      ).get(podcastId) as any
      if (latestEpisode && podcast) {
        const downloadId = uuidv4()
        try {
          db.prepare(
            'INSERT INTO downloads (id, userId, episodeId, podcastId, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(downloadId, USER_ID, latestEpisode.id, podcastId, 'completed', new Date().toISOString())

          const notifId = uuidv4()
          db.prepare(
            'INSERT INTO notifications (id, userId, type, title, content, podcastId, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).run(
            notifId, USER_ID, 'download', '自动下载完成',
            `「${podcast.name}」最新一集《${latestEpisode.title}》已下载完毕`,
            podcastId, 0, new Date().toISOString()
          )
        } catch {}
      }
    }

    res.json({ success: true, data: { ...existing, autoDownload: autoDownload } })
  } catch (error) {
    console.error('更新订阅设置失败:', error)
    res.status(500).json({ success: false, error: '更新订阅设置失败' })
  }
})

export default router
