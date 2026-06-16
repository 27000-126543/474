import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()
const USER_ID = 'user-1'

router.get('/', (_req: Request, res: Response): void => {
  try {
    const subscribedPodcasts = db.prepare(
      'SELECT podcastId FROM subscriptions WHERE userId = ?'
    ).all(USER_ID) as { podcastId: string }[]

    const subscribedIds = new Set(subscribedPodcasts.map((s) => s.podcastId))

    const recommendedPodcasts: any[] = []
    const addedIds = new Set(subscribedIds)

    if (subscribedIds.size > 0) {
      const userTags = new Map<string, number>()
      for (const podcastId of subscribedIds) {
        const tags = db.prepare(`
          SELECT t.id, t.name FROM tags t
          INNER JOIN podcast_tags pt ON t.id = pt.tagId
          WHERE pt.podcastId = ?
        `).all(podcastId) as { id: string; name: string }[]

        for (const tag of tags) {
          userTags.set(tag.id, (userTags.get(tag.id) || 0) + 1)
        }
      }

      const sortedTags = [...userTags.entries()].sort((a, b) => b[1] - a[1])

      for (const [tagId] of sortedTags) {
        const podcastsWithTag = db.prepare(`
          SELECT p.* FROM podcasts p
          INNER JOIN podcast_tags pt ON p.id = pt.podcastId
          WHERE pt.tagId = ?
        `).all(tagId) as any[]

        for (const podcast of podcastsWithTag) {
          if (!addedIds.has(podcast.id)) {
            addedIds.add(podcast.id)

            const tags = db.prepare(`
              SELECT t.name FROM tags t
              INNER JOIN podcast_tags pt ON t.id = pt.tagId
              WHERE pt.podcastId = ?
            `).all(podcast.id).map((t: any) => t.name)

            const subCount = (db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE podcastId = ?').get(podcast.id) as { count: number }).count

            recommendedPodcasts.push({
              id: podcast.id,
              name: podcast.name,
              author: podcast.author,
              coverUrl: podcast.coverUrl,
              description: podcast.description,
              subscribeCount: subCount,
              createdAt: podcast.createdAt,
              tags,
              matchReason: `基于你喜欢的「${tags[0] || ''}」标签推荐`,
            })
          }
        }

        if (recommendedPodcasts.length >= 10) break
      }
    }

    if (recommendedPodcasts.length < 4) {
      const allPodcasts = db.prepare(`
        SELECT p.*, GROUP_CONCAT(t.name) AS tagNames
        FROM podcasts p
        LEFT JOIN podcast_tags pt ON p.id = pt.podcastId
        LEFT JOIN tags t ON pt.tagId = t.id
        GROUP BY p.id
        ORDER BY RANDOM()
        LIMIT 10
      `).all() as any[]

      for (const podcast of allPodcasts) {
        if (!addedIds.has(podcast.id)) {
          addedIds.add(podcast.id)
          const subCount = (db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE podcastId = ?').get(podcast.id) as { count: number }).count
          recommendedPodcasts.push({
            id: podcast.id,
            name: podcast.name,
            author: podcast.author,
            coverUrl: podcast.coverUrl,
            description: podcast.description,
            subscribeCount: subCount,
            createdAt: podcast.createdAt,
            tags: podcast.tagNames ? podcast.tagNames.split(',') : [],
            matchReason: '热门精选',
          })
          if (recommendedPodcasts.length >= 6) break
        }
      }
    }

    const finalList = recommendedPodcasts.slice(0, 8)

    const now = new Date().toISOString()
    for (const podcast of finalList) {
      const existingNotif = db.prepare(
        'SELECT id FROM notifications WHERE userId = ? AND type = ? AND podcastId = ?'
      ).get(USER_ID, 'recommendation', podcast.id) as any

      if (!existingNotif) {
        const notifId = uuidv4()
        db.prepare(
          'INSERT INTO notifications (id, userId, type, title, content, podcastId, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          notifId, USER_ID, 'recommendation',
          `为你推荐：${podcast.name}`,
          podcast.matchReason || '根据你的收听偏好为你精选推荐',
          podcast.id, 0, now
        )
      }
    }

    res.json({ success: true, data: finalList })
  } catch (error) {
    console.error('获取推荐失败:', error)
    res.status(500).json({ success: false, error: '获取推荐失败' })
  }
})

export default router
