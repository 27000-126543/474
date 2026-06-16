import { useEffect, useState } from 'react'
import {
  Shield,
  Check,
  X,
  Tag as TagIcon,
  Plus,
  Pencil,
  Trash2,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useAdminStore, type UploadRequest, type Tag } from '@/stores/adminStore'

export default function Admin() {
  const {
    pendingUploads,
    tags,
    fetchPending,
    approveUpload,
    rejectUpload,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    loading
  } = useAdminStore()

  const [activeTab, setActiveTab] = useState<'pending' | 'tags'>('pending')
  const [newTagName, setNewTagName] = useState('')
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editName, setEditName] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    fetchPending()
    fetchTags()
  }, [fetchPending, fetchTags])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text })
    setTimeout(() => setActionMessage(null), 3000)
  }

  const handleApprove = async (id: string) => {
    const ok = await approveUpload(id)
    showMessage(ok ? 'success' : 'error', ok ? '已通过审核' : '操作失败')
  }

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return
    const ok = await rejectUpload(rejectId, rejectReason)
    showMessage(ok ? 'success' : 'error', ok ? '已拒绝' : '操作失败')
    setRejectId(null)
    setRejectReason('')
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    const ok = await createTag(newTagName.trim())
    if (ok) {
      setNewTagName('')
      showMessage('success', '标签创建成功')
    } else {
      showMessage('error', '创建失败，标签可能已存在')
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !editName.trim()) return
    const ok = await updateTag(editingTag.id, editName.trim())
    if (ok) {
      setEditingTag(null)
      setEditName('')
      showMessage('success', '标签更新成功')
    } else {
      showMessage('error', '更新失败')
    }
  }

  const handleDeleteTag = async (id: string) => {
    if (!confirm('确定要删除这个标签吗？')) return
    const ok = await deleteTag(id)
    showMessage(ok ? 'success' : 'error', ok ? '标签已删除' : '删除失败')
  }

  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: '待审核', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock },
    approved: { label: '已通过', color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: CheckCircle },
    rejected: { label: '已拒绝', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle }
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center">
          <Shield className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold text-warmgray-100">
            管理员面板
          </h1>
          <p className="text-sm text-warmgray-500">
            节目审核与标签管理
          </p>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-midnight'
              : 'bg-deepnavy text-warmgray-400 hover:text-warmgray-100'
          }`}
        >
          待审核
          {pendingUploads.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-midnight/20">
              {pendingUploads.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
            activeTab === 'tags'
              ? 'bg-amber-500 text-midnight'
              : 'bg-deepnavy text-warmgray-400 hover:text-warmgray-100'
          }`}
        >
          标签管理
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="card overflow-hidden">
          {loading && pendingUploads.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : pendingUploads.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-400/30 mx-auto mb-4" />
              <p className="text-warmgray-500">暂无待审核内容</p>
            </div>
          ) : (
            <div className="divide-y divide-warmgray-700/30">
              {pendingUploads.map((req) => {
                const status = statusLabels[req.status]
                const StatusIcon = status.icon
                return (
                  <div
                    key={req.id}
                    className="p-5 flex items-center gap-4 hover:bg-warmgray-700/10 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-warmgray-600 to-warmgray-800 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-warmgray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-warmgray-100 truncate">
                          {req.name}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-warmgray-500">
                        {req.tags?.length > 0 && (
                          <div className="flex gap-1">
                            {req.tags.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 bg-warmgray-700/40 rounded text-xs"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        <span>
                          上传于 {new Date(req.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="p-2.5 rounded-xl bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
                          title="通过"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setRejectId(req.id)
                            setRejectReason('')
                          }}
                          className="p-2.5 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                          title="拒绝"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-warmgray-100 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              添加新标签
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                placeholder="输入标签名称"
                className="input-field flex-1"
              />
              <button onClick={handleCreateTag} className="btn-primary">
                添加
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-warmgray-100 mb-4 flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-amber-500" />
              所有标签 ({tags.length})
            </h3>
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-warmgray-700/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <TagIcon className="w-4 h-4 text-amber-500" />
                  </div>
                  {editingTag?.id === tag.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="input-field flex-1 py-1.5 px-3"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateTag()
                          if (e.key === 'Escape') {
                            setEditingTag(null)
                            setEditName('')
                          }
                        }}
                      />
                      <button
                        onClick={handleUpdateTag}
                        className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTag(null)
                          setEditName('')
                        }}
                        className="p-2 text-warmgray-400 hover:bg-warmgray-700/30 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-warmgray-200">{tag.name}</span>
                      <button
                        onClick={() => {
                          setEditingTag(tag)
                          setEditName(tag.name)
                        }}
                        className="p-2 text-warmgray-400 hover:text-warmgray-100 hover:bg-warmgray-700/30 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-2 text-warmgray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="font-serif text-xl font-bold text-warmgray-100 mb-4">
              拒绝原因
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请填写拒绝原因..."
              rows={4}
              className="input-field resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRejectId(null)
                  setRejectReason('')
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="btn-danger"
                disabled={!rejectReason.trim()}
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
