<template>
  <TwoCol>
    <!-- Sprint_36-Account-Class-Lifecycle.md §76 - "Classification &
         Lifecycle" block on the account detail. -->
    <IBox :title="$t('ClassificationAndLifecycle')" class="rotation-status-card">
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('AccountPurpose') }}:</span>
        <el-tag size="small">{{ choiceLabel(object.account_purpose) }}</el-tag>
      </div>
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('UsageMode') }}:</span>
        <span>{{ choiceLabel(object.usage_mode) }}</span>
      </div>
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('ConcurrencyMode') }}:</span>
        <span>{{ choiceLabel(object.concurrency_mode) }}</span>
      </div>
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('SecurityTier') }}:</span>
        <span>{{ choiceLabel(object.security_tier) }}</span>
      </div>
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('PasswordManagementMode') }}:</span>
        <span>{{ choiceLabel(object.password_management_mode) }}</span>
      </div>
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('PasswordOwner') }}:</span>
        <span>{{ choiceLabel(object.password_owner) }}</span>
      </div>
    </IBox>

    <IBox class="rotation-status-card">
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('CredentialCheckStatus') }}:</span>
        <el-tag size="small" :type="checkStatusTagType">{{ checkStatusLabel }}</el-tag>
      </div>
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('GovernanceStatus') }}:</span>
        <el-tag size="small" :type="governanceTagType">{{ object.governance_status }}</el-tag>
      </div>
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('LastRotationTrigger') }}:</span>
        <span>{{ object.last_rotation_trigger || '-' }}</span>
      </div>
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('NextPeriodicRotation') }}:</span>
        <span>{{ object.next_periodic_rotation || $t('NotApplicable') }}</span>
      </div>
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('RotationOverdue') }}:</span>
        <el-tag size="small" :type="object.is_rotation_overdue ? 'danger' : 'success'">
          {{ object.is_rotation_overdue ? $t('Yes') : $t('No') }}
        </el-tag>
      </div>
      <div class="rotation-row">
        <span class="rotation-label">{{ $t('RotationPolicy') }}:</span>
        <el-select
          v-model="selectedPolicyId"
          size="small"
          clearable
          :placeholder="$t('NoRotationPolicy')"
          :loading="policyChanging"
          style="width: 240px"
          @change="handlePolicyChange"
        >
          <el-option v-for="p in policyOptions" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <router-link :to="{ name: 'RotationPolicyList' }" class="rotation-policy-link">
          {{ $t('ManagePolicies') }}
        </router-link>
      </div>

      <div class="rotation-actions">
        <el-button
          size="small"
          type="primary"
          :loading="rotating"
          :disabled="!isManaged"
          @click="handleRotateNow"
        >
          {{ $t('RotateNow') }}
        </el-button>
        <el-button
          size="small"
          :loading="reconciling"
          :disabled="!isManaged || checkStatusValue !== 'INVALID'"
          @click="handleReconcileNow"
        >
          {{ $t('ReconcileNow') }}
        </el-button>
      </div>
      <div v-if="!isManaged" class="rotation-hint">
        {{ $t('UnmanagedAccountNoRotationHint') }}
      </div>
    </IBox>

    <GenericListTable ref="jobList" :header-actions="headerActions" :table-config="tableConfig" />
  </TwoCol>
</template>

<script>
import { IBox } from '@/components'
import TwoCol from '@/layout/components/Page/TwoColPage.vue'
import GenericListTable from '@/layout/components/GenericListTable'
import { rotateAccountNow, reconcileAccountNow } from '@/api/accounts'

// S18A/S34 follow-up - "onde vejo/força a rotação" and "reconcile now",
// reusing the RotationJob history/emergency-execute/reconcile endpoints
// that already existed with no Lina consumer.
export default {
  name: 'AccountRotation',
  components: { TwoCol, IBox, GenericListTable },
  props: {
    object: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      rotating: false,
      reconciling: false,
      policyChanging: false,
      policyOptions: [],
      // rotation_policy comes back as {id, name} (a nested FK
      // representation, like every related-object field in this API),
      // not a bare id - v-model here needs the id alone to match option
      // values.
      selectedPolicyId: this.object.rotation_policy?.id || null,
      tableConfig: {
        url: `/api/v1/accounts/rotation-jobs/?account=${this.object.id}&order=-requested_at`,
        columns: ['trigger', 'status', 'requested_at', 'finished_at', 'result', 'error_code', 'adapter'],
        columnsMeta: {
          requested_at: { label: this.$t('DateRequested') },
          finished_at: { label: this.$t('DateFinished') }
        },
        tableAttrs: { border: false }
      },
      headerActions: {
        hasSearch: false,
        hasRefresh: true,
        hasLeftActions: false,
        hasRightActions: false,
        hasExport: false,
        hasImport: false,
        hasCreate: false,
        hasMoreActions: false
      }
    }
  },
  computed: {
    // credential_check_status is a DRF choice field, serialized as
    // {value, label} like every other choice field in this API (see
    // terminal Command.risk_level for the same pattern) - rendering the
    // object directly showed the raw JSON to the operator instead of the
    // translated label.
    checkStatusValue() {
      const status = this.object.credential_check_status
      return (status && typeof status === 'object') ? status.value : status
    },
    checkStatusLabel() {
      const status = this.object.credential_check_status
      return (status && typeof status === 'object') ? status.label : status
    },
    checkStatusTagType() {
      return { VALID: 'success', INVALID: 'danger', UNREACHABLE: 'warning', UNKNOWN: 'info' }[
        this.checkStatusValue
      ] || 'info'
    },
    governanceTagType() {
      return { HEALTHY: 'success', FAILED: 'danger', IN_USE: 'primary', ROTATION_PENDING: 'warning', DISABLED: 'info' }[
        this.object.governance_status
      ] || 'info'
    },
    // Sprint_36 §9/DoD02 - the rotation gate is password_management_mode
    // now, not service_account (see BaseAccount.periodic_rotation).
    isManaged() {
      const pmm = this.object.password_management_mode
      return (pmm && typeof pmm === 'object' ? pmm.value : pmm) === 'MANAGED'
    }
  },
  mounted() {
    this.$axios.get('/api/v1/accounts/rotation-policies/?is_active=true&limit=100').then((resp) => {
      this.policyOptions = resp.results || resp
    })
  },
  methods: {
    choiceLabel(field) {
      return field && typeof field === 'object' ? field.label : field
    },
    handlePolicyChange(policyId) {
      this.policyChanging = true
      this.$axios
        .patch(`/api/v1/accounts/accounts/${this.object.id}/`, { rotation_policy: policyId || null })
        .then(() => {
          this.$message.success(this.$t('UpdateSuccessMsg'))
        })
        .finally(() => {
          this.policyChanging = false
        })
    },
    handleRotateNow() {
      this.rotating = true
      rotateAccountNow(this.object.id)
        .then((resp) => {
          const created = resp?.jobs_created ?? 0
          if (created > 0) {
            this.$message.success(this.$t('RotationRequested'))
          } else {
            this.$message.warning(this.$t('RotationNotRequested'))
          }
          this.$refs.jobList?.reloadTable?.()
        })
        .finally(() => {
          this.rotating = false
        })
    },
    handleReconcileNow() {
      this.reconciling = true
      reconcileAccountNow(this.object.id)
        .then(() => {
          this.$message.success(this.$t('RotationRequested'))
          this.$refs.jobList?.reloadTable?.()
        })
        .catch(() => {
          this.$message.error(this.$t('RotationNotRequested'))
        })
        .finally(() => {
          this.reconciling = false
        })
    }
  }
}
</script>

<style scoped lang="scss">
.rotation-status-card {
  margin-bottom: 16px;
  padding: 8px 4px;
}
.rotation-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.rotation-label {
  min-width: 180px;
  color: var(--color-text-secondary, #909399);
  font-size: 13px;
}
.rotation-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
.rotation-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
.rotation-policy-link {
  margin-left: 8px;
  font-size: 12px;
}
</style>
