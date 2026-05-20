/// <reference types="vite/client" />

interface Window {
  api: {
    invoke(channel: string, ...args: unknown[]): Promise<unknown>
    send(channel: string, data?: unknown): void
  }
}
