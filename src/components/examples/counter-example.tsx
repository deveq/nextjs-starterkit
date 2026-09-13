"use client"

import { useCounterStore } from "@/store/counter-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function CounterExample() {
  const { count, increment, decrement, reset } = useCounterStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zustand 예시</CardTitle>
        <CardDescription>상태 관리 데모</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <div className="text-4xl font-bold tabular-nums">{count}</div>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={decrement} variant="outline" size="sm">
            -
          </Button>
          <Button onClick={reset} variant="ghost" size="sm">
            초기화
          </Button>
          <Button onClick={increment} variant="outline" size="sm">
            +
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
