import 'dotenv/config'
import { port } from './utils/config'
import app from './app'

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

