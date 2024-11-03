import { t } from "elysia"
import { JRPC } from "@/jrpc"

export const myJRPC = new JRPC()
    .add(
        "uppercase",
        async (s: string) => s.toUpperCase(),
        t.String(),
        t.String(),
        "Converts a string to uppercase",
    )

    .add(
        "division",
        async (input: { a: number, b: number }) => {
            if (input.b === 0) throw new Error("Division by zero")
            return input.a / input.b
        },
        t.Object({ a: t.Number(), b: t.Number() }),
        t.Number(),
        "Divides two numbers",
    )
