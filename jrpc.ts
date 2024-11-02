/* eslint-disable  @typescript-eslint/no-explicit-any */

import { Value } from '@sinclair/typebox/value'
import { type Static, type TSchema } from '@sinclair/typebox'
import Elysia from 'elysia'
import { html } from '@elysiajs/html'

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

    public constructor() {
    }

    public add<Is extends TSchema, Os extends TSchema>(name: string, func: Func<Static<Is>, Static<Os>>, input: Is, output: Os, summary: string = '') {
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
        console.log(body)
        const { name, arg } = body
        const endpoint = this.endpoints.get(name)
        if (!endpoint) throw new Error(`Endpoint ${name} not found`)
        if (!check(arg, endpoint.input)) throw new Error(`Invalid input`)
        const res = await endpoint.func(arg)
        if (!check(res, endpoint.output)) throw new Error(`Invalid Output`)
        return res
    }

    private generateDocumentation() {
        let html = ''

        html += `
<h1>Clients</h1>
<ul>
    <li><a href="/jrpc/clients/python">Python</a></li>
</ul>
`


        html += `
<h1>Functions</h1>
`
        for (const [name, { input, output, summary }] of this.endpoints) {
            html += `<h2><tt>${name}</tt></h2>\n`
            html += `<p>${summary}</p>\n`
            html += `<h4>Input</h4>\n`
            html += `<pre>${JSON.stringify(input)}</pre>\n`
            html += `<h4>Output</h4>\n`
            html += `<pre>${JSON.stringify(output)}</pre>\n`
        }
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Documentation</title>
                </head>
                <body>
                    ${html}
                </body>
            </html>
        `
    }

    private generateClientPython() {
        let python = `
import requests
import json
from typing import Any, TypedDict

`

        for (const [name, { input, output, summary }] of this.endpoints) {
            python += `

def ${name}(arg: ${typify(input)}) -> ${typify(output)}:
    '''${summary}'''

    response = requests.post('http://localhost:8000/jrpc', json={"name": "${name}", "arg": arg})
    result = response.json()
    # estaria bé verificar que el tipus retornat compleix amb el promès (l'API ja ho fa però així el client també en tindria la seguretat)
    return result
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
        const props = Object.entries(schema.properties).map(([key, value]: any) => `'${key}': ${typify(value)}`).join(', ')
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