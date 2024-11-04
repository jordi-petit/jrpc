/* eslint-disable  @typescript-eslint/no-explicit-any */

import { Value } from '@sinclair/typebox/value'
import { type Static, type TSchema } from '@sinclair/typebox'
import Elysia from 'elysia'
import { html } from '@elysiajs/html'
import { doc } from '@/doc'
import { genPython } from '@/gen-python'
import type { OpenJRPC, ModuleJRPC, FunctionJRPC } from '@/openjrpc'

export type Func<I, O> = (input: I) => Promise<O>

export type EndPoint<I extends TSchema, O extends TSchema> = {
    name: string
    summary?: string
    description?: string
    input: I
    output: O
    func: Func<Static<I>, Static<O>>
}

export class JRPC {
    private endpoints: Map<string, EndPoint<any, any>> = new Map()
    private submodules: JRPC[] = []
    private module: string

    public constructor(module: string) {
        this.module = module
    }

    public add<I extends TSchema, O extends TSchema>(what: JRPC | EndPoint<I, O>) {
        if (what instanceof JRPC) {
            this.submodules.push(what)
        } else {
            this.endpoints.set(what.name, what)
        }
        return this
    }

    public plugin() {
        return new Elysia()
            .use(html())
            .post('/jrpc', async ({ body }: { body: any }) => await this.exec(body))
            .get('/jrpc/openjrpc.json', () => this.generateOpenJRPC())
            .get('/jrpc/doc', () => doc(this.generateOpenJRPC()))
            .get('/jrpc/clients/python', () => genPython(this.generateOpenJRPC()))
    }

    private async exec(body: any) {
        try {
            console.log(body)
            const { name, arg } = body
            const endpoint = this.endpoints.get(name)
            if (!endpoint) throw new Error(`Endpoint ${name} not found`)
            if (!check(arg, endpoint.input)) throw new Error(`Invalid input`)
            const result = await endpoint.func(arg)
            if (!check(result, endpoint.output)) throw new Error(`Invalid Output`)
            return {
                error: null,
                result: result,
            }
        } catch (error) {
            console.log(error)
            if (error instanceof Error) {
                return {
                    error: error.message,
                    result: null,
                }
            } else {
                return {
                    error: 'Unknown error at server',
                    result: null,
                }
            }
        }
    }

    private generateOpenJRPC(): OpenJRPC {
        return {
            title: 'OpenJRPC API', // TODO: extract from somewhere
            version: '1.0',
            root: this.generateModuleJRPC(),
        }
    }

    private generateModuleJRPC(): ModuleJRPC {
        const functions = Array.from(this.endpoints).map(
            ([name, { input, output, summary, description }]) => ({
                name,
                summary,
                description,
                input,
                output,
            }),
        )

        const submodules = this.submodules.map((jrpc) => jrpc.generateModuleJRPC())

        const openjrpc = {
            module: this.module,
            functions,
            submodules,
        }

        return openjrpc
    }
}

function check(value: any, schema: TSchema) {
    const result = Value.Clean(schema, Value.Clone(value))
    if (!Value.Check(schema, result)) {
        const errors = [...Value.Errors(schema, result)]
        // console.log(errors)
        return false
    }
    return true
}
