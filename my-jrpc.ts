import { t } from "elysia"
import { JRPC } from "@/jrpc"

export const myJRPC = new JRPC()
    .add(
        "addition",
        async (input: { a: number, b: number }) => input.a + input.b,
        t.Object({ a: t.Number(), b: t.Number() }),
        t.Number(),
        "Adds two numbers",
    )

    .add(
        "uppercase",
        async (s: string) => s.toUpperCase(),
        t.String(),
        t.String(),
        "Converts a string to uppercase",
    )
