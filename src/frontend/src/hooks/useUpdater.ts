import { useEffect, useState } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export type UpdateState =
  | { status: 'idle' }
  | { status: 'available'; version: string; install: () => Promise<void> }
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
            setState({ status: 'installing' })
            await update.downloadAndInstall()
            await relaunch()
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
