import { CounterExample } from "@/components/examples/counter-example"
import { ExampleForm } from "@/components/examples/example-form"

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Next.js 스타터킷에 오신 것을 환영합니다</h1>
        <p className="mt-2 text-muted-foreground">
          Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui 기반의 모던 웹 스타터킷입니다.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <CounterExample />
        <ExampleForm />
      </div>
    </div>
  )
}
