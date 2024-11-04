import type { TSchema } from 'elysia'

export type FunctionJRPC = {
    name: string
    summary?: string
    description?: string
    input: TSchema
    output: TSchema
}

export type ModuleJRPC = {
    module: string
    functions: Array<FunctionJRPC>
    submodules: ModuleJRPC[]
}

export type OpenJRPC = {
    title: string
    version: string
    root: ModuleJRPC
}
