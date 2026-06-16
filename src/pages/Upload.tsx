import { useState, useRef } from 'react'
import {
  Upload,
  FileAudio,
  X,
  CheckCircle,
  AlertCircle,
  Tag
} from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import { useEffect } from 'react'

export default function UploadPage() {
  const [name, setName] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { tags, fetchTags } = useAdminStore()

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateFile = (f: File): string | null => {
    if (!name.trim()) {
      return '节目名称不能为空'
    }
    if (!f.type.includes('audio/mpeg') && !f.name.toLowerCase().endsWith('.mp3')) {
      return '音频格式仅限MP3'
    }
    if (f.size > 50 * 1024 * 1024) {
      return '音频文件大小不能超过50MB'
    }
    return null
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0]
      const err = validateFile(f)
      if (err) {
        setError(err)
        setFile(null)
      } else {
        setError(null)
        setFile(f)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      const err = validateFile(f)
      if (err) {
        setError(err)
        setFile(null)
      } else {
        setError(null)
        setFile(f)
      }
    }
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('节目名称不能为空')
      return
    }
    if (!file) {
      setError('请上传音频文件')
      return
    }
    const validation = validateFile(file)
    if (validation) {
      setError(validation)
      return
    }

    setError(null)
    setUploading(true)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          audioFormat: 'mp3',
          fileSize: file.size,
          tags: selectedTags
        })
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setName('')
        setFile(null)
        setSelectedTags([])
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || '上传失败')
      }
    } catch (err) {
      setError('上传失败，请稍后重试')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center">
          <Upload className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold text-warmgray-100">
            上传播客
          </h1>
          <p className="text-sm text-warmgray-500">
            上传你的播客节目，等待管理员审核
          </p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400">上传成功！节目已提交审核，请耐心等待。</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <label className="block text-sm font-medium text-warmgray-300 mb-2">
            节目名称 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error === '节目名称不能为空') setError(null)
            }}
            placeholder="请输入节目名称"
            className="input-field"
          />
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-warmgray-400" />
            <label className="block text-sm font-medium text-warmgray-300">
              分类标签
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.name)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedTags.includes(tag.name)
                    ? 'bg-amber-500 text-midnight'
                    : 'bg-warmgray-700/40 text-warmgray-400 hover:bg-warmgray-700/60'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-warmgray-300 mb-4">
            音频文件 <span className="text-red-400">*</span>
          </label>

          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-amber-500 bg-amber-500/5'
                  : 'border-warmgray-700/50 hover:border-amber-500/50 hover:bg-warmgray-700/10'
              }`}
            >
              <FileAudio className="w-14 h-14 text-warmgray-600 mx-auto mb-4" />
              <p className="text-warmgray-300 mb-2">拖拽文件到此处，或点击选择</p>
              <p className="text-sm text-warmgray-500">
                仅限 MP3 格式，文件大小不超过 50MB
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-warmgray-700/20 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <FileAudio className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-warmgray-100 font-medium truncate">{file.name}</p>
                <p className="text-sm text-warmgray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-2 text-warmgray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,audio/mpeg"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="card p-6 bg-warmgray-700/10 border-warmgray-700/30">
          <h4 className="text-sm font-medium text-warmgray-400 mb-3">上传须知</h4>
          <ul className="text-sm text-warmgray-500 space-y-1.5">
            <li>• 节目名称不能为空</li>
            <li>• 音频格式仅限 MP3</li>
            <li>• 音频文件大小不能超过 50MB</li>
            <li>• 提交后需等待管理员审核</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={uploading || !name.trim() || !file}
          className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? '上传中...' : '提交审核'}
        </button>
      </form>
    </div>
  )
}
