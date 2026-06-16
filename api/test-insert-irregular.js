import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

const id = uuidv4();
const result = db.prepare(`
  INSERT INTO weekly_reports 
  (id, userId, weekStart, weekEnd, totalDuration, consecutiveDays, longestStreak, totalEpisodes, completedEpisodes, favoritePodcasts, dailyBreakdown, createdAt) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  id,
  'user-1',
  '2026-06-10',
  '2026-06-16',
  35000,
  6,
  8,
  15,
  11,
  JSON.stringify([
    { podcastId: 'pod-1', name: '科技前沿', duration: 8000 },
    { podcastId: 'pod-3', name: '商业观察', duration: 6000 },
    { podcastId: 'pod-5', name: '心灵驿站', duration: 5000 }
  ]),
  JSON.stringify([
    { date: '2026-06-10', duration: 5000 },
    { date: '2026-06-11', duration: 5500 },
    { date: '2026-06-12', duration: 6000 },
    { date: '2026-06-13', duration: 5200 },
    { date: '2026-06-14', duration: 4800 },
    { date: '2026-06-15', duration: 4500 },
    { date: '2026-06-16', duration: 4000 }
  ]),
  new Date().toISOString()
);

console.log('Inserted irregular report with id:', id);
console.log('Changes:', result.changes);

const before = db.prepare('SELECT COUNT(*) as cnt FROM weekly_reports WHERE userId = ?').get('user-1');
console.log('Total reports before sanitize:', before.cnt);

const all = db.prepare('SELECT id, weekStart, weekEnd, totalDuration FROM weekly_reports WHERE userId = ? ORDER BY weekStart').all('user-1');
console.log('\nAll reports:');
all.forEach(r => console.log(`  ${r.weekStart} ~ ${r.weekEnd}: ${Math.round(r.totalDuration/60)} min`));
