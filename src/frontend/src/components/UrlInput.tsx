interface Props {
  url: string
  onChange: (value: string) => void
}

export default function UrlInput({ url, onChange }: Props) {
  async function paste() {
    const { readText } = await import('@tauri-apps/plugin-clipboard-manager')
    const text = await readText()
    if (text) onChange(text.trim())
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        URL
      </label>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          spellCheck={false}
        />
        <button
          onClick={paste}
          title="Aus Zwischenablage einfügen"
          className="shrink-0 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          Einfügen
        </button>
      </div>
      {url && !isValidUrl(url) && (
        <p className="text-xs text-red-400 mt-1">Keine gültige URL</p>
      )}
    </div>
  )
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
