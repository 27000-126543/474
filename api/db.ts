import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const dbDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'podcast.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'normal',
    avatar TEXT DEFAULT '',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS podcasts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT NOT NULL,
    coverUrl TEXT DEFAULT '',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS episodes (
    id TEXT PRIMARY KEY,
    podcastId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    audioUrl TEXT DEFAULT '',
    publishDate TEXT NOT NULL,
    playCount INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (podcastId) REFERENCES podcasts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS podcast_tags (
    podcastId TEXT NOT NULL,
    tagId TEXT NOT NULL,
    PRIMARY KEY (podcastId, tagId),
    FOREIGN KEY (podcastId) REFERENCES podcasts(id) ON DELETE CASCADE,
    FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    podcastId TEXT NOT NULL,
    autoDownload INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    UNIQUE(userId, podcastId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (podcastId) REFERENCES podcasts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS listen_history (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    episodeId TEXT NOT NULL,
    podcastId TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    listenedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (episodeId) REFERENCES episodes(id) ON DELETE CASCADE,
    FOREIGN KEY (podcastId) REFERENCES podcasts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS episode_notes (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    episodeId TEXT NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (episodeId) REFERENCES episodes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS upload_requests (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    podcastName TEXT NOT NULL,
    audioFormat TEXT NOT NULL,
    fileSize INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    rejectReason TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS downloads (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    episodeId TEXT NOT NULL,
    podcastId TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    createdAt TEXT NOT NULL,
    UNIQUE(userId, episodeId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (episodeId) REFERENCES episodes(id) ON DELETE CASCADE,
    FOREIGN KEY (podcastId) REFERENCES podcasts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    podcastId TEXT DEFAULT '',
    read INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS weekly_reports (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    weekStart TEXT NOT NULL,
    weekEnd TEXT NOT NULL,
    totalDuration INTEGER NOT NULL DEFAULT 0,
    consecutiveDays INTEGER NOT NULL DEFAULT 0,
    longestStreak INTEGER NOT NULL DEFAULT 0,
    totalEpisodes INTEGER NOT NULL DEFAULT 0,
    completedEpisodes INTEGER NOT NULL DEFAULT 0,
    favoritePodcasts TEXT DEFAULT '',
    dailyBreakdown TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    UNIQUE(userId, weekStart),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
`)

try {
  db.prepare('SELECT tags FROM upload_requests LIMIT 1').get()
} catch {
  db.exec('ALTER TABLE upload_requests ADD COLUMN tags TEXT DEFAULT ""')
}

const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count
if (userCount === 0) {
  const now = new Date().toISOString()

  const insertUser = db.prepare(
    'INSERT INTO users (id, username, email, role, avatar, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  )
  insertUser.run('admin-1', '管理员', 'admin@podcast.com', 'admin', '', now)
  insertUser.run('user-1', '普通用户', 'user@podcast.com', 'normal', '', now)

  const insertTag = db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)')
  const tags = [
    { id: 'tag-1', name: '科技' },
    { id: 'tag-2', name: '商业' },
    { id: 'tag-3', name: '文化' },
    { id: 'tag-4', name: '社会' },
    { id: 'tag-5', name: '心理' },
    { id: 'tag-6', name: '音乐' },
    { id: 'tag-7', name: '历史' },
    { id: 'tag-8', name: '教育' },
  ]
  for (const tag of tags) {
    insertTag.run(tag.id, tag.name)
  }

  const insertPodcast = db.prepare(
    'INSERT INTO podcasts (id, name, description, author, coverUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const coverPrompt = 'podcast%20cover%20art%20minimalist%20abstract'
  const podcasts = [
    { id: 'pod-1', name: '科技前沿', description: '探索最新科技趋势和创新，从人工智能到量子计算，带你走在科技最前沿', author: '张明', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20blue%20tech&image_size=square` },
    { id: 'pod-2', name: '商业洞察', description: '深度解析商业案例，分享创业经验，解读市场趋势和商业逻辑', author: '李华', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20gold%20business&image_size=square` },
    { id: 'pod-3', name: '文化漫谈', description: '聊文学、聊电影、聊艺术，在文化的海洋中寻找精神的栖息地', author: '王芳', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20purple%20art&image_size=square` },
    { id: 'pod-4', name: '社会观察', description: '关注社会热点，用理性和温度解读社会现象，探讨公共议题', author: '陈伟', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20green%20society&image_size=square` },
    { id: 'pod-5', name: '心灵驿站', description: '探索内心世界，分享心理健康知识，陪你走过每一个情绪低谷', author: '刘婷', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20pink%20calm&image_size=square` },
    { id: 'pod-6', name: '音乐空间', description: '发现好音乐，了解音乐背后的故事，从古典到电子，音乐无界', author: '赵磊', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20orange%20music&image_size=square` },
    { id: 'pod-7', name: '历史长廊', description: '穿越时空，重温历史故事，以古鉴今，从历史中汲取智慧', author: '孙强', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20brown%20history&image_size=square` },
    { id: 'pod-8', name: '教育新声', description: '探讨教育改革，分享学习方法，关注教育公平与创新', author: '周静', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20teal%20education&image_size=square` },
    { id: 'pod-9', name: 'AI时代', description: '专注人工智能领域，从大模型到自动驾驶，解析AI如何改变世界', author: '吴凯', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20cyan%20ai&image_size=square` },
    { id: 'pod-10', name: '创业日记', description: '真实记录创业历程，分享成功与失败，给每一位创业者力量', author: '郑洋', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20red%20startup&image_size=square` },
    { id: 'pod-11', name: '读书会', description: '每周精选一本好书，深度解读核心观点，用阅读丈量世界', author: '黄敏', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20warm%20book&image_size=square` },
    { id: 'pod-12', name: '科技与人文', description: '探讨科技发展对人类社会的影响，在技术浪潮中保持人文关怀', author: '林涛', cover: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${coverPrompt}%20indigo%20humanities&image_size=square` },
  ]
  for (const p of podcasts) {
    insertPodcast.run(p.id, p.name, p.description, p.author, p.cover, now)
  }

  const insertPodcastTag = db.prepare(
    'INSERT INTO podcast_tags (podcastId, tagId) VALUES (?, ?)'
  )
  const podcastTags: [string, string][] = [
    ['pod-1', 'tag-1'],
    ['pod-2', 'tag-2'],
    ['pod-3', 'tag-3'],
    ['pod-4', 'tag-4'],
    ['pod-5', 'tag-5'],
    ['pod-6', 'tag-6'],
    ['pod-7', 'tag-7'],
    ['pod-8', 'tag-8'],
    ['pod-9', 'tag-1'],
    ['pod-10', 'tag-2'],
    ['pod-11', 'tag-3'],
    ['pod-12', 'tag-1'],
    ['pod-12', 'tag-3'],
    ['pod-1', 'tag-2'],
    ['pod-2', 'tag-4'],
    ['pod-5', 'tag-8'],
    ['pod-6', 'tag-3'],
    ['pod-7', 'tag-3'],
    ['pod-9', 'tag-5'],
    ['pod-10', 'tag-4'],
    ['pod-11', 'tag-8'],
  ]
  for (const [podcastId, tagId] of podcastTags) {
    insertPodcastTag.run(podcastId, tagId)
  }

  const insertEpisode = db.prepare(
    'INSERT INTO episodes (id, podcastId, title, description, duration, audioUrl, publishDate, playCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const testAudio = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  const testAudio2 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  const testAudio3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  const episodes = [
    { id: 'ep-1', podcastId: 'pod-1', title: 'GPT-5来了：大模型的下一步', description: '深入探讨GPT-5可能带来的技术突破和应用场景', duration: 2400, audioUrl: testAudio, publishDate: '2026-06-15', playCount: 12580 },
    { id: 'ep-2', podcastId: 'pod-1', title: '量子计算的商业化之路', description: '量子计算离我们还有多远？哪些行业会最先受益', duration: 1800, audioUrl: testAudio2, publishDate: '2026-06-10', playCount: 8930 },
    { id: 'ep-3', podcastId: 'pod-1', title: '自动驾驶Level 4时代', description: '自动驾驶技术最新进展和法规突破', duration: 2100, audioUrl: testAudio3, publishDate: '2026-06-05', playCount: 10200 },
    { id: 'ep-27', podcastId: 'pod-1', title: '芯片战争：全球科技博弈', description: '解读全球芯片产业链的竞争格局和未来走向', duration: 2300, audioUrl: testAudio2, publishDate: '2026-05-30', playCount: 7800 },
    { id: 'ep-4', podcastId: 'pod-2', title: '从0到1：创业者的第一课', description: '分享创业者如何找到产品市场匹配', duration: 2700, audioUrl: testAudio, publishDate: '2026-06-14', playCount: 15600 },
    { id: 'ep-5', podcastId: 'pod-2', title: '经济周期与投资策略', description: '如何在经济周期中找到投资机会', duration: 1900, audioUrl: testAudio2, publishDate: '2026-06-08', playCount: 9870 },
    { id: 'ep-28', podcastId: 'pod-2', title: '新消费品牌如何破圈', description: '解析新消费品牌的营销策略和增长逻辑', duration: 2000, audioUrl: testAudio3, publishDate: '2026-05-28', playCount: 11200 },
    { id: 'ep-6', podcastId: 'pod-3', title: '村上春树的跑步哲学', description: '从跑步中读懂村上春树的文学世界', duration: 2200, audioUrl: testAudio, publishDate: '2026-06-13', playCount: 7650 },
    { id: 'ep-7', podcastId: 'pod-3', title: '独立电影的金色时代', description: '华语独立电影的崛起与未来', duration: 2500, audioUrl: testAudio2, publishDate: '2026-06-07', playCount: 6340 },
    { id: 'ep-8', podcastId: 'pod-4', title: '老龄化社会：我们准备好了吗', description: '深度讨论老龄化带来的社会挑战和应对策略', duration: 3000, audioUrl: testAudio3, publishDate: '2026-06-12', playCount: 11200 },
    { id: 'ep-9', podcastId: 'pod-4', title: '教育公平：城乡差距如何弥合', description: '探讨教育资源分配不均的根源和解决路径', duration: 2600, audioUrl: testAudio, publishDate: '2026-06-06', playCount: 8900 },
    { id: 'ep-10', podcastId: 'pod-5', title: '焦虑的时代：如何与不确定性共处', description: '心理学视角解读当代焦虑，提供实用应对方法', duration: 2300, audioUrl: testAudio2, publishDate: '2026-06-14', playCount: 18900 },
    { id: 'ep-11', podcastId: 'pod-5', title: '正念冥想入门指南', description: '从零开始学习正念冥想，改善生活质量', duration: 1600, audioUrl: testAudio3, publishDate: '2026-06-09', playCount: 14500 },
    { id: 'ep-29', podcastId: 'pod-5', title: '自我关怀的艺术', description: '学会善待自己，建立健康的自我对话模式', duration: 1700, audioUrl: testAudio, publishDate: '2026-06-02', playCount: 13800 },
    { id: 'ep-12', podcastId: 'pod-6', title: '爵士乐的黄金年代', description: '回顾爵士乐的辉煌历史，聆听经典作品', duration: 2800, audioUrl: testAudio2, publishDate: '2026-06-11', playCount: 5670 },
    { id: 'ep-13', podcastId: 'pod-6', title: '电子音乐制作入门', description: '从零开始学习电子音乐制作的基本工具和技巧', duration: 2000, audioUrl: testAudio3, publishDate: '2026-06-04', playCount: 7230 },
    { id: 'ep-14', podcastId: 'pod-7', title: '丝绸之路上的文明交融', description: '沿着丝绸之路探索东西方文明的碰撞与融合', duration: 3100, audioUrl: testAudio, publishDate: '2026-06-13', playCount: 9400 },
    { id: 'ep-15', podcastId: 'pod-7', title: '唐朝的开放与包容', description: '解析大唐盛世的文化多元性和国际影响力', duration: 2700, audioUrl: testAudio2, publishDate: '2026-06-07', playCount: 10800 },
    { id: 'ep-30', podcastId: 'pod-7', title: '二战中的普通人', description: '从普通人的视角重新审视二战历史', duration: 3400, audioUrl: testAudio3, publishDate: '2026-05-25', playCount: 9600 },
    { id: 'ep-16', podcastId: 'pod-8', title: '未来学校：教育3.0的模样', description: '畅想未来教育模式，技术如何重塑学习体验', duration: 2400, audioUrl: testAudio, publishDate: '2026-06-12', playCount: 6780 },
    { id: 'ep-17', podcastId: 'pod-8', title: '终身学习：如何在职场保持竞争力', description: '分享高效学习方法和职业发展策略', duration: 1900, audioUrl: testAudio2, publishDate: '2026-06-06', playCount: 13400 },
    { id: 'ep-31', podcastId: 'pod-8', title: '在线教育的机遇与挑战', description: '疫情后在线教育行业的转型与发展', duration: 2100, audioUrl: testAudio3, publishDate: '2026-05-20', playCount: 7500 },
    { id: 'ep-18', podcastId: 'pod-9', title: '大模型落地：从技术到产品', description: '分析大模型在各行业的落地应用和商业价值', duration: 2600, audioUrl: testAudio, publishDate: '2026-06-15', playCount: 21300 },
    { id: 'ep-19', podcastId: 'pod-9', title: 'AI安全：我们该担心什么', description: '探讨AI发展中的安全隐患和治理框架', duration: 2200, audioUrl: testAudio2, publishDate: '2026-06-09', playCount: 16700 },
    { id: 'ep-20', podcastId: 'pod-9', title: '计算机视觉的新突破', description: '解读最新计算机视觉技术和应用场景', duration: 1800, audioUrl: testAudio3, publishDate: '2026-06-03', playCount: 9800 },
    { id: 'ep-32', podcastId: 'pod-9', title: '具身智能：机器人新纪元', description: '具身智能如何让机器人真正走进人类生活', duration: 2400, audioUrl: testAudio, publishDate: '2026-06-01', playCount: 12400 },
    { id: 'ep-21', podcastId: 'pod-10', title: '第一次融资：血与泪的经验', description: '真实分享创业融资中的坑和避坑指南', duration: 2900, audioUrl: testAudio2, publishDate: '2026-06-14', playCount: 17600 },
    { id: 'ep-22', podcastId: 'pod-10', title: '团队管理：从5人到50人', description: '创业公司团队扩张中的管理挑战和解决方案', duration: 2100, audioUrl: testAudio3, publishDate: '2026-06-08', playCount: 12300 },
    { id: 'ep-23', podcastId: 'pod-11', title: '《思考，快与慢》精读', description: '深度解读丹尼尔·卡尼曼的经典著作', duration: 3200, audioUrl: testAudio, publishDate: '2026-06-11', playCount: 14500 },
    { id: 'ep-24', podcastId: 'pod-11', title: '《人类简史》告诉我们什么', description: '从宏大叙事中理解人类文明的演进', duration: 2800, audioUrl: testAudio2, publishDate: '2026-06-05', playCount: 11200 },
    { id: 'ep-25', podcastId: 'pod-12', title: '技术伦理：AI时代的道德困境', description: '探讨AI发展中的伦理问题和道德边界', duration: 2500, audioUrl: testAudio3, publishDate: '2026-06-13', playCount: 8900 },
    { id: 'ep-26', podcastId: 'pod-12', title: '数字游民：技术赋能的自由生活', description: '远程工作和数字游民生活方式的兴起', duration: 1900, audioUrl: testAudio, publishDate: '2026-06-07', playCount: 15600 },
  ]
  for (const ep of episodes) {
    insertEpisode.run(ep.id, ep.podcastId, ep.title, ep.description, ep.duration, ep.audioUrl, ep.publishDate, ep.playCount)
  }

  const insertSubscription = db.prepare(
    'INSERT INTO subscriptions (id, userId, podcastId, autoDownload, createdAt) VALUES (?, ?, ?, ?, ?)'
  )
  const subscriptions = [
    { id: uuidv4(), userId: 'user-1', podcastId: 'pod-1', autoDownload: 1 },
    { id: uuidv4(), userId: 'user-1', podcastId: 'pod-5', autoDownload: 0 },
    { id: uuidv4(), userId: 'user-1', podcastId: 'pod-9', autoDownload: 1 },
    { id: uuidv4(), userId: 'user-1', podcastId: 'pod-7', autoDownload: 0 },
    { id: uuidv4(), userId: 'user-1', podcastId: 'pod-11', autoDownload: 0 },
    { id: uuidv4(), userId: 'user-1', podcastId: 'pod-12', autoDownload: 1 },
  ]
  for (const sub of subscriptions) {
    insertSubscription.run(sub.id, sub.userId, sub.podcastId, sub.autoDownload, now)
  }

  const insertListenHistory = db.prepare(
    'INSERT INTO listen_history (id, userId, episodeId, podcastId, duration, position, completed, listenedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const listenHistory = [
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-1', podcastId: 'pod-1', duration: 2400, position: 2400, completed: 1, listenedAt: '2026-06-15T09:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-2', podcastId: 'pod-1', duration: 1800, position: 1200, completed: 0, listenedAt: '2026-06-14T10:30:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-10', podcastId: 'pod-5', duration: 2300, position: 2300, completed: 1, listenedAt: '2026-06-14T14:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-11', podcastId: 'pod-5', duration: 1600, position: 1600, completed: 1, listenedAt: '2026-06-13T08:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-18', podcastId: 'pod-9', duration: 2600, position: 2600, completed: 1, listenedAt: '2026-06-13T20:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-19', podcastId: 'pod-9', duration: 2200, position: 800, completed: 0, listenedAt: '2026-06-12T19:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-14', podcastId: 'pod-7', duration: 3100, position: 3100, completed: 1, listenedAt: '2026-06-12T10:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-15', podcastId: 'pod-7', duration: 2700, position: 2700, completed: 1, listenedAt: '2026-06-11T09:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-23', podcastId: 'pod-11', duration: 3200, position: 3200, completed: 1, listenedAt: '2026-06-11T15:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-24', podcastId: 'pod-11', duration: 2800, position: 1500, completed: 0, listenedAt: '2026-06-10T20:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-25', podcastId: 'pod-12', duration: 2500, position: 2500, completed: 1, listenedAt: '2026-06-10T10:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-26', podcastId: 'pod-12', duration: 1900, position: 1900, completed: 1, listenedAt: '2026-06-09T21:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-3', podcastId: 'pod-1', duration: 2100, position: 2100, completed: 1, listenedAt: '2026-06-09T08:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-5', podcastId: 'pod-2', duration: 1900, position: 600, completed: 0, listenedAt: '2026-06-08T19:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-7', podcastId: 'pod-3', duration: 2500, position: 2500, completed: 1, listenedAt: '2026-06-08T14:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-20', podcastId: 'pod-9', duration: 1800, position: 1800, completed: 1, listenedAt: '2026-06-07T20:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-16', podcastId: 'pod-8', duration: 2400, position: 2400, completed: 1, listenedAt: '2026-06-07T11:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-29', podcastId: 'pod-5', duration: 1700, position: 1700, completed: 1, listenedAt: '2026-06-06T09:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-30', podcastId: 'pod-7', duration: 3400, position: 2000, completed: 0, listenedAt: '2026-06-06T16:00:00Z' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-6', podcastId: 'pod-3', duration: 2200, position: 2200, completed: 1, listenedAt: '2026-06-05T10:00:00Z' },
  ]
  for (const h of listenHistory) {
    insertListenHistory.run(h.id, h.userId, h.episodeId, h.podcastId, h.duration, h.position, h.completed, h.listenedAt)
  }

  const insertNote = db.prepare(
    'INSERT INTO episode_notes (id, userId, episodeId, content, rating, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const notes = [
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-1', content: '非常精彩的讨论，GPT-5的技术路线分析很到位', rating: 5 },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-10', content: '焦虑管理的方法很实用，已经尝试了呼吸练习', rating: 4 },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-18', content: '大模型落地的案例分析很有启发', rating: 5 },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-14', content: '丝绸之路的历史讲得很生动', rating: 4 },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-23', content: '系统1和系统2的解读非常清晰', rating: 5 },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-25', content: 'AI伦理问题确实需要更多关注', rating: 4 },
  ]
  for (const n of notes) {
    insertNote.run(n.id, n.userId, n.episodeId, n.content, n.rating, now)
  }

  const insertUploadRequest = db.prepare(
    'INSERT INTO upload_requests (id, userId, podcastName, audioFormat, fileSize, status, rejectReason, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const uploadRequests = [
    { id: uuidv4(), userId: 'user-1', podcastName: '我的科技播客', audioFormat: 'MP3', fileSize: 35 * 1024 * 1024, status: 'pending', rejectReason: '', tags: '科技' },
    { id: uuidv4(), userId: 'user-1', podcastName: '深夜读书会', audioFormat: 'MP3', fileSize: 28 * 1024 * 1024, status: 'pending', rejectReason: '', tags: '文化,教育' },
    { id: uuidv4(), userId: 'user-1', podcastName: '城市漫步', audioFormat: 'MP3', fileSize: 42 * 1024 * 1024, status: 'approved', rejectReason: '', tags: '社会' },
    { id: uuidv4(), userId: 'user-1', podcastName: '美食地图', audioFormat: 'WAV', fileSize: 100 * 1024 * 1024, status: 'rejected', rejectReason: '音频格式仅支持MP3', tags: '' },
  ]
  for (const u of uploadRequests) {
    insertUploadRequest.run(u.id, u.userId, u.podcastName, u.audioFormat, u.fileSize, u.status, u.rejectReason, u.tags, now)
  }

  const insertDownload = db.prepare(
    'INSERT INTO downloads (id, userId, episodeId, podcastId, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const downloads = [
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-1', podcastId: 'pod-1', status: 'completed' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-2', podcastId: 'pod-1', status: 'completed' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-9', podcastId: 'pod-4', status: 'completed' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-10', podcastId: 'pod-5', status: 'completed' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-17', podcastId: 'pod-8', status: 'completed' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-13', podcastId: 'pod-6', status: 'completed' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-14', podcastId: 'pod-7', status: 'completed' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-22', podcastId: 'pod-10', status: 'completed' },
    { id: uuidv4(), userId: 'user-1', episodeId: 'ep-23', podcastId: 'pod-11', status: 'completed' },
  ]
  for (const d of downloads) {
    insertDownload.run(d.id, d.userId, d.episodeId, d.podcastId, d.status, now)
  }

  const insertNotification = db.prepare(
    'INSERT INTO notifications (id, userId, type, title, content, podcastId, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const notifications = [
    { id: uuidv4(), userId: 'user-1', type: 'recommendation', title: '为你推荐：文化漫谈', content: '基于你喜欢的文化类内容，我们为你精选了这档播客', podcastId: 'pod-3', read: 0, createdAt: '2026-06-16T09:00:00Z' },
    { id: uuidv4(), userId: 'user-1', type: 'recommendation', title: '为你推荐：音乐空间', content: '从你的收听历史来看，你可能会喜欢这档关于音乐的播客', podcastId: 'pod-6', read: 0, createdAt: '2026-06-16T09:00:00Z' },
    { id: uuidv4(), userId: 'user-1', type: 'download', title: '自动下载完成', content: '「科技前沿」最新一集《GPT-5来了：大模型的下一步》已下载完毕', podcastId: 'pod-1', read: 1, createdAt: '2026-06-15T20:00:00Z' },
    { id: uuidv4(), userId: 'user-1', type: 'report', title: '周报已生成', content: '你上周的收听报告已生成，快来查看！', podcastId: '', read: 0, createdAt: '2026-06-16T00:00:00Z' },
  ]
  for (const n of notifications) {
    insertNotification.run(n.id, n.userId, n.type, n.title, n.content, n.podcastId, n.read, n.createdAt)
  }

  const insertWeeklyReport = db.prepare(
    'INSERT INTO weekly_reports (id, userId, weekStart, weekEnd, totalDuration, consecutiveDays, longestStreak, totalEpisodes, completedEpisodes, favoritePodcasts, dailyBreakdown, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const generateDailyBreakdown = (base: number) => {
    const result = []
    for (let i = 0; i < 7; i++) {
      result.push({ date: `day-${i}`, duration: Math.floor(base * (0.5 + Math.random() * 0.8)) })
    }
    return JSON.stringify(result)
  }

  const weeklyReports = [
    {
      id: uuidv4(), userId: 'user-1', weekStart: '2026-06-08', weekEnd: '2026-06-14',
      totalDuration: 29100, consecutiveDays: 7, longestStreak: 7, totalEpisodes: 12, completedEpisodes: 9,
      favoritePodcasts: JSON.stringify([{ podcastId: 'pod-11', name: '读书会', duration: 6000 }, { podcastId: 'pod-7', name: '历史长廊', duration: 5800 }, { podcastId: 'pod-9', name: 'AI时代', duration: 4800 }]),
      dailyBreakdown: JSON.stringify([{ date: '2026-06-08', duration: 4300 }, { date: '2026-06-09', duration: 3700 }, { date: '2026-06-10', duration: 5300 }, { date: '2026-06-11', duration: 5900 }, { date: '2026-06-12', duration: 5300 }, { date: '2026-06-13', duration: 4200 }, { date: '2026-06-14', duration: 400 }]),
    },
    {
      id: uuidv4(), userId: 'user-1', weekStart: '2026-06-01', weekEnd: '2026-06-07',
      totalDuration: 25400, consecutiveDays: 5, longestStreak: 12, totalEpisodes: 10, completedEpisodes: 7,
      favoritePodcasts: JSON.stringify([{ podcastId: 'pod-1', name: '科技前沿', duration: 5500 }, { podcastId: 'pod-12', name: '科技与人文', duration: 5000 }, { podcastId: 'pod-5', name: '心灵驿站', duration: 4200 }]),
      dailyBreakdown: JSON.stringify([{ date: '2026-06-01', duration: 2400 }, { date: '2026-06-02', duration: 1700 }, { date: '2026-06-03', duration: 1800 }, { date: '2026-06-04', duration: 2000 }, { date: '2026-06-05', duration: 2200 }, { date: '2026-06-06', duration: 5100 }, { date: '2026-06-07', duration: 4300 }]),
    },
    {
      id: uuidv4(), userId: 'user-1', weekStart: '2026-05-25', weekEnd: '2026-05-31',
      totalDuration: 21800, consecutiveDays: 6, longestStreak: 7, totalEpisodes: 8, completedEpisodes: 6,
      favoritePodcasts: JSON.stringify([{ podcastId: 'pod-11', name: '读书会', duration: 4800 }, { podcastId: 'pod-7', name: '历史长廊', duration: 4200 }, { podcastId: 'pod-9', name: 'AI时代', duration: 3800 }]),
      dailyBreakdown: JSON.stringify([{ date: '2026-05-25', duration: 2800 }, { date: '2026-05-26', duration: 3200 }, { date: '2026-05-27', duration: 0 }, { date: '2026-05-28', duration: 3100 }, { date: '2026-05-29', duration: 3400 }, { date: '2026-05-30', duration: 4200 }, { date: '2026-05-31', duration: 3100 }]),
    },
  ]
  for (const r of weeklyReports) {
    insertWeeklyReport.run(r.id, r.userId, r.weekStart, r.weekEnd, r.totalDuration, r.consecutiveDays, r.longestStreak, r.totalEpisodes, r.completedEpisodes, r.favoritePodcasts, r.dailyBreakdown, now)
  }
}

export default db
