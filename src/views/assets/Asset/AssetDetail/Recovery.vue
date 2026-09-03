<template>
  <TwoCol>
    <IBox v-loading="loading" class="recovery-status-card">
      <template v-if="recoveryAccount">
        <div class="recovery-row">
          <span class="recovery-label">{{ $t('RecoveryAccountName') }}:</span>
          <span>{{ recoveryAccount.username }}</span>
        </div>
        <div class="recovery-row">
          <span class="recovery-label">{{ $t('RecoveryHealth') }}:</span>
          <el-tag size="small" :type="healthTagType">{{ healthLabel }}</el-tag>
        </div>
        <div class="recovery-row">
          <span class="recovery-label">{{ $t('RecoveryAutoReconcile') }}:</span>
          <el-tag size="small" :type="recoveryAccount.auto_reconcile ? 'success' : 'info'">
            {{ recoveryAccount.auto_reconcile ? $t('Yes') : $t('No') }}
          </el-tag>
        </div>
        <div class="recovery-actions">
          <el-button size="small" :loading="testing" @click="handleTest">
            {{ $t('TestRecovery') }}
          </el-button>
        </div>
        <el-alert
          v-if="testResult"
          :closable="false"
          :type="testResult.ready ? 'success' : 'error'"
          :title="testResultTitle"
          class="recovery-test-result"
        >
          <div v-for="(passed, check) in testResult.checks" :key="check" class="recovery-check-row">
            <el-icon v-if="passed" class="check-ok"><CircleCheck /></el-icon>
            <el-icon v-else class="check-fail"><CircleClose /></el-icon>
            {{ check }}
          </div>
        </el-alert>
      </template>
      <template v-else-if="!loading">
        <el-alert :closable="false" type="warning" :title="$t('RecoveryAccountMissing')" />
        <div class="recovery-actions">
          <el-button size="small" type="primary" :loading="provisioning" @click="handleProvision">
            {{ $t('ConfigureRecoveryProtection') }}
          </el-button>
        </div>
        <div v-if="provisionResult" class="recovery-hint">
          {{ provisionResult }}
        </div>
      </template>
    </IBox>
  </TwoCol>
</template>

<script>
import { IBox } from '@/components'
import TwoCol from '@/layout/components/Page/TwoColPage.vue'
import {
  provisionRecoveryAccounts,
  testLinuxRotationReadiness,
  testWindowsRotationReadiness
} from '@/api/accounts'

const LINUX_PLATFORM_TYPES = ['linux', 'unix']

// S34 follow-up - "onde vejo se o device possui a conta de reconciliação
// criada e embarcada": no per-device visibility existed before this,
// only the standalone Bulk Provision tool. Reuses the same provision
// endpoint scoped to just this one asset.
export default {
  name: 'AssetRecovery',
  components: { TwoCol, IBox },
  props: {
    object: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      provisioning: false,
      testing: false,
      provisionResult: '',
      testResult: null,
      recoveryAccount: null,
      testTargetAccount: null
    }
  },
  computed: {
    // credential_check_status is a DRF choice field, serialized as
    // {value, label} - see AccountDetail/Rotation.vue's checkStatus*
    // computeds for the same fix.
    healthValue() {
      const status = this.recoveryAccount?.credential_check_status
      return (status && typeof status === 'object') ? status.value : status
    },
    healthLabel() {
      const status = this.recoveryAccount?.credential_check_status
      return (status && typeof status === 'object') ? status.label : status
    },
    healthTagType() {
      return { VALID: 'success', INVALID: 'danger', UNREACHABLE: 'warning', UNKNOWN: 'info' }[
        this.healthValue
      ] || 'info'
    },
    isLinux() {
      const platform = this.object.platform
      const type = (platform && typeof platform === 'object') ? platform.type : platform
      const typeValue = (type && typeof type === 'object') ? type.value : type
      return LINUX_PLATFORM_TYPES.includes(typeValue)
    },
    testResultTitle() {
      if (!this.testResult) {
        return ''
      }
      return this.testResult.ready
        ? this.$t('RecoveryTestPassed')
        : `${this.$t('RecoveryTestFailed')}: ${this.testResult.error_code || ''}`
    }
  },
  created() {
    this.loadRecoveryAccount()
  },
  methods: {
    loadRecoveryAccount() {
      this.loading = true
      this.$axios
        .get(`/api/v1/accounts/accounts/?asset_id=${this.object.id}`)
        .then((resp) => {
          const accounts = resp.results || resp
          this.recoveryAccount = accounts.find((a) => a.reconciliation_account) || null
          // The readiness check (rotation-readiness/) tests "can the
          // recovery account reset THIS account's password" for a managed
          // (non-service) account - it rejects service accounts outright
          // (LinuxRotationAdapter.check_linux_rotation_eligibility), so it
          // can't be called with the recovery account's own id. Test
          // against the first eligible managed account on this asset
          // instead - a pass there proves the same recovery path this
          // device's other managed accounts rely on.
          this.testTargetAccount = accounts.find((a) => !a.service_account && a.is_active) || null
        })
        .finally(() => {
          this.loading = false
        })
    },
    handleProvision() {
      this.provisioning = true
      this.provisionResult = ''
      provisionRecoveryAccounts({ asset_ids: [this.object.id] })
        .then((results) => {
          const row = (results || [])[0]
          if (!row) {
            this.provisionResult = this.$t('RotationNotRequested')
            return
          }
          if (row.status === 'HEALTHY') {
            this.$message.success(this.$t('OperationSuccessful'))
            this.loadRecoveryAccount()
          } else if (row.status === 'PENDING_FINGERPRINT') {
            this.provisionResult = this.$t('RecoveryPendingFingerprintHint')
            this.loadRecoveryAccount()
          } else {
            this.provisionResult = row.error || row.status
          }
        })
        .finally(() => {
          this.provisioning = false
        })
    },
    handleTest() {
      if (!this.recoveryAccount) {
        return
      }
      if (!this.testTargetAccount) {
        this.$message.warning(this.$t('RecoveryTestNoManagedAccount'))
        return
      }
      this.testing = true
      this.testResult = null
      const test = this.isLinux ? testLinuxRotationReadiness : testWindowsRotationReadiness
      test(this.testTargetAccount.id)
        .then((result) => {
          this.testResult = result
        })
        .finally(() => {
          this.testing = false
        })
    }
  }
}
</script>

<style scoped lang="scss">
.recovery-status-card {
  padding: 8px 4px;
}
.recovery-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.recovery-label {
  min-width: 160px;
  color: var(--color-text-secondary, #909399);
  font-size: 13px;
}
.recovery-actions {
  margin-top: 12px;
}
.recovery-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
.recovery-test-result {
  margin-top: 12px;
  max-width: 420px;
}
.recovery-check-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.check-ok {
  color: var(--el-color-success, #67c23a);
}
.check-fail {
  color: var(--el-color-danger, #f56c6c);
}
</style>
