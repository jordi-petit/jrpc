/* eslint-disable  @typescript-eslint/no-explicit-any */

import { Value } from '@sinclair/typebox/value'
import { type Static, type TSchema } from '@sinclair/typebox'
import Elysia from 'elysia'
import { html, Html } from '@elysiajs/html'

export type Func<I, O> = (input: I) => Promise<O>

type EndPoint<I, O> = {
    name: string
    func: Func<I, O>
    input: TSchema
    output: TSchema
    summary: string
}

export class JRPC {
    private endpoints: Map<string, EndPoint<any, any>> = new Map()

    public constructor() {}

    public add<Is extends TSchema, Os extends TSchema>(
        name: string,
        summary: string = '',
        input: Is,
        output: Os,
        func: Func<Static<Is>, Static<Os>>,
    ) {
        this.endpoints.set(name, { name, func, input, output, summary })
        return this
    }

    public plugin() {
        return new Elysia()
            .use(html())
            .post('/jrpc', async ({ body }: { body: any }) => await this.exec(body))
            .get('/jrpc/doc', () => this.generateDocumentation())
            .get('/jrpc/clients/python', () => this.generateClientPython())
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

    private generateDocumentation() {
        const clients = (
            <div>
                <h1>Clients</h1>
                <ul>
                    <li>
                        <a href="/jrpc/clients/python">Python</a>
                    </li>
                </ul>
            </div>
        )

        const functions = (
            <div>
                <h1>Functions</h1>
                {Array.from(this.endpoints).map(([name, { input, output, summary }]) => (
                    <div>
                        <h2>
                            <code>{name}</code>
                        </h2>
                        <p>{summary}</p>
                        <h4>Input</h4>
                        <pre>{JSON.stringify(input)}</pre>
                        <h4>Output</h4>
                        <pre>{JSON.stringify(output)}</pre>
                    </div>
                ))}
            </div>
        )

        return (
            <html>
                <head>
                    <title>Documentation</title>
                </head>
                <body>
                    {clients}
                    {functions}
                </body>
            </html>
        )
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

        for (const [name, { input, output, summary }] of this.endpoints) {
            python += `

def ${name}(arg: ${typify(input)}) -> ${typify(output)}:
    '''${summary}'''

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
