import { Elysia } from 'elysia'
import { api } from '@/api'

const server = new Elysia().use(api.plugin())

server.listen(8000)
console.info('Server is running on port 8000')
