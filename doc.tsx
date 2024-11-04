import type { OpenJRPC, FunctionJRPC, ModuleJRPC, ModelJRPC } from '@/openjrpc'
import { Html } from '@elysiajs/html'

export function doc(openjrpc: OpenJRPC) {
    const main = DocModule(openjrpc.root, [])
    return Page(openjrpc, main)
}

function Page(openjrc: OpenJRPC, main: JSX.Element) {
    return (
        <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-slate-800 text-white">
                <div class="flex flex-col min-h-screen">
                    <header class="sticky z-50 top-0 p-4 bg-slate-600">
                        <div class="flex flex-row gap-4">
                            <h1 class="text-2xl font-bold truncate">
                                {openjrc.title} {openjrc.version}
                            </h1>
                        </div>
                    </header>
                    <div class="flex-grow p-4 flex">
                        <main class="flex-grow">{main}</main>
                    </div>
                    <footer class="sticky z-20 bottom-0 p-4 bg-slate-600">
                        ©️ The JRPC Foundation
                    </footer>
                </div>
            </body>
        </html>
    )
}

function DocModule(openjrpc: ModuleJRPC, parents: string[]) {
    return (
        <>
            <div class="pb-8">
                <h1 class="text-xl text-fuchsia-600 border-solid border-2 border-sky-500 rounded-lg p-2 mb-4 font-mono">
                    {parents.join('.')}
                    {parents.length ? '.' : ''}
                    {openjrpc.name}
                </h1>
                <div class="pl-8">
                    <div>{openjrpc.models.map(DocModel)}</div>
                </div>
                <div class="pl-8">
                    <div>{openjrpc.functions.map(DocFunction)}</div>
                </div>
            </div>
            <div>
                {openjrpc.submodules.map((sub) => DocModule(sub, parents.concat(openjrpc.name)))}
            </div>
        </>
    )
}

function DocFunction(func: FunctionJRPC) {
    return (
        <div class="py-4">
            <h2 class="text-lg font-mono border-solid border-2 border-sky-100 rounded-sm mb-4 px-2">
                [F] {func.name}
            </h2>
            <div class="ml-8 mb-4">
                <p class="italic mb-4">{func.summary}</p>
                {func.description ? <p class="mb-4">{func.description}</p> : ''}
                <p>
                    Input schema: <span class="text-red-300">{func.inputName}</span>{' '}
                </p>
                <pre class="text-xs text-gray-400 mb-4">
                    {JSON.stringify(func.input, undefined, 4)}
                </pre>
                <p>
                    Output schema: <span class="text-red-300">{func.outputName}</span>{' '}
                </p>
                <pre class="text-xs text-gray-400">{JSON.stringify(func.output, undefined, 4)}</pre>
            </div>
        </div>
    )
}

function DocModel(model: ModelJRPC) {
    return (
        <div class="py-4">
            <h2 class="text-lg font-mono border-solid border-2 border-red-300 text-red-300 rounded-sm mb-4 px-2">
                [T] {model.name}
            </h2>
            <div class="ml-8 mb-4">
                <pre class="text-xs text-gray-400 mb-4">
                    {JSON.stringify(model.schema, undefined, 4)}
                </pre>
            </div>
        </div>
    )
}
