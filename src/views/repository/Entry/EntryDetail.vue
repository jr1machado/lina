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
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="$t('Collection')">{{ entry.collection_name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Username')">{{ entry.username }}</el-descriptions-item>
        <el-descriptions-item :label="$t('System')">{{ entry.system_name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Category')">{{ entry.category }}</el-descriptions-item>
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

      <div class="secret-box">
        <template v-if="!revealed">
          <span class="secret-mask">••••••••</span>
          <!-- S38 section 39-41 - protected credentials (Tier0/1/Critical/
               Break Glass) never expose a direct reveal button; every
               reveal (protected or not) requires fresh MFA. -->
          <template v-if="entry.protected_credential">
            <el-button v-if="approvedGrant" type="primary" @click="revealDialog = true">
              {{ $t('RevealPassword') }}
            </el-button>
            <el-button v-else type="primary" @click="requestDialog = true">
              {{ $t('RequestAccess') }}
            </el-button>
          </template>
          <el-button v-else type="primary" @click="revealDialog = true">{{ $t('RevealPassword') }}</el-button>
        </template>
        <template v-else>
          <span class="secret-value">{{ revealed.password }}</span>
          <el-button size="small" @click="doCopy">{{ $t('Copy') }}</el-button>
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
        <el-button
          v-if="entry.status !== 'DISABLED'"
          size="small"
          type="danger"
          plain
          @click="disableEntry"
        >
          {{ $t('DisableCredential') }}
        </el-button>
      </div>
    </IBox>

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
import { IBox } from '@/components'

const STATUS_LABELS = {
  ACTIVE: 'Active',
  DISABLED: 'Disabled',
  PENDING_APPROVER_GROUP: 'PendingApproverGroup'
}

export default {
  name: 'EntryDetail',
  components: { Page, IBox },
  data() {
    return {
      loading: true,
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
      timer: null
    }
  },
  computed: {
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
    async load() {
      this.loading = true
      try {
        const data = await this.$axios.get(`/api/v1/repository/entries/${this.$route.params.id}/`)
        this.entry = data
        if (this.entry.protected_credential) {
          await this.loadRequests()
        }
      } finally {
        this.loading = false
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
    }
  }
}
</script>

<style scoped>
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
