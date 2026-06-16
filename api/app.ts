/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import podcastRoutes from './routes/podcasts.js'
import subscriptionRoutes from './routes/subscriptions.js'
import listenRoutes from './routes/listen.js'
import recommendationRoutes from './routes/recommendations.js'
import reportRoutes from './routes/report.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes from './routes/upload.js'
import downloadRoutes from './routes/downloads.js'
import notificationRoutes from './routes/notifications.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/podcasts', podcastRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/listen', listenRoutes)
app.use('/api/recommendations', recommendationRoutes)
app.use('/api/report', reportRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/downloads', downloadRoutes)
app.use('/api/notifications', notificationRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
