import { Elysia } from 'elysia'
import { myJRPC } from '@/my-jrpc'

const server = new Elysia().use(myJRPC.plugin())

server.listen(8000)
console.info('Server is running on port 8000')
