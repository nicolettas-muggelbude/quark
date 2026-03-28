import { useEffect, useState } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export type UpdateState =
  | { status: 'idle' }
  | { status: 'available'; version: string; install: () => Promise<void> }
  | { status: 'downloading'; progress: number }
  | { status: 'installing' }
  | { status: 'error'; message: string }

export function useUpdater(): UpdateState {
  const [state, setState] = useState<UpdateState>({ status: 'idle' })

  useEffect(() => {
    check()
      .then((update) => {
        if (!update?.available) return
        setState({
          status: 'available',
          version: update.version,
          install: async () => {
            try {
              let downloaded = 0
              let total = 0
              setState({ status: 'downloading', progress: 0 })
              await update.downloadAndInstall((event) => {
                if (event.event === 'Started') {
                  total = event.data.contentLength ?? 0
                } else if (event.event === 'Progress') {
                  downloaded += event.data.chunkLength
                  const pct = total > 0 ? Math.round((downloaded / total) * 100) : 0
                  setState({ status: 'downloading', progress: pct })
                } else if (event.event === 'Finished') {
                  setState({ status: 'installing' })
                }
              })
              await relaunch()
            } catch (e) {
              setState({ status: 'error', message: e instanceof Error ? e.message : String(e) })
            }
          },
        })
      })
      .catch((e) => {
        // Im Dev-Modus oder ohne Netz – kein Fehler anzeigen
        console.warn('Update-Check fehlgeschlagen:', e)
      })
  }, [])

  return state
}
