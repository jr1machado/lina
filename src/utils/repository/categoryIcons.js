// 2026-09-05 - shared category -> Element Plus icon name map for the
// Credential Repository module (icon-tile category picker in
// EntryCreateUpdate.vue, technology-distribution row in Dashboard).
// One source of truth instead of two hardcoded copies.
export const CATEGORY_ICONS = {
  GENERIC_CREDENTIAL: 'Key',
  SERVER_MANAGEMENT: 'Monitor',
  NETWORK_CREDENTIAL: 'Share',
  SNMP: 'DataLine',
  API_CREDENTIAL: 'Connection',
  SOFTWARE_LICENSE: 'Ticket',
  APPLICATION_CREDENTIAL: 'Grid',
  DATABASE_CREDENTIAL: 'Coin',
  CERTIFICATE: 'DocumentChecked',
  SSH_KEY: 'Cpu'
}

export function categoryIcon(category) {
  return CATEGORY_ICONS[category] || 'Key'
}
