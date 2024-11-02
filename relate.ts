
// Tests for the `relate` function that takes a function and two type schemas and checks if the function can be applied to the input schema and the output schema is the same as the output schema.

import { type Static, type TSchema } from '@sinclair/typebox'
import { t } from 'elysia'

type TypedFunction<I, O> = (input: I) => O

function relate<Is extends TSchema, Os extends TSchema>(func: TypedFunction<Static<Is>, Static<Os>>, input: Is, output: Os) { }

const f = (input: string) => input.toUpperCase()
const g = (input: string) => input.length
const h = (input: number) => input * 2

const tbs = t.String()
const tbn = t.Number()

relate(f, tbs, tbs)
relate(f, tbs, tbn)
relate(f, tbn, tbn)
relate(f, tbn, tbs)

relate(g, tbs, tbs)
relate(g, tbs, tbn)
relate(g, tbn, tbn)
relate(g, tbn, tbs)

relate(h, tbs, tbs)
relate(h, tbs, tbn)
relate(h, tbn, tbn)
relate(h, tbn, tbs)

const tboab = t.Object({ a: t.String(), b: t.Number() })
const tboa = t.Object({ a: t.String() })

const fo = (input: { a: string, b: number }) => input

relate(fo, tboab, tboab)
relate(fo, tboab, tboa)
relate(fo, tboa, tboab)
relate(fo, tboa, tboa)
