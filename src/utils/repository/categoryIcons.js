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

// 2026-09-06 - human labels for the tech-distribution row (was showing
// the raw enum key). Mirrors repository/const.py EntryCategory choices.
export const CATEGORY_LABELS = {
  GENERIC_CREDENTIAL: 'Generic Credential',
  SERVER_MANAGEMENT: 'Server Management',
  NETWORK_CREDENTIAL: 'Network Credential',
  SNMP: 'SNMP',
  API_CREDENTIAL: 'API Credential',
  SOFTWARE_LICENSE: 'Software License',
  APPLICATION_CREDENTIAL: 'Application Credential',
  DATABASE_CREDENTIAL: 'Database Credential',
  CERTIFICATE: 'Certificate',
  SSH_KEY: 'SSH Key',
  GROUPED_10: 'Grouped Record (10x1)',
  GROUPED_20: 'Grouped Record (20x1)',
  GROUPED_30: 'Grouped Record (30x1)'
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category
}
