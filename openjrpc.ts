import type { TSchema } from 'elysia'

export type FunctionJRPC = {
    name: string
    summary?: string
    description?: string
    input: TSchema
    output: TSchema
    inputName?: string
    outputName?: string
}

export type ModelJRPC = {
    name: string
    schema: TSchema
}

export type ModuleJRPC = {
    name: string
    functions: Array<FunctionJRPC>
    submodules: ModuleJRPC[]
    models: ModelJRPC[]
}

export type OpenJRPC = {
    title: string
    version: string
    root: ModuleJRPC
}
