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

// S18A - rotation job history for one account (or asset), same list the
// backend already tracked with no Lina consumer until now.
export function getRotationJobs(params) {
  return request({
    url: '/api/v1/accounts/rotation-jobs/',
    method: 'get',
    params
  })
}

// S18A §65-70 - "Rotate Now": reuses the emergency-rotation execute
// endpoint scoped to exactly this one account, same as a real incident
// batch would use, just with account_ids=[id]. No separate single-account
// rotate endpoint exists (or is needed) - avoids a second code path.
export function rotateAccountNow(accountId) {
  return request({
    url: '/api/v1/accounts/rotation-jobs/emergency/execute/',
    method: 'post',
    data: { account_ids: [accountId], incident_ref: 'MANUAL_UI' }
  })
}

// Sprint_34-Credential-Recovery-Contas-Reconciliacao.md §42-43 -
// "Reconcile Now": manual drift recovery, never exposes a secret.
export function reconcileAccountNow(accountId) {
  return request({
    url: `/api/v1/accounts/accounts/${accountId}/reconcile/`,
    method: 'post'
  })
}

// Sprint_34-Credential-Recovery-Contas-Reconciliacao.md §48 - "Test
// Recovery": S20/S21 readiness checks already existed backend-side with no
// Lina consumer - never touches the password, just proves the recovery
// path (SSH/WinRM auth, sudo/privilege, target account) actually works.
export function testLinuxRotationReadiness(accountId) {
  return request({
    url: `/api/v1/accounts/accounts/${accountId}/rotation-readiness/`,
    method: 'post'
  })
}

export function testWindowsRotationReadiness(accountId) {
  return request({
    url: `/api/v1/accounts/accounts/${accountId}/windows-rotation-readiness/`,
    method: 'post'
  })
}

// Sprint_35-Rotation-Policy-Editor.md §19-25, §78 - platform template
// catalog, read-only except for Clone.
export function listRotationPolicyTemplates() {
  return request({
    url: '/api/v1/accounts/rotation-policy-templates/',
    method: 'get'
  })
}

export function cloneRotationPolicyTemplate(templateId, name) {
  return request({
    url: `/api/v1/accounts/rotation-policy-templates/${templateId}/clone/`,
    method: 'post',
    data: { name }
  })
}

// Sprint_35 §28-30, §63-68 - Bulk Assignment with a mandatory Impact
// Preview step before applying.
export function previewRotationPolicyAssignment(policyId, scope) {
  return request({
    url: `/api/v1/accounts/rotation-policies/${policyId}/assignment-preview/`,
    method: 'post',
    data: scope
  })
}

export function assignRotationPolicy(policyId, scope) {
  return request({
    url: `/api/v1/accounts/rotation-policies/${policyId}/assign/`,
    method: 'post',
    data: scope
  })
}

// Sprint_35 §30-35 - temporary, justified rotation suspension.
export function createRotationException(data) {
  return request({
    url: '/api/v1/accounts/rotation-exceptions/',
    method: 'post',
    data
  })
}

export function revokeRotationException(exceptionId) {
  return request({
    url: `/api/v1/accounts/rotation-exceptions/${exceptionId}/revoke/`,
    method: 'post'
  })
}

// Sprint_36 §120-121 - Bulk Classification: preview=true never persists.
// §115-116 - reason is required only for sensitive transitions (Tier 0
// away, Purpose into/out of Reconciliation/Break Glass); the backend
// tells us via the preview's needs_reason flag.
export function bulkClassifyAccounts(accountIds, field, value, preview, reason) {
  return request({
    url: '/api/v1/accounts/accounts/bulk-classification/',
    method: 'post',
    data: { account_ids: accountIds, field, value, preview, reason }
  })
}
