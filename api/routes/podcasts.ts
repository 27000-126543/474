import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { q, tag } = req.query

    let podcasts = db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.name) AS tagNames
      FROM podcasts p
      LEFT JOIN podcast_tags pt ON p.id = pt.podcastId
      LEFT JOIN tags t ON pt.tagId = t.id
      GROUP BY p.id
      ORDER BY (SELECT COUNT(*) FROM subscriptions s WHERE s.podcastId = p.id) DESC
    `).all() as any[]

    if (q && typeof q === 'string' && q.trim()) {
      const keyword = q.trim().toLowerCase()
      podcasts = podcasts.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.description.toLowerCase().includes(keyword) ||
          p.author.toLowerCase().includes(keyword)
      )
    }

    if (tag && typeof tag === 'string' && tag.trim()) {
      const tagName = tag.trim()
      podcasts = podcasts.filter((p) => {
        if (!p.tagNames) return false
        return p.tagNames.split(',').includes(tagName)
      })
    }

    const result = podcasts.map((p) => {
      const subCount = (db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE podcastId = ?').get(p.id) as { count: number }).count
      return {
        id: p.id,
        name: p.name,
        author: p.author,
        coverUrl: p.coverUrl,
        description: p.description,
        subscribeCount: subCount,
        createdAt: p.createdAt,
        tags: p.tagNames ? p.tagNames.split(',') : [],
      }
    })

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('获取播客列表失败:', error)
    res.status(500).json({ success: false, error: '获取播客列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const podcast = db.prepare('SELECT * FROM podcasts WHERE id = ?').get(id) as any

    if (!podcast) {
      res.status(404).json({ success: false, error: '播客不存在' })
      return
    }

    const tags = db.prepare(`
      SELECT t.name FROM tags t
      INNER JOIN podcast_tags pt ON t.id = pt.tagId
      WHERE pt.podcastId = ?
    `).all(id).map((t: any) => t.name)

    const subCount = (db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE podcastId = ?').get(id) as { count: number }).count
    const epCount = (db.prepare('SELECT COUNT(*) as count FROM episodes WHERE podcastId = ?').get(id) as { count: number }).count

    res.json({
      success: true,
      data: {
        id: podcast.id,
        name: podcast.name,
        author: podcast.author,
        coverUrl: podcast.coverUrl,
        description: podcast.description,
        subscribeCount: subCount,
        episodeCount: epCount,
        createdAt: podcast.createdAt,
        tags,
      },
    })
  } catch (error) {
    console.error('获取播客详情失败:', error)
    res.status(500).json({ success: false, error: '获取播客详情失败' })
  }
})

router.get('/:id/episodes', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const podcast = db.prepare('SELECT * FROM podcasts WHERE id = ?').get(id)
    if (!podcast) {
      res.status(404).json({ success: false, error: '播客不存在' })
      return
    }

    const episodes = db.prepare(
      'SELECT * FROM episodes WHERE podcastId = ? ORDER BY publishDate DESC'
    ).all(id)

    res.json({ success: true, data: episodes })
  } catch (error) {
    console.error('获取剧集列表失败:', error)
    res.status(500).json({ success: false, error: '获取剧集列表失败' })
  }
})

export default router
