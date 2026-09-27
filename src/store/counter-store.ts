import { create } from "zustand"

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  incrementBy: (count: number) => void
  decrementBy: (count: number) => void
  reset: () => void
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  incrementBy: (count: number) => set((state) => ({ count: state.count + count })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  decrementBy: (count: number) => set((state) => ({ count: state.count - count })),
  reset: () => set({ count: 0 }),
}))
