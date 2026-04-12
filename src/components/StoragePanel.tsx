import { useCallback, useState } from 'react'
import { CatboxAccountPanel } from './CatboxAccountPanel'
import { useButtonFlash } from '../hooks/useButtonFlash'
import { isFileSystemAccessSupported } from '../storage/workspaceFile'
import { useCharacters } from '../hooks/useCharacters'

export function StoragePanel() {
  const {
    storagePersisted,
    linkedFileName,
    linkWorkspaceFile,
    unlinkWorkspaceFile,
    openWorkspaceFile,
    downloadBackup,
  } = useCharacters()

  const backupFlash = useButtonFlash(2200)
  const replaceFlash = useButtonFlash(2200)
  const linkFlash = useButtonFlash(2200)
  const unlinkFlash = useButtonFlash(2200)
  const [linkBusy, setLinkBusy] = useState(false)

  const fsOk = isFileSystemAccessSupported()

  const onDownloadBackup = useCallback(() => {
    downloadBackup()
    backupFlash.trigger()
  }, [downloadBackup, backupFlash])

  const onOpenWorkspace = useCallback(async () => {
    const didReplace = await openWorkspaceFile()
    if (didReplace) replaceFlash.trigger()
  }, [openWorkspaceFile, replaceFlash])

  const onLinkWorkspace = useCallback(async () => {
    setLinkBusy(true)
    try {
      const linked = await linkWorkspaceFile()
      if (linked) linkFlash.trigger()
    } finally {
      setLinkBusy(false)
    }
  }, [linkWorkspaceFile, linkFlash])

  const onUnlink = useCallback(() => {
    unlinkWorkspaceFile()
    unlinkFlash.trigger()
  }, [unlinkWorkspaceFile, unlinkFlash])

  return (
    <div className="storage-panel">
      <CatboxAccountPanel />
      <div className="storage-panel-row">
        <span className="storage-panel-label">Storage</span>
        <span className="storage-panel-value">
          IndexedDB in this browser
          {storagePersisted === true && ' · persistent (less likely cleared)'}
          {storagePersisted === false && ' · standard (may be cleared if disk is full)'}
        </span>
      </div>
      <div className="storage-panel-actions">
        <button
          type="button"
          className={`btn btn-secondary btn-small ${backupFlash.successClass}`}
          onClick={onDownloadBackup}
          aria-live="polite"
        >
          {backupFlash.active ? 'Download started' : 'Download backup (.json)'}
        </button>
        <button
          type="button"
          className={`btn btn-secondary btn-small ${replaceFlash.successClass}`}
          onClick={() => void onOpenWorkspace()}
          aria-live="polite"
        >
          {replaceFlash.active ? 'Done' : 'Replace from file…'}
        </button>
        {fsOk ? (
          <>
            <button
              type="button"
              className={`btn btn-secondary btn-small ${linkFlash.successClass}`}
              onClick={() => void onLinkWorkspace()}
              disabled={linkBusy}
              aria-busy={linkBusy}
              aria-live="polite"
            >
              {linkBusy
                ? 'Working…'
                : linkFlash.active
                  ? 'Linked'
                  : linkedFileName
                    ? 'Change linked file…'
                    : 'Link JSON file on disk…'}
            </button>
            {linkedFileName && (
              <button
                type="button"
                className={`btn btn-ghost btn-small ${unlinkFlash.successClass}`}
                onClick={onUnlink}
                aria-live="polite"
              >
                {unlinkFlash.active ? 'Unlinked' : 'Unlink file'}
              </button>
            )}
          </>
        ) : (
          <span className="storage-panel-hint">
            Linking a folder file needs Chromium-based browsers (Chrome, Edge, Brave).
          </span>
        )}
      </div>
      {linkedFileName && (
        <p className="storage-panel-sync">
          Mirroring to <strong>{linkedFileName}</strong> after each change.
        </p>
      )}
    </div>
  )
}
