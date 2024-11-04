/* eslint-disable  @typescript-eslint/no-explicit-any */

import { Value } from '@sinclair/typebox/value'
import { type Static, type TSchema } from '@sinclair/typebox'
import Elysia from 'elysia'
import { html } from '@elysiajs/html'
import { doc } from '@/doc'
import type { OpenJRPC, ModuleJRPC, FunctionJRPC } from '@/openrpc'

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

    private generateClientPython() {
        let python = `
import requests
import json
from typing import Any, TypedDict


def _execute(name: str, arg: Any) -> Any:
    response = requests.post('http://localhost:8000/jrpc', json={"name": name, "arg": arg})
    result = response.json()
    if result['error']:
        raise Exception(result['error'])
    # estaria bé verificar aquí que el tipus retornat compleix amb el promès (l'API ja ho fa però així el client també en tindria la seguretat)
    return result['result']
`

        for (const [name, { input, output, summary, description }] of this.endpoints) {
            python += `

def ${name}(arg: ${typify(input)}) -> ${typify(output)}:
    """
    ${summary || 'No summary'}

    ${description || 'No description'}
    """

    return _execute('${name}', arg)
`
        }
        return python
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

function typify(schema: TSchema): string {
    // segur que alguna llibreria ja fa això millor
    if (schema.type === 'object') {
        const props = Object.entries(schema.properties)
            .map(([key, value]: any) => `'${key}': ${typify(value)}`)
            .join(', ')
        return `{${props}}`
    }
    if (schema.type === 'array') {
        return `list[${typify(schema.items)}]`
    }
    if (schema.type === 'string') {
        return 'str'
    }
    if (schema.type === 'number') {
        return 'float'
    }
    if (schema.type === 'integer') {
        return 'int'
    }
    if (schema.type === 'boolean') {
        return 'bool'
    }
    throw new Error(`Type ${schema.type} not supported`)
}
