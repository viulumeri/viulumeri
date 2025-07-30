import 'dotenv/config'
import { port } from './utils/config'
import app from './app'
import logger from './utils/logger'

app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
})
