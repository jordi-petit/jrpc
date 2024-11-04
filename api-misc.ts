import { t } from "elysia"
import { JRPC } from "@/jrpc"

export const misc = new JRPC('misc')
    .add({
        name: "uppercase",
        summary: "Convert a string to uppercase",
        input: t.String(),
        output: t.String(),
        func: async (s: string) => s.toUpperCase(),
    })

    .add({
        name: "division",
        summary: "Divide two numbers",
        description: "This function divides two numbers and may throw an error if the second number is zero.",
        input: t.Object({ a: t.Number(), b: t.Number() }),
        output: t.Number(),
        func: async (input: { a: number, b: number }) => {
            if (input.b === 0) throw new Error("Division by zero")
            return input.a / input.b
        },
    })
