import { contextBridge, ipcRenderer } from 'electron'

const ALLOWED_CHANNELS = [
  'db:get-incidents',
  'db:add-incident',
  'db:update-incident',
  'db:delete-incident',
  'db:get-incidents-filtered',
  'db:get-classes',
  'db:add-class',
  'db:update-class',
  'db:delete-class',
  'db:get-injury-types',
  'db:add-injury-type',
  'db:update-injury-type',
  'db:delete-injury-type',
  'db:get-locations',
  'db:add-location',
  'db:update-location',
  'db:delete-location',
  'db:get-stats',
  'db:get-matrix',
  'pdf:export-save',
] as const

contextBridge.exposeInMainWorld('api', {
  send: (channel: string, data?: unknown) => ipcRenderer.send(channel, data),
  invoke: (channel: string, ...args: unknown[]) => {
    if (!(ALLOWED_CHANNELS as readonly string[]).includes(channel)) {
      throw new Error(`IPC channel not allowed: ${channel}`)
    }
    return ipcRenderer.invoke(channel, ...args)
  }
})
