/** Official Crushon.ai policy URLs (see crushon.ai Terms of Use & Community Guidelines). */
export const CRUSHON_TERMS_URL = 'https://crushon.ai/terms-of-service'
export const CRUSHON_COMMUNITY_GUIDELINES_URL = 'https://crushon.ai/community-guidelines'
export const CRUSHON_PRIVACY_URL = 'https://crushon.ai/privacy-policy'

export function CrushonLegalDisclaimer() {
  return (
    <aside className="crushon-disclaimer" aria-label="Third-party service notice">
      <p className="crushon-disclaimer-text">
        <strong>Crushon.ai.</strong> Crushon Studio is an independent tool and is not affiliated with Crushon.ai or its
        operator (TECHIEPIE LTD). If you use Crushon.ai, you must follow their{' '}
        <a href={CRUSHON_TERMS_URL} target="_blank" rel="noopener noreferrer">
          Terms of Use
        </a>
        ,{' '}
        <a href={CRUSHON_COMMUNITY_GUIDELINES_URL} target="_blank" rel="noopener noreferrer">
          Community Guidelines
        </a>
        , and{' '}
        <a href={CRUSHON_PRIVACY_URL} target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>
        . The Crushon service is for users <strong>18+</strong>; you are responsible for your content and for
        complying with applicable laws and Crushon’s rules when publishing or chatting on their platform.
      </p>
    </aside>
  )
}
