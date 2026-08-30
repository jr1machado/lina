// Help center content registry. Each module ships its own PT-BR/EN
// markdown pair as plain .md files (Vite's `?raw` import), rendered
// read-only by the existing VueMarkdown widget - no new dependency, no
// duplicating long-form docs inside the short-string i18n catalog.
import vaultSecurityPtBr from './vault-security.pt_br.md?raw'
import vaultSecurityEn from './vault-security.en.md?raw'
import sessionRecordingPtBr from './session-recording.pt_br.md?raw'
import sessionRecordingEn from './session-recording.en.md?raw'

export const HELP_MODULES = [
  {
    key: 'vault-security',
    title: { en: 'Vault Security Center', pt_br: 'Vault Security Center' },
    content: { en: vaultSecurityEn, pt_br: vaultSecurityPtBr }
  },
  {
    key: 'session-recording',
    title: { en: 'Session Recording', pt_br: 'Gravação de Sessões' },
    content: { en: sessionRecordingEn, pt_br: sessionRecordingPtBr }
  }
]
