"use client"

import { useSyncExternalStore } from "react"

const TICK_MS = 60_000
let current: Date | null = null
const listeners = new Set<() => void>()
let interval: ReturnType<typeof setInterval> | undefined

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!interval) {
    interval = setInterval(() => {
      current = new Date()
      listeners.forEach((notify) => notify())
    }, TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(interval)
      interval = undefined
    }
  }
}

function getSnapshot() {
  current ??= new Date()
  return current
}

export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
