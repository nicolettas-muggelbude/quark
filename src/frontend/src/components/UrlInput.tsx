interface Props {
  url: string
  onChange: (value: string) => void
}

export default function UrlInput({ url, onChange }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        URL
      </label>
      <input
        type="url"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
        spellCheck={false}
      />
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
