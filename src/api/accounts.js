import request from '@/utils/request'

// Sprint_34-Credential-Recovery-Contas-Reconciliacao.md §12/15-17/74-75 -
// Bulk Provision Recovery Accounts.
export function provisionRecoveryAccounts(data) {
  return request({
    url: '/api/v1/accounts/recovery-accounts/provision/',
    method: 'post',
    data
  })
}

// S20 - unchanged CRUD, reused here to finish a Linux binding once an
// administrator supplies the real SSH host key fingerprint (never
// TOFU-learned, S20 §15).
export function createLinuxRotationExecutorBinding(data) {
  return request({
    url: '/api/v1/accounts/linux-rotation-executor-bindings/',
    method: 'post',
    data
  })
}
