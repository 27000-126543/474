import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()
const ADMIN_ID = 'admin-1'

router.get('/pending', (_req: Request, res: Response): void => {
  try {
    const requests = db.prepare(`
      SELECT ur.*, u.username
      FROM upload_requests ur
      INNER JOIN users u ON ur.userId = u.id
      ORDER BY ur.createdAt DESC
    `).all() as any[]

    const result = requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.podcastName,
      audioFormat: r.audioFormat,
      fileSize: r.fileSize,
      status: r.status,
      rejectReason: r.rejectReason,
      tags: r.tags ? r.tags.split(',') : [],
      createdAt: r.createdAt,
      username: r.username,
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('获取待审核列表失败:', error)
    res.status(500).json({ success: false, error: '获取待审核列表失败' })
  }
})

router.post('/approve/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const request = db.prepare('SELECT * FROM upload_requests WHERE id = ?').get(id) as any
    if (!request) {
      res.status(404).json({ success: false, error: '上传请求不存在' })
      return
    }

    if (request.status !== 'pending') {
      res.status(400).json({ success: false, error: '该请求已处理' })
      return
    }

    db.prepare("UPDATE upload_requests SET status = 'approved' WHERE id = ?").run(id)
    res.json({ success: true, data: { id, status: 'approved' } })
  } catch (error) {
    console.error('审批失败:', error)
    res.status(500).json({ success: false, error: '审批失败' })
  }
})

router.post('/reject/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { rejectReason } = req.body

    if (!rejectReason || !rejectReason.trim()) {
      res.status(400).json({ success: false, error: '请提供拒绝原因' })
      return
    }

    const request = db.prepare('SELECT * FROM upload_requests WHERE id = ?').get(id) as any
    if (!request) {
      res.status(404).json({ success: false, error: '上传请求不存在' })
      return
    }

    if (request.status !== 'pending') {
      res.status(400).json({ success: false, error: '该请求已处理' })
      return
    }

    db.prepare("UPDATE upload_requests SET status = 'rejected', rejectReason = ? WHERE id = ?").run(rejectReason.trim(), id)
    res.json({ success: true, data: { id, status: 'rejected', rejectReason: rejectReason.trim() } })
  } catch (error) {
    console.error('拒绝失败:', error)
    res.status(500).json({ success: false, error: '拒绝失败' })
  }
})

router.get('/tags', (_req: Request, res: Response): void => {
  try {
    const tags = db.prepare('SELECT * FROM tags ORDER BY name').all()
    res.json({ success: true, data: tags })
  } catch (error) {
    console.error('获取标签列表失败:', error)
    res.status(500).json({ success: false, error: '获取标签列表失败' })
  }
})

router.post('/tags', (req: Request, res: Response): void => {
  try {
    const { name } = req.body

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: '标签名称不能为空' })
      return
    }

    const existing = db.prepare('SELECT * FROM tags WHERE name = ?').get(name.trim())
    if (existing) {
      res.status(400).json({ success: false, error: '标签已存在' })
      return
    }

    const id = uuidv4()
    db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(id, name.trim())
    res.json({ success: true, data: { id, name: name.trim() } })
  } catch (error) {
    console.error('创建标签失败:', error)
    res.status(500).json({ success: false, error: '创建标签失败' })
  }
})

router.put('/tags/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name } = req.body

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: '标签名称不能为空' })
      return
    }

    const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: '标签不存在' })
      return
    }

    const duplicate = db.prepare('SELECT * FROM tags WHERE name = ? AND id != ?').get(name.trim(), id)
    if (duplicate) {
      res.status(400).json({ success: false, error: '标签名称已存在' })
      return
    }

    db.prepare('UPDATE tags SET name = ? WHERE id = ?').run(name.trim(), id)
    res.json({ success: true, data: { id, name: name.trim() } })
  } catch (error) {
    console.error('更新标签失败:', error)
    res.status(500).json({ success: false, error: '更新标签失败' })
  }
})

router.delete('/tags/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: '标签不存在' })
      return
    }

    db.prepare('DELETE FROM podcast_tags WHERE tagId = ?').run(id)
    db.prepare('DELETE FROM tags WHERE id = ?').run(id)
    res.json({ success: true, data: null })
  } catch (error) {
    console.error('删除标签失败:', error)
    res.status(500).json({ success: false, error: '删除标签失败' })
  }
})

export default router
