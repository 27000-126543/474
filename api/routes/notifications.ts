import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()
const USER_ID = 'user-1'

router.get('/', (_req: Request, res: Response): void => {
  try {
    const notifications = db.prepare(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC'
    ).all(USER_ID) as any[]

    const result = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      podcastId: n.podcastId,
      read: n.read === 1,
      createdAt: n.createdAt,
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('获取通知列表失败:', error)
    res.status(500).json({ success: false, error: '获取通知列表失败' })
  }
})

router.post('/:id/read', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    db.prepare(
      'UPDATE notifications SET read = 1 WHERE userId = ? AND id = ?'
    ).run(USER_ID, id)
    res.json({ success: true, data: null })
  } catch (error) {
    console.error('标记已读失败:', error)
    res.status(500).json({ success: false, error: '标记已读失败' })
  }
})

router.post('/read-all', (_req: Request, res: Response): void => {
  try {
    db.prepare(
      'UPDATE notifications SET read = 1 WHERE userId = ?'
    ).run(USER_ID)
    res.json({ success: true, data: null })
  } catch (error) {
    console.error('全部已读失败:', error)
    res.status(500).json({ success: false, error: '全部已读失败' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    db.prepare(
      'DELETE FROM notifications WHERE userId = ? AND id = ?'
    ).run(USER_ID, id)
    res.json({ success: true, data: null })
  } catch (error) {
    console.error('删除通知失败:', error)
    res.status(500).json({ success: false, error: '删除通知失败' })
  }
})

export default router
