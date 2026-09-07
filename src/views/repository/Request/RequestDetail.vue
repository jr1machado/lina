<template>
  <Page v-loading="loading">
    <IBox v-if="req" :title="$t('CredentialAccessRequest')">
      <el-descriptions :column="1" border>
        <el-descriptions-item :label="$t('Credential')">{{ req.entry_name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('RequestType')">
          {{ req.action_type === 'DELETE' ? $t('RequestDeletion') : $t('AccessRequest') }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('Tier')">{{ req.tier }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Requester')">{{ req.requester_name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Collection')">{{ req.collection_name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Reason')">{{ req.reason }}</el-descriptions-item>
        <el-descriptions-item v-if="req.reference" :label="$t('Reference')">{{ req.reference }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Requested')">{{ req.date_created }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Expires')">{{ req.expires_at }}</el-descriptions-item>
        <el-descriptions-item :label="$t('Status')">{{ req.status }}</el-descriptions-item>
        <el-descriptions-item v-if="req.decision_reason" :label="$t('DecisionReason')">
          {{ req.decision_reason }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- S38 section 46/63 - simple workflow timeline, no BPMN -->
      <el-steps :active="timelineStep" align-center class="timeline">
        <el-step :title="$t('Requested')" :description="req.requester_name" />
        <el-step :title="$t('AwaitingApproval')" />
        <el-step :title="stepTitle" :description="req.decided_by_name" />
      </el-steps>

      <div v-if="req.status === 'PENDING_APPROVAL'" class="actions">
        <el-button type="danger" @click="denyDialog = true">{{ $t('Deny') }}</el-button>
        <el-button type="primary" @click="approveDialog = true">{{ $t('Approve') }}</el-button>
      </div>
    </IBox>

    <!-- S38 section 41/57 - approving/denying is itself a protected action -->
    <el-dialog v-model="approveDialog" :title="$t('Approve')" width="380px">
      <el-form label-position="top">
        <el-form-item :label="$t('MFACodeTOTP')" required>
          <el-input v-model="approveTotp" maxlength="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" :loading="approving" @click="approve">{{ $t('Approve') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="denyDialog" :title="$t('DenyRequest')" width="420px">
      <el-form label-position="top">
        <el-form-item :label="$t('ReasonForDenial')" required>
          <el-input v-model="denyForm.reason" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="$t('MFACodeTOTP')" required>
          <el-input v-model="denyForm.totp_code" maxlength="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="denyDialog = false">{{ $t('Cancel') }}</el-button>
        <el-button type="danger" :loading="denying" @click="deny">{{ $t('Deny') }}</el-button>
      </template>
    </el-dialog>
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import { IBox } from '@/components'

export default {
  name: 'RequestDetail',
  components: { Page, IBox },
  data() {
    return {
      loading: true, req: null, approving: false, denying: false,
      approveDialog: false, approveTotp: '',
      denyDialog: false, denyForm: { reason: '', totp_code: '' }
    }
  },
  computed: {
    timelineStep() {
      if (this.req.status === 'PENDING_APPROVAL') return 1
      return 2
    },
    stepTitle() {
      return { APPROVED: this.$t('Approved'), DENIED: this.$t('Denied'), EXPIRED: this.$t('Expired'), CONSUMED: this.$t('Consumed') }[this.req.status] || this.$t('Pending')
    }
  },
  created() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const data = await this.$axios.get(`/api/v1/repository/requests/${this.$route.params.id}/`)
        this.req = data
      } finally {
        this.loading = false
      }
    },
    async approve() {
      this.approving = true
      try {
        // S37 section 28 - self-approval is rejected server-side regardless
        // of what this button lets the requester click.
        const data = await this.$axios.post(`/api/v1/repository/requests/${this.req.id}/approve/`, {
          totp_code: this.approveTotp
        })
        this.req = data
        this.approveDialog = false
        this.$message.success(this.$t('RequestApproved'))
      } finally {
        this.approving = false
      }
    },
    async deny() {
      this.denying = true
      try {
        const data = await this.$axios.post(`/api/v1/repository/requests/${this.req.id}/deny/`, this.denyForm)
        this.req = data
        this.denyDialog = false
        this.$message.success(this.$t('RequestDenied'))
      } finally {
        this.denying = false
      }
    }
  }
}
</script>

<style scoped>
.timeline {
  margin: 20px 0;
}
.actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
