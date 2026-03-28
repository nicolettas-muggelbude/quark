import { useEffect, useState } from 'react'
import { getVersion } from '@tauri-apps/api/app'

export function useAppVersion(): string {
  const [version, setVersion] = useState('...')

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion('0.1.0'))
  }, [])

  return version
}
