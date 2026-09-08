<template>
  <Page v-loading="loading">
    <IBox v-if="entry" :title="entry.name">
      <template #header-right>
        <el-button link @click="toggleFavorite">{{ entry.is_favorite ? '★' : '☆' }}</el-button>
        <el-tag v-if="entry.break_glass" type="danger" size="large">{{ $t('BreakGlass') }}</el-tag>
        <el-tag :type="entry.sensitivity === 'CRITICAL' ? 'danger' : 'info'" size="large">
          {{ entry.sensitivity }}
        </el-tag>
        <el-tag :type="tierTagType(entry.security_tier)" size="large">{{ entry.security_tier }}</el-tag>
      </template>
      <!-- INFO/Corrigir-01.md, user request - full audit trail per
           credential (reveal/edit/disable/delete/...), same as PAM's
           Account detail already has. Reuses the existing shared
           ResourceActivity component/endpoint as-is (audits/activities/
           ?resource_id=) - every action here already calls log_event(),
           which writes to the same OperateLog this component reads, so
           no backend change was needed. -->
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="$t('Details')" name="details">
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="$t('Collection')">{{ entry.collection_name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Username')">
          <span v-if="entry.username" class="field-row">
            {{ entry.username }}
            <el-icon class="field-action" :title="$t('Copy')" @click="copyValue(entry.username)"><CopyDocument /></el-icon>
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('System')">{{ entry.system_name || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Category')">{{ categoryLabelOf(entry.category) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Manufacturer')">{{ entry.manufacturer || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Product')">{{ entry.product || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Status')">
          <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('SecretAge')">
          <span :class="{ 'age-warning': entry.secret_age_warning }">
            {{ secretAgeLabel }}
            <span v-if="entry.secret_age_warning">⚠</span>
          </span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('LastAccess')">{{ entry.last_accessed_at || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="entry.tags && entry.tags.length" class="tags-row">
        <el-tag v-for="t in entry.tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
      </div>

      <div v-if="entry.secret_age_warning" class="age-warning-banner">
        ⚠ {{ $t('SecretAgeWarning', { days: entry.secret_age_days }) }}
      </div>
      <div v-if="entry.status === 'PENDING_APPROVER_GROUP'" class="pending-approver-banner">
        {{ $t('EntryPendingApproverGroup') }}
      </div>

      <!-- 2026-09-07, user request - "principais propriedades como no
           Bitwarden": every category_fields entry, URL/IP values
           clickable, copy icon per row. -->
      <div v-if="propertyFields.length || longFields.length" class="properties-box">
        <h4>{{ $t('Properties') }}</h4>
        <div v-for="f in propertyFields" :key="f.key" class="field-row property-row">
          <span class="property-label">{{ f.label }}</span>
          <a v-if="f.href" :href="f.href" target="_blank" rel="noopener" class="property-value property-link">
            {{ f.value }}
            <el-icon class="field-action"><Link /></el-icon>
          </a>
          <span v-else class="property-value">{{ f.value }}</span>
          <el-icon class="field-action" :title="$t('Copy')" @click="copyValue(f.value)"><CopyDocument /></el-icon>
        </div>
        <div v-for="f in longFields" :key="f.key" class="property-row-long">
          <div class="property-label">
            {{ f.label }}
            <el-icon class="field-action" :title="$t('Copy')" @click="copyValue(f.value)"><CopyDocument /></el-icon>
          </div>
          <pre class="property-value-long">{{ f.value }}</pre>
        </div>
      </div>

      <div v-if="isGrouped" class="members-box">
        <div class="members-header">
          <h4>{{ $t('MemberCredentials') }} ({{ members.length }}/{{ groupedMaxMembers }})</h4>
          <div v-if="canManage && members.length < groupedMaxMembers" class="members-header-actions">
            <el-button type="primary" size="small" @click="addMemberDialog = true">
              {{ $t('AddMemberCredential') }}
            </el-button>
            <el-button size="small" @click="importMembersDialog = true">{{ $t('ImportCSV') }}</el-button>
          </div>
        </div>
        <el-table :data="members" size="small">
          <el-table-column prop="name" :label="$t('Name')" />
          <el-table-column prop="username" :label="$t('Username')" />
          <el-table-column prop="ip_hostname" :label="$t('IPHostname')" />
          <el-table-column prop="owner" :label="$t('Owner')" />
          <el-table-column :label="$t('Password')">
            <template #default="{ row }">
              <span v-if="revealedMemberId === row.id" class="secret-value">{{ revealedMemberPassword }}</span>
              <el-button v-else link type="primary" size="small" @click="openRevealMember(row)">
                {{ $t('RevealPassword') }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column v-if="canManage" width="80">
            <template #default="{ row }">
              <el-button link type="danger" size="small" @click="removeMember(row)">{{ $t('Delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="secret-box">
        <!-- 2026-09-07, user request - same eye/copy icon pattern the PAM
             module already uses for account secrets. The underlying
             MFA/approval-grant flow is unchanged (S38 section 39-41):
             protected credentials still need an approved request before
             the eye icon does anything but ask for one. -->
        <div class="property-row">
          <span class="property-label">{{ $t('Password') }}</span>
          <span class="property-value secret-value">{{ revealed ? revealed.password : '••••••••' }}</span>
          <template v-if="!revealed">
            <el-icon
              v-if="!entry.protected_credential || approvedGrant"
              class="field-action" :title="$t('RevealPassword')"
              @click="revealDialog = true"
            >
              <View />
            </el-icon>
            <el-icon v-else class="field-action" :title="$t('RequestAccess')" @click="requestDialog = true">
              <View />
            </el-icon>
          </template>
          <el-icon v-else class="field-action" :title="$t('HidePassword')" @click="revealed = null">
            <Hide />
          </el-icon>
          <el-icon v-if="revealed" class="field-action" :title="$t('Copy')" @click="doCopy"><CopyDocument /></el-icon>
        </div>
        <template v-if="revealed">
          <span class="secret-ttl">{{ $t('VisibleFor') }}: {{ countdown }}s</span>
          <div class="watermark">
            {{ revealed.watermark.user }} · {{ revealed.watermark.tenant }} ·
            {{ revealed.watermark.timestamp }} · {{ revealed.reveal_id }}
          </div>
        </template>
      </div>

      <div v-if="entry.protected_credential && pendingRequest" class="pending-banner">
        {{ $t('AccessPending') }} ({{ pendingRequest.status }})
        <el-button link type="primary" size="small" @click="loadRequests">{{ $t('Refresh') }}</el-button>
      </div>

      <div v-if="canManage" class="manage-actions">
        <el-button size="small" @click="openEdit">{{ $t('EditMetadata') }}</el-button>
        <el-button v-if="canSetSecret" size="small" @click="openSetSecret">{{ $t('ChangeSecret') }}</el-button>
        <el-button size="small" @click="openChangeClassification">{{ $t('ChangeClassification') }}</el-button>
        <el-button v-if="$hasPerm('repository.add_repositoryentry')" size="small" @click="cloneEntry">{{ $t('Clone') }}</el-button>
        <el-button
          v-if="entry.status !== 'DISABLED'"
          size="small"
          type="danger"
          plain
          @click="disableEntry"
        >
          {{ $t('DisableCredential') }}
        </el-button>
        <el-button v-else size="small" type="primary" plain @click="enableEntry">
          {{ $t('EnableCredential') }}
        </el-button>
        <!-- 2026-09-06 - delete only offered once disabled (backend also
             enforces this); Tier 0 gets the approval workflow instead. -->
        <el-button
          v-if="entry.status === 'DISABLED' && entry.security_tier !== 'TIER_0' && canDelete"
          size="small" type="danger"
          @click="deleteDialog = true"
        >
          {{ $t('DeleteCredential') }}
        </el-button>
        <el-button
          v-if="entry.status === 'DISABLED' && entry.security_tier === 'TIER_0' && canDelete"
          size="small" type="danger"
          @click="requestDeleteDialog = true"
        >
          {{ $t('RequestDeletion') }}
        </el-button>
      </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('Activity')" name="activity" lazy>
          <ResourceActivity :object="entry" :title="$t('Activity')" />
        </el-tab-pane>
      </el-tabs>
    </IBox>

    <EntryDeleteDialog
      v-model="deleteDialog" :entry="entry"
      @deleted="$router.push({ name: 'RepositoryCredentials' })"
    />
    <EntryRequestDeleteDialog v-model="requestDeleteDialog" :entry="entry" @requested="load" />

    <!-- 2026-09-06 - grouped record (10x1/20x1/30x1) member add -->
    <el-dialog v-model="addMemberDialog" :title="$t('AddMemberCredential')" width="440px">
      <el-form label-position="top">
        <el-form-item :label="$t('Name')" required>
          <el-input v-model="memberForm.name" />
        </el-form-item>
        <el-form-item :label="$t('Username')">
          <el-input v-model="memberForm.username" />
        </el-form-item>
        <el-form-item :label="$t('IPHostname')">
          <el-input v-model="memberForm.ip_hostname" />
        </el-form-item>
        <el-form-item :label="$t('Owner')">
          <el-input v-model="memberForm.owner" />
        </el-form-item>
        <el-form-item :label="$t('Password')" required>
          <el-input v-model="memberForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item :label="$t('Notes')">
          <el-input v-model="memberForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addMemberDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button
          type="primary" :loading="submitting"
          :disabled="!memberForm.name || !memberForm.password"
          @click="submitAddMember"
        >
          {{ $t('Save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 2026-09-07, production-readiness review - bulk import via CSV -->
    <el-dialog v-model="importMembersDialog" :title="$t('ImportCSV')" width="480px">
      <el-alert type="info" :closable="false" show-icon :title="$t('ImportCSVHelp')" class="import-help" />
      <el-form label-position="top">
        <el-form-item :label="$t('CSVFile')" required>
          <input type="file" accept=".csv,text/csv" @change="onImportFileChange" />
        </el-form-item>
      </el-form>
      <div v-if="importResult" class="import-result">
        <p>{{ $t('ImportCreatedCount', { n: importResult.created_count }) }}</p>
        <ul v-if="importResult.errors.length" class="import-errors">
          <li v-for="e in importResult.errors" :key="e.row">{{ $t('ImportRowError', { row: e.row, error: e.error }) }}</li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="importMembersDialog = false">{{ $t('Close') }}</el-button>
        <el-button type="primary" :loading="submitting" :disabled="!importFile" @click="submitImportMembers">
          {{ $t('ImportCSV') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="revealMemberDialog" :title="$t('RevealPassword')" width="380px">
      <el-form label-position="top">
        <el-form-item :label="$t('MFACodeTOTP')" required>
          <el-input v-model="revealMemberTotp" maxlength="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="revealMemberDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRevealMember">{{ $t('RevealPassword') }}</el-button>
      </template>
    </el-dialog>

    <!-- S37 section 22-24 / S38 section 43-44 - Request Access: reason + optional reference + fresh MFA -->
    <el-dialog v-model="requestDialog" :title="$t('RequestAccess')" width="420px">
      <el-form label-position="top">
        <el-form-item :label="$t('Reason')" required>
          <el-input v-model="requestForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('Reference')">
          <el-input v-model="requestForm.reference" :placeholder="$t('ReferencePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('MFACodeTOTP')" required>
          <el-input v-model="requestForm.totp_code" maxlength="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="requestDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRequest">{{ $t('Submit') }}</el-button>
      </template>
    </el-dialog>

    <!-- S38 section 41 - every reveal, protected or not, needs fresh TOTP -->
    <el-dialog v-model="revealDialog" :title="$t('RevealPassword')" width="380px">
      <el-form label-position="top">
        <el-form-item :label="$t('MFACodeTOTP')" required>
          <el-input v-model="revealTotp" maxlength="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="revealDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="doReveal">{{ $t('RevealPassword') }}</el-button>
      </template>
    </el-dialog>

    <!-- S37 section 71/12 - metadata only, never security_tier/secret (each has its own dialog/guard) -->
    <el-dialog v-model="editDialog" :title="$t('EditMetadata')" width="480px">
      <el-form label-position="top">
        <el-form-item :label="$t('Name')" required>
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item :label="$t('Username')">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item :label="$t('System')">
          <el-input v-model="editForm.system_name" />
        </el-form-item>
        <el-form-item :label="$t('Manufacturer')">
          <el-input v-model="editForm.manufacturer" />
        </el-form-item>
        <el-form-item :label="$t('Product')">
          <el-input v-model="editForm.product" />
        </el-form-item>
        <el-form-item :label="$t('Tags')">
          <el-select v-model="editForm.tags" multiple filterable allow-create default-first-option style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('Description')">
          <el-input v-model="editForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">{{ $t('Save') }}</el-button>
      </template>
    </el-dialog>

    <!-- S37 section 62-63 / S38 section 68-70 - previous secret never needs to be revealed to set a new one -->
    <el-dialog v-model="setSecretDialog" :title="$t('ChangeSecret')" width="420px">
      <el-form label-position="top">
        <el-form-item :label="$t('NewPassword')" required>
          <el-input v-model="setSecretForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item :label="$t('ConfirmNewPassword')" required>
          <el-input v-model="setSecretForm.confirm" type="password" show-password />
        </el-form-item>
        <template v-if="entry.protected_credential">
          <el-form-item :label="$t('Reason')" required>
            <el-input v-model="setSecretForm.reason" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item :label="$t('MFACodeTOTP')" required>
            <el-input v-model="setSecretForm.totp_code" maxlength="6" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="setSecretDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitSetSecret">{{ $t('Save') }}</el-button>
      </template>
    </el-dialog>

    <!-- S38 section 71-74 - classification change requires reason + MFA; a
         downgrade in protection also requires explicit confirmation -->
    <el-dialog v-model="classificationDialog" :title="$t('ChangeClassification')" width="440px">
      <el-form label-position="top">
        <el-form-item :label="$t('Tier')" required>
          <el-select v-model="classificationForm.security_tier" style="width: 100%">
            <el-option label="TIER_0" value="TIER_0" />
            <el-option label="TIER_1" value="TIER_1" />
            <el-option label="TIER_2" value="TIER_2" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('Sensitivity')" required>
          <el-select
            v-model="classificationForm.sensitivity"
            style="width: 100%"
            :disabled="['TIER_0', 'TIER_1'].includes(classificationForm.security_tier)"
          >
            <el-option label="CRITICAL" value="CRITICAL" />
            <el-option label="NONCRITICAL" value="NONCRITICAL" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="classificationForm.break_glass">{{ $t('BreakGlass') }}</el-checkbox>
        </el-form-item>
        <el-form-item :label="$t('Reason')" required>
          <el-input v-model="classificationForm.reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="$t('MFACodeTOTP')" required>
          <el-input v-model="classificationForm.totp_code" maxlength="6" />
        </el-form-item>
        <el-form-item v-if="isDowngrade">
          <el-checkbox v-model="classificationForm.confirm">{{ $t('ConfirmTierChange') }}</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="classificationDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="isDowngrade && !classificationForm.confirm"
          @click="submitChangeClassification"
        >
          {{ $t('Save') }}
        </el-button>
      </template>
    </el-dialog>
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import { IBox, ResourceActivity } from '@/components'
import EntryDeleteDialog from './EntryDeleteDialog.vue'
import EntryRequestDeleteDialog from './EntryRequestDeleteDialog.vue'
import { copy } from '@/utils/common/index'
import { categoryLabel } from '@/utils/repository/categoryIcons'

// 2026-09-07, user request - "principais propriedades como no Bitwarden":
// category_fields rendered as a property list (not hidden), URL/IP/
// hostname-looking values as clickable links, copy icon per field. Keys
// here are cosmetic only (label + link/URL heuristics) - the actual
// per-category fields are defined server-side in repository/categories.py.
const FIELD_LABELS = {
  target: 'Target', ip_hostname: 'IPHostname', management_url: 'ManagementURL', technology: 'Technology',
  device_model: 'DeviceModel', provider: 'Provider', api_type: 'APIType', application: 'ApplicationService',
  environment: 'Environment', base_url: 'BaseURL', expiration_date: 'ExpirationDate', vendor: 'Vendor',
  software: 'Software', total_licenses: 'TotalLicenses', licenses_in_use: 'LicensesInUse',
  cert_type: 'CertificateType', common_name: 'CommonName', issuer: 'Issuer', self_signed: 'SelfSigned',
  key_algorithm: 'KeyAlgorithm', public_key: 'PublicKey', snmp_version: 'SNMPVersion',
  snmpv3_security_level: 'SecurityLevel', authorized_collector_ips: 'AuthorizedCollectorIPs'
}
// long/multiline values (certs, key blocks, IP lists) - shown as text, not a single-line link row
const LONG_FIELDS = new Set(['public_certificate', 'public_key', 'authorized_collector_ips'])
const URL_FIELDS = new Set(['management_url', 'base_url'])
const HOST_FIELDS = new Set(['ip_hostname', 'target'])

const STATUS_LABELS = {
  ACTIVE: 'Active',
  DISABLED: 'Disabled',
  PENDING_APPROVER_GROUP: 'PendingApproverGroup'
}
const GROUPED_MAX_MEMBERS = { GROUPED_10: 10, GROUPED_20: 20, GROUPED_30: 30 }

export default {
  name: 'EntryDetail',
  components: { Page, IBox, ResourceActivity, EntryDeleteDialog, EntryRequestDeleteDialog },
  data() {
    return {
      loading: true,
      activeTab: 'details',
      entry: null,
      pendingRequest: null,
      approvedGrant: null, // the latest APPROVED request for this entry/user, if any
      requestDialog: false,
      requestForm: { reason: '', reference: '', totp_code: '' },
      revealDialog: false,
      revealTotp: '',
      editDialog: false,
      editForm: {},
      setSecretDialog: false,
      setSecretForm: { password: '', confirm: '', reason: '', totp_code: '' },
      classificationDialog: false,
      classificationForm: { security_tier: '', sensitivity: '', break_glass: false, reason: '', totp_code: '', confirm: false },
      submitting: false,
      revealed: null,
      countdown: 0,
      timer: null,
      deleteDialog: false,
      requestDeleteDialog: false,
      members: [],
      addMemberDialog: false,
      memberForm: { name: '', username: '', ip_hostname: '', owner: '', notes: '', password: '' },
      importMembersDialog: false,
      importFile: null,
      importResult: null,
      revealMemberDialog: false,
      revealMemberTotp: '',
      revealMemberTarget: null,
      revealedMemberId: null,
      revealedMemberPassword: ''
    }
  },
  computed: {
    isGrouped() {
      return Object.prototype.hasOwnProperty.call(GROUPED_MAX_MEMBERS, this.entry?.category)
    },
    groupedMaxMembers() {
      return GROUPED_MAX_MEMBERS[this.entry?.category] || 0
    },
    canDelete() {
      return this.$hasPerm('repository.delete_repositoryentry')
    },
    statusLabel() {
      return this.entry ? this.$t(STATUS_LABELS[this.entry.status] || this.entry.status) : ''
    },
    statusTagType() {
      return { ACTIVE: 'success', DISABLED: 'info', PENDING_APPROVER_GROUP: 'warning' }[this.entry?.status] || 'info'
    },
    canManage() {
      return this.$hasPerm('repository.change_repositoryentry')
    },
    canSetSecret() {
      return this.$hasPerm('repository.set_repositoryentry_secret')
    },
    secretAgeLabel() {
      const days = this.entry?.secret_age_days
      return days === null || days === undefined ? '-' : this.$t('DaysAgo', { days })
    },
    // "principais propriedades como no Bitwarden" - every category_fields
    // entry as a labeled row, with a best-effort clickable link for
    // URL/IP/hostname-looking values. Long/multiline values (certs, key
    // blocks, IP lists) are rendered separately below, not as a row.
    propertyFields() {
      const fields = this.entry?.category_fields || {}
      return Object.entries(fields)
        .filter(([key, value]) => !LONG_FIELDS.has(key) && value !== '' && value !== null && value !== undefined)
        .map(([key, value]) => ({
          key, label: this.$t(FIELD_LABELS[key] || key), value: String(value), href: this.linkFor(key, value)
        }))
    },
    longFields() {
      const fields = this.entry?.category_fields || {}
      return Object.entries(fields)
        .filter(([key, value]) => LONG_FIELDS.has(key) && value)
        .map(([key, value]) => ({
          key, label: this.$t(FIELD_LABELS[key] || key),
          value: Array.isArray(value) ? value.join('\n') : String(value)
        }))
    },
    isDowngrade() {
      const wasProtected = this.entry &&
        (['TIER_0', 'TIER_1'].includes(this.entry.security_tier) || this.entry.sensitivity === 'CRITICAL' || this.entry.break_glass)
      const willBeProtected =
        ['TIER_0', 'TIER_1'].includes(this.classificationForm.security_tier) ||
        this.classificationForm.sensitivity === 'CRITICAL' || this.classificationForm.break_glass
      return wasProtected && !willBeProtected
    }
  },
  watch: {
    'classificationForm.security_tier'(tier) {
      if (['TIER_0', 'TIER_1'].includes(tier)) this.classificationForm.sensitivity = 'CRITICAL'
    },
    'classificationForm.break_glass'(val) {
      if (val) this.classificationForm.sensitivity = 'CRITICAL'
    },
    // 2026-09-07 - Clone navigates to the new entry's own detail route
    // while already on this page (same component instance, route params
    // change but nothing remounts by default) - reload for the new id.
    '$route.params.id'() {
      this.load()
    }
  },
  created() {
    this.load()
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    tierTagType(tier) {
      return { TIER_0: 'danger', TIER_1: 'warning', TIER_2: 'info' }[tier] || 'info'
    },
    copyValue(value) {
      copy(value)
    },
    categoryLabelOf(c) {
      return categoryLabel(c)
    },
    // best-effort clickable link: real URLs as-is, IP/hostname-shaped
    // fields get an assumed http:// prefix (opens the device's own web
    // UI - the common convention for these categories, never guaranteed).
    linkFor(key, value) {
      if (/^https?:\/\//i.test(value)) return value
      if (URL_FIELDS.has(key)) return `https://${value}`
      if (HOST_FIELDS.has(key)) return `http://${value}`
      return null
    },
    async load() {
      this.loading = true
      try {
        const data = await this.$axios.get(`/api/v1/repository/entries/${this.$route.params.id}/`)
        this.entry = data
        if (this.entry.protected_credential) {
          await this.loadRequests()
        }
        if (this.isGrouped) {
          await this.loadMembers()
        }
        // 2026-09-06 - list's Edit button links here with ?edit=1 so it
        // opens straight into the existing edit dialog, no second form.
        if (this.$route.query.edit) this.openEdit()
      } finally {
        this.loading = false
      }
    },
    async loadMembers() {
      this.members = await this.$axios.get(`/api/v1/repository/entries/${this.entry.id}/members/`)
    },
    async submitAddMember() {
      this.submitting = true
      try {
        await this.$axios.post(`/api/v1/repository/entries/${this.entry.id}/members/`, this.memberForm)
        this.$message.success(this.$t('MemberAdded'))
        this.addMemberDialog = false
        this.memberForm = { name: '', username: '', ip_hostname: '', owner: '', notes: '', password: '' }
        await this.loadMembers()
      } finally {
        this.submitting = false
      }
    },
    onImportFileChange(event) {
      this.importFile = event.target.files[0] || null
      this.importResult = null
    },
    async submitImportMembers() {
      this.submitting = true
      try {
        const form = new FormData()
        form.append('file', this.importFile)
        const data = await this.$axios.post(`/api/v1/repository/entries/${this.entry.id}/members/import/`, form)
        this.importResult = data
        if (data.created_count) this.$message.success(this.$t('ImportCreatedCount', { n: data.created_count }))
        await this.loadMembers()
      } finally {
        this.submitting = false
      }
    },
    async removeMember(member) {
      await this.$axios.delete(`/api/v1/repository/entries/${this.entry.id}/members/${member.id}/`)
      this.$message.success(this.$t('MemberRemoved'))
      await this.loadMembers()
    },
    // 2026-09-06 - a grouped record can itself be Tier 0/1/Critical
    // (protected_credential comes from the PARENT entry's own
    // classification); member reveal must go through the same
    // request-access -> approved grant flow as the entry's own reveal,
    // not just fresh MFA (security review finding).
    openRevealMember(member) {
      this.revealMemberTarget = member
      if (this.entry.protected_credential) {
        if (!this.approvedGrant) {
          this.requestDialog = true
          return
        }
        this.revealMemberViaGrant()
        return
      }
      this.revealMemberTotp = ''
      this.revealMemberDialog = true
    },
    finishMemberReveal(data) {
      this.revealedMemberId = this.revealMemberTarget.id
      this.revealedMemberPassword = data.password
      setTimeout(() => {
        if (this.revealedMemberId === this.revealMemberTarget.id) {
          this.revealedMemberId = null
          this.revealedMemberPassword = ''
        }
      }, (data.ttl_seconds || 30) * 1000)
    },
    async revealMemberViaGrant() {
      this.submitting = true
      try {
        const data = await this.$axios.post(
          `/api/v1/repository/entries/${this.entry.id}/members/${this.revealMemberTarget.id}/reveal/`,
          { request: this.approvedGrant.id }
        )
        this.approvedGrant = null // one-time grant, consumed server-side
        this.finishMemberReveal(data)
      } finally {
        this.submitting = false
      }
    },
    async submitRevealMember() {
      this.submitting = true
      try {
        const data = await this.$axios.post(
          `/api/v1/repository/entries/${this.entry.id}/members/${this.revealMemberTarget.id}/reveal/`,
          { totp_code: this.revealMemberTotp }
        )
        this.revealMemberDialog = false
        this.finishMemberReveal(data)
      } finally {
        this.submitting = false
      }
    },
    async loadRequests() {
      const data = await this.$axios.get('/api/v1/repository/requests/', {
        params: { entry: this.entry.id }
      })
      const results = data.results || data
      this.pendingRequest = results.find((r) => r.status === 'PENDING_APPROVAL') || null
      this.approvedGrant = results.find((r) => r.status === 'APPROVED') || null
    },
    async toggleFavorite() {
      const action = this.entry.is_favorite ? 'unfavorite' : 'favorite'
      await this.$axios.post(`/api/v1/repository/entries/${this.entry.id}/${action}/`)
      this.entry.is_favorite = !this.entry.is_favorite
    },
    async submitRequest() {
      this.submitting = true
      try {
        await this.$axios.post(
          `/api/v1/repository/entries/${this.entry.id}/request-access/`,
          this.requestForm
        )
        this.requestDialog = false
        this.requestForm = { reason: '', reference: '', totp_code: '' }
        this.$message.success(this.$t('AccessRequestCreated'))
        await this.loadRequests()
      } finally {
        this.submitting = false
      }
    },
    async doReveal() {
      this.submitting = true
      try {
        const payload = this.entry.protected_credential
          ? { request: this.approvedGrant.id }
          : { totp_code: this.revealTotp }
        const data = await this.$axios.post(`/api/v1/repository/entries/${this.entry.id}/reveal/`, payload)
        this.revealed = data
        this.revealDialog = false
        this.revealTotp = ''
        this.countdown = data.ttl_seconds
        clearInterval(this.timer)
        this.timer = setInterval(() => {
          this.countdown -= 1
          if (this.countdown <= 0) {
            clearInterval(this.timer)
            this.revealed = null // section 57 - masked again after visual TTL
            this.approvedGrant = null // one-time grant, consumed server-side
          }
        }, 1000)
      } finally {
        this.submitting = false
      }
    },
    async doCopy() {
      if (!this.revealed) return
      await navigator.clipboard.writeText(this.revealed.password)
      await this.$axios.post(`/api/v1/repository/entries/${this.entry.id}/copy/`)
      this.$message.success(this.$t('CopiedToClipboard'))
    },
    openEdit() {
      const { name, username, system_name, description, manufacturer, product, tags } = this.entry
      this.editForm = { name, username, system_name, description, manufacturer, product, tags: [...(tags || [])] }
      this.editDialog = true
    },
    async submitEdit() {
      this.submitting = true
      try {
        const data = await this.$axios.patch(`/api/v1/repository/entries/${this.entry.id}/`, this.editForm)
        this.entry = { ...this.entry, ...data, tags: this.editForm.tags }
        this.editDialog = false
        this.$message.success(this.$t('SavedSuccessfully'))
      } finally {
        this.submitting = false
      }
    },
    openSetSecret() {
      this.setSecretForm = { password: '', confirm: '', reason: '', totp_code: '' }
      this.setSecretDialog = true
    },
    async submitSetSecret() {
      if (!this.setSecretForm.password || this.setSecretForm.password !== this.setSecretForm.confirm) {
        this.$message.error(this.$t('PasswordsDoNotMatch'))
        return
      }
      this.submitting = true
      try {
        await this.$axios.post(`/api/v1/repository/entries/${this.entry.id}/set-secret/`, this.setSecretForm)
        this.setSecretDialog = false
        this.$message.success(this.$t('SecretChanged'))
      } finally {
        this.submitting = false
      }
    },
    openChangeClassification() {
      this.classificationForm = {
        security_tier: this.entry.security_tier, sensitivity: this.entry.sensitivity,
        break_glass: this.entry.break_glass, reason: '', totp_code: '', confirm: false,
      }
      this.classificationDialog = true
    },
    async submitChangeClassification() {
      this.submitting = true
      try {
        const data = await this.$axios.post(
          `/api/v1/repository/entries/${this.entry.id}/change-classification/`,
          this.classificationForm
        )
        this.entry = { ...this.entry, ...data }
        this.classificationDialog = false
        this.$message.success(this.$t('SavedSuccessfully'))
        if (this.entry.protected_credential) await this.loadRequests()
      } finally {
        this.submitting = false
      }
    },
    async disableEntry() {
      try {
        await this.$confirm(this.$t('ConfirmDisableCredential'), this.$t('Warning'), { type: 'warning' })
      } catch {
        return
      }
      const data = await this.$axios.post(`/api/v1/repository/entries/${this.entry.id}/disable/`)
      this.entry = { ...this.entry, ...data }
      this.$message.success(this.$t('CredentialDisabled'))
    },
    async cloneEntry() {
      const data = await this.$axios.post(`/api/v1/repository/entries/${this.entry.id}/clone/`)
      this.$message.success(this.$t('CredentialCloned'))
      this.$router.push({ name: 'RepositoryCredentialDetail', params: { id: data.id } })
    },
    // 2026-09-07, production-readiness review - reactivation always
    // requires fresh MFA (disable itself doesn't - it only reduces
    // exposure; enabling is what makes the credential usable again).
    async enableEntry() {
      let totpCode
      try {
        ({ value: totpCode } = await this.$prompt(this.$t('MFACodeTOTP'), this.$t('EnableCredential'), {
          confirmButtonText: this.$t('EnableCredential'),
          cancelButtonText: this.$t('Cancel'),
          inputPattern: /^\d{6}$/,
          inputErrorMessage: this.$t('MFACodeTOTP')
        }))
      } catch {
        return
      }
      const data = await this.$axios.post(`/api/v1/repository/entries/${this.entry.id}/enable/`, { totp_code: totpCode })
      this.entry = { ...this.entry, ...data }
      this.$message.success(this.$t('CredentialEnabled'))
    }
  }
}
</script>

<style scoped>
.field-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.field-action {
  cursor: pointer;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
.field-action:hover {
  color: var(--el-color-primary);
}
.properties-box {
  margin-top: 16px;
}
.properties-box h4 {
  margin: 0 0 8px;
}
.property-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
}
.property-label {
  width: 160px;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}
.property-value {
  flex: 1;
  word-break: break-all;
}
.property-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--el-color-primary);
}
.property-row-long {
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
}
.property-row-long .property-label {
  width: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.property-value-long {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
  font-size: 12px;
  background: var(--el-fill-color-light);
  padding: 8px;
  border-radius: 4px;
}
.members-box {
  margin-top: 16px;
}
.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.members-header h4 {
  margin: 0;
}
.members-header-actions {
  display: flex;
  gap: 8px;
}
.import-help {
  margin-bottom: 12px;
}
.import-result {
  margin-top: 12px;
  font-size: 13px;
}
.import-errors {
  margin: 6px 0 0;
  padding-left: 18px;
  color: var(--el-color-danger);
}
.secret-box {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.secret-mask,
.secret-value {
  font-family: monospace;
  font-size: 16px;
}
.secret-ttl {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.watermark {
  width: 100%;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  opacity: 0.7;
}
.pending-banner {
  margin-top: 12px;
  color: var(--el-color-warning);
  display: flex;
  align-items: center;
  gap: 8px;
}
.pending-approver-banner,
.age-warning-banner {
  margin-top: 12px;
  color: var(--el-color-warning);
}
.age-warning {
  color: var(--el-color-warning);
}
.tags-row {
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.manage-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  gap: 8px;
}
</style>
