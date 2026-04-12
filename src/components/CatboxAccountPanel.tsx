import { useCatboxSettings } from '../context/CatboxSettingsContext'

export function CatboxAccountPanel() {
  const { userhash, setUserhash } = useCatboxSettings()

  return (
    <div className="catbox-account-panel">
      <div className="storage-panel-row">
        <span className="storage-panel-label">Catbox</span>
        <span className="storage-panel-value">
          {userhash.trim()
            ? 'Userhash saved in this browser (used for uploads & albums).'
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
        Log in at{' '}
        <a href="https://catbox.moe/" target="_blank" rel="noreferrer">
          catbox.moe
        </a>
        , open your account page, and copy the <strong>userhash</strong> used by the API (same value as in their{' '}
        <a href="https://catbox.moe/tools.php" target="_blank" rel="noreferrer">
          tools
        </a>{' '}
        examples). It is stored only in this browser.
      </p>
    </div>
  )
}
