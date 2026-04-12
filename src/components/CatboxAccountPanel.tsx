import { useCatboxSettings } from '../context/CatboxSettingsContext'

export function CatboxAccountPanel() {
  const { userhash, setUserhash } = useCatboxSettings()

  return (
    <div className="catbox-account-panel">
      <div className="storage-panel-row">
        <span className="storage-panel-label">Catbox</span>
        <span className="storage-panel-value">
          {userhash.trim()
            ? 'Saved in this browser for uploads and albums.'
            : 'Add your userhash to upload images into a per-character album.'}
        </span>
      </div>
      <label className="field catbox-userhash-field">
        <span className="field-label">Userhash</span>
        <input
          className="field-input"
          type="password"
          autoComplete="off"
          value={userhash}
          onChange={(e) => setUserhash(e.target.value)}
          placeholder="Paste from your Catbox account"
          aria-describedby="catbox-userhash-hint"
        />
      </label>
      <p id="catbox-userhash-hint" className="storage-panel-hint catbox-account-hint">
        Copy the userhash from your Catbox account. It is stored only in this browser.
      </p>
    </div>
  )
}
