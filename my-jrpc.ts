import { t } from "elysia"
import { JRPC } from "@/jrpc"

export const myJRPC = new JRPC()
    .add(
        "uppercase",
        "Converts a string to uppercase",
        t.String(),
        t.String(),
        async (s: string) => s.toUpperCase(),
    )

    .add(
        "division",
        "Divides two numbers",
        t.Object({ a: t.Number(), b: t.Number() }),
        t.Number(),
        async (input: { a: number, b: number }) => {
            if (input.b === 0) throw new Error("Division by zero")
            return input.a / input.b
        },
    )
