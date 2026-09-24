<template>
  <Page v-loading="loading">
    <IBox v-if="req" :title="$t('TOTPSeedExport')">
      <el-alert type="warning" :closable="false" show-icon :title="$t('SeedExportCriticalityWarning')" class="warning" />
      <el-descriptions :column="1" border>
        <el-descriptions-item :label="$t('Credential')">{{ req.entry_name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Requester')">{{ req.requested_by_name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Format')">{{ formatLabel }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Reason')">{{ req.reason }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Requested')">{{ req.date_created }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Status')">{{ req.status }}</el-descriptions-item>
        <el-descriptions-item v-if="req.status === 'PENDING_APPROVAL'" :label="$t('Approvals')">
          {{ req.approvals_count }} / 2
        </el-descriptions-item>
        <el-descriptions-item v-if="req.status === 'PENDING_APPROVAL'" :label="$t('ApprovalWindowExpires')">
          {{ req.expires_at }}
        </el-descriptions-item>
        <el-descriptions-item v-if="req.status === 'APPROVED'" :label="$t('ExecutionWindowExpires')">
          {{ req.execution_expires_at }}
        </el-descriptions-item>
        <el-descriptions-item v-if="req.decision_reason" :label="$t('DecisionReason')">
          {{ req.decision_reason }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="req.approvals && req.approvals.length" class="approvals-box">
        <h4>{{ $t('Approvals') }}</h4>
        <div v-for="a in req.approvals" :key="a.id" class="approval-row">
          <span>{{ a.approver_name }}</span>
          <el-tag :type="a.decision === 'APPROVED' ? 'success' : 'danger'" size="small">{{ a.decision }}</el-tag>
          <span class="approval-date">{{ a.date_created }}</span>
        </div>
      </div>

      <div class="actions">
        <template v-if="req.status === 'PENDING_APPROVAL'">
          <el-button v-if="isRequester" @click="cancel">{{ $t('Cancel') }}</el-button>
          <template v-else>
            <el-button type="danger" @click="rejectDialog = true">{{ $t('Reject') }}</el-button>
            <el-button type="primary" @click="approveDialog = true">{{ $t('Approve') }}</el-button>
          </template>
        </template>
        <template v-if="req.status === 'APPROVED' && isRequester">
          <el-button @click="cancel">{{ $t('Cancel') }}</el-button>
          <el-button type="primary" @click="openExecute">{{ $t('ExportTOTP') }}</el-button>
        </template>
      </div>

      <!-- section 46/56-59 - revealed exactly once, never re-shown after
           reload (result lives only in this component's own state). -->
      <div v-if="result" class="result-box">
        <h4>{{ $t('TOTPExported') }}</h4>
        <div v-if="result.export_format === 'BASE32'" class="property-row">
          <span class="secret-value">{{ result.secret }}</span>
          <el-icon class="field-action" :title="$t('Copy')" @click="doCopy(result.secret)"><CopyDocument /></el-icon>
        </div>
        <template v-else-if="result.export_format === 'OTPAUTH_URI'">
          <div class="property-row">
            <span class="secret-value uri-value">{{ result.uri }}</span>
            <el-icon class="field-action" :title="$t('Copy')" @click="doCopy(result.uri)"><CopyDocument /></el-icon>
          </div>
        </template>
        <template v-else-if="result.export_format === 'QR'">
          <canvas ref="qrCanvas" class="qr-canvas" />
          <p class="qr-hint">{{ $t('QRTemporaryHint') }}</p>
        </template>
        <p class="result-hint">{{ $t('ResultNotPersistedHint') }}</p>
      </div>
    </IBox>

    <el-dialog v-model="approveDialog" :title="$t('Approve')" width="420px">
      <el-alert type="info" :closable="false" show-icon :title="$t('SeedExportApproveHelp')" class="legacy-alert" />
      <el-form label-position="top">
        <el-form-item :label="$t('Comment')">
          <el-input v-model="approveForm.comment" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="$t('MFACodeTOTP')" required>
          <el-input v-model="approveForm.totp_code" maxlength="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="approve">{{ $t('Approve') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectDialog" :title="$t('Reject')" width="420px">
      <el-form label-position="top">
        <el-form-item :label="$t('ReasonForDenial')" required>
          <el-input v-model="rejectForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('MFACodeTOTP')" required>
          <el-input v-model="rejectForm.totp_code" maxlength="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button type="danger" :loading="submitting" @click="reject">{{ $t('Reject') }}</el-button>
      </template>
    </el-dialog>

    <!-- section 19/55/701-705 - requester's OWN fresh step-up, separate
         from the approvers' MFA. -->
    <el-dialog v-model="executeDialog" :title="$t('ExportTOTP')" width="420px">
      <el-form label-position="top">
        <el-form-item v-if="req && req.export_format === 'ENCRYPTED_OFFLINE_PACKAGE'" :label="$t('PackagePassword')" required>
          <el-input v-model="executeForm.package_password" type="password" show-password />
        </el-form-item>
        <el-form-item :label="$t('MFACodeTOTP')" required>
          <el-input v-model="executeForm.totp_code" maxlength="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="executeDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="execute">{{ $t('ExportTOTP') }}</el-button>
      </template>
    </el-dialog>
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import { IBox } from '@/components'
import { copy } from '@/utils/common/index'

const FORMAT_LABELS = {
  BASE32: 'Base32', OTPAUTH_URI: 'otpauth URI', QR: 'QR Code', ENCRYPTED_OFFLINE_PACKAGE: 'Encrypted offline package'
}

export default {
  name: 'SeedExportDetail',
  components: { Page, IBox },
  data() {
    return {
      loading: true,
      req: null,
      result: null,
      submitting: false,
      approveDialog: false,
      approveForm: { comment: '', totp_code: '' },
      rejectDialog: false,
      rejectForm: { reason: '', totp_code: '' },
      executeDialog: false,
      executeForm: { totp_code: '', package_password: '' }
    }
  },
  computed: {
    formatLabel() {
      return this.req ? (FORMAT_LABELS[this.req.export_format] || this.req.export_format) : ''
    },
    isRequester() {
      return this.req && this.$store.getters.currentUser && this.req.requested_by === this.$store.getters.currentUser.id
    }
  },
  created() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        this.req = await this.$axios.get(`/api/v1/repository/seed-export-requests/${this.$route.params.id}/`)
      } finally {
        this.loading = false
      }
    },
    doCopy(value) {
      copy(value)
      this.$axios.post(`/api/v1/repository/seed-export-requests/${this.req.id}/copy/`)
      this.$message.success(this.$t('CopiedToClipboard'))
    },
    async approve() {
      this.submitting = true
      try {
        this.req = await this.$axios.post(`/api/v1/repository/seed-export-requests/${this.req.id}/approve/`, this.approveForm)
        this.approveDialog = false
        this.approveForm = { comment: '', totp_code: '' }
        this.$message.success(this.$t('SavedSuccessfully'))
      } finally {
        this.submitting = false
      }
    },
    async reject() {
      this.submitting = true
      try {
        this.req = await this.$axios.post(`/api/v1/repository/seed-export-requests/${this.req.id}/reject/`, this.rejectForm)
        this.rejectDialog = false
        this.$message.success(this.$t('SavedSuccessfully'))
      } finally {
        this.submitting = false
      }
    },
    async cancel() {
      this.req = await this.$axios.post(`/api/v1/repository/seed-export-requests/${this.req.id}/cancel/`)
      this.$message.success(this.$t('SavedSuccessfully'))
    },
    openExecute() {
      this.executeForm = { totp_code: '', package_password: '' }
      this.executeDialog = true
    },
    async execute() {
      this.submitting = true
      try {
        if (this.req.export_format === 'ENCRYPTED_OFFLINE_PACKAGE') {
          const blob = await this.$axios.post(
            `/api/v1/repository/seed-export-requests/${this.req.id}/execute/`, this.executeForm,
            { responseType: 'blob' }
          )
          const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]))
          const link = document.createElement('a')
          link.href = url
          link.download = `${this.req.entry_name}-totp-seed-export.hashexport`
          link.click()
          URL.revokeObjectURL(url)
        } else {
          this.result = await this.$axios.post(`/api/v1/repository/seed-export-requests/${this.req.id}/execute/`, this.executeForm)
          if (this.result.export_format === 'QR') {
            await this.$nextTick()
            const QRCode = (await import('qrcode')).default
            QRCode.toCanvas(this.$refs.qrCanvas, this.result.uri, { width: 240 })
          }
        }
        this.executeDialog = false
        await this.load()
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.warning {
  margin-bottom: 12px;
}
.legacy-alert {
  margin-bottom: 12px;
}
.approvals-box {
  margin-top: 16px;
}
.approvals-box h4 {
  margin: 0 0 8px;
}
.approval-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
}
.approval-date {
  color: var(--el-text-color-secondary);
  margin-left: auto;
}
.actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.result-box {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.property-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.secret-value {
  font-family: monospace;
  word-break: break-all;
}
.uri-value {
  font-size: 12px;
}
.qr-canvas {
  display: block;
}
.qr-hint, .result-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.field-action {
  cursor: pointer;
  color: var(--el-text-color-secondary);
}
.field-action:hover {
  color: var(--el-color-primary);
}
</style>
