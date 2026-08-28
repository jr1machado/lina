<template>
  <Page>
    <div v-if="$hasPerm('risk.view_risk_dashboard')" v-loading="loadingSummary">
      <el-row :gutter="16" class="kpi-row">
        <el-col v-for="card in kpiCards" :key="card.key" :lg="4" :sm="8" :xs="12">
          <IBox class="kpi-card" :class="{ active: activeFilter && activeFilter.key === card.key }" @click="drillFinding(card)">
            <div class="kpi-value">{{ card.value }}</div>
            <div class="kpi-label">{{ $t(card.label) }}</div>
          </IBox>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="section-row">
        <el-col :lg="12" :sm="24">
          <IBox :title="$t('Credential Aging')">
            <div v-for="bucket in agingBars" :key="bucket.key" class="aging-bar-row" @click="drillAging(bucket)">
              <span class="aging-bar-label">{{ $t(bucket.label) }}</span>
              <div class="aging-bar-track">
                <div class="aging-bar-fill" :style="{ width: bucket.pct + '%' }" />
              </div>
              <span class="aging-bar-pct">{{ bucket.pct }}% ({{ bucket.count }})</span>
            </div>
          </IBox>
        </el-col>
        <el-col :lg="12" :sm="24">
          <IBox :title="$t('Rotation Compliance')">
            <div class="compliance-chips">
              <el-tag
                v-for="status in complianceChips"
                :key="status.key"
                class="compliance-chip"
                :type="status.tagType"
                effect="plain"
                @click="drillCompliance(status)"
              >
                {{ $t(status.label) }}: {{ status.count }}
              </el-tag>
            </div>
          </IBox>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="section-row">
        <el-col :span="24">
          <IBox :title="$t('Identity Hygiene')">
            <el-row :gutter="16">
              <el-col v-for="stat in hygieneStats" :key="stat.key" :lg="4" :sm="8" :xs="12" class="hygiene-stat">
                <div class="hygiene-value">{{ stat.value }}</div>
                <div class="hygiene-label">{{ $t(stat.label) }}</div>
              </el-col>
            </el-row>
            <div class="hygiene-note">
              {{ $t('Inactive user threshold') }}: {{ summary.identity_hygiene.threshold_days }} {{ $t('days') }}
            </div>
          </IBox>
        </el-col>
      </el-row>

      <el-row v-if="activeFilter" class="section-row">
        <el-col :span="24">
          <IBox :title="drilldownTitle">
            <div class="drilldown-header">
              <el-button size="small" @click="clearFilter">{{ $t('Clear') }}</el-button>
            </div>
            <el-table v-loading="loadingTable" :data="tableRows" size="small" max-height="480">
              <template v-if="activeFilter.mode === 'findings'">
                <el-table-column prop="entity_id" :label="$t('Entity')" width="280" />
                <el-table-column prop="severity" :label="$t('Severity')" width="120" />
                <el-table-column prop="status" :label="$t('Status')" width="120" />
                <el-table-column prop="last_seen_at" :label="$t('Last seen')" />
              </template>
              <template v-else>
                <el-table-column prop="account_name" :label="$t('Credential')" />
                <el-table-column prop="device" :label="$t('Device')" />
                <el-table-column prop="device_group" :label="$t('Device group')" />
                <el-table-column prop="rotation_source" :label="$t('Rotation source')" width="130" />
                <el-table-column prop="age_days" :label="$t('Age (days)')" width="110" />
                <el-table-column prop="compliance_status" :label="$t('Compliance')" width="150" />
                <el-table-column prop="owner" :label="$t('Owner')" width="140" />
              </template>
            </el-table>
          </IBox>
        </el-col>
      </el-row>
    </div>
    <Page403 v-else />
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import Page403 from '@/views/403'
import { IBox } from '@/components'
import { getRiskSummary, getRiskFindings, getRiskAccounts } from '@/api/risk'

const AGING_BUCKETS = [
  { key: 'DAYS_0_30', label: '0-30 days' },
  { key: 'DAYS_31_60', label: '31-60 days' },
  { key: 'DAYS_61_90', label: '61-90 days' },
  { key: 'DAYS_90_PLUS', label: '>90 days' },
  { key: 'NEVER_ROTATED', label: 'Never Rotated' }
]

const COMPLIANCE_STATUSES = [
  { key: 'COMPLIANT', label: 'Compliant', tagType: 'success' },
  { key: 'DUE_SOON', label: 'Due Soon', tagType: 'warning' },
  { key: 'OVERDUE', label: 'Overdue', tagType: 'danger' },
  { key: 'ROTATION_FAILED', label: 'Rotation Failed', tagType: 'danger' },
  { key: 'VERIFICATION_FAILED', label: 'Verification Failed', tagType: 'danger' },
  { key: 'NEVER_ROTATED', label: 'Never Rotated', tagType: 'warning' },
  { key: 'NO_POLICY', label: 'No Policy', tagType: 'info' },
  { key: 'ROTATION_DISABLED', label: 'Rotation Disabled', tagType: 'info' }
]

export default {
  name: 'IdentityRiskDashboard',
  components: { Page, Page403, IBox },
  data() {
    return {
      loadingSummary: false,
      loadingTable: false,
      summary: {
        managed_credentials: 0,
        rotation_overdue: 0,
        credentials_over_90_days: 0,
        rotation_failures: 0,
        inactive_users_over_60_days: 0,
        mfa_missing: 0,
        credential_aging: {},
        rotation_compliance: {},
        identity_hygiene: {
          active_users: 0,
          inactive_over_30_days: 0,
          inactive_over_60_days: 0,
          inactive_over_90_days: 0,
          never_logged_in: 0,
          mfa_not_enrolled: 0,
          disabled_users: 0,
          threshold_days: 60
        }
      },
      activeFilter: null,
      tableRows: []
    }
  },
  computed: {
    drilldownTitle() {
      if (!this.activeFilter) return ''
      return `${this.$t('Drill-down')}: ${this.$t(this.activeFilter.label)} (${this.tableRows.length})`
    },
    kpiCards() {
      const s = this.summary
      return [
        { key: 'managed_credentials', label: 'Managed Credentials', value: s.managed_credentials, mode: 'accounts', params: {} },
        { key: 'rotation_overdue', label: 'Rotation Overdue', value: s.rotation_overdue, mode: 'findings', params: { finding_type: 'CREDENTIAL_ROTATION_OVERDUE' } },
        { key: 'credentials_over_90_days', label: '>90 Days Without Rotation', value: s.credentials_over_90_days, mode: 'accounts', params: { age_bucket: 'DAYS_90_PLUS' } },
        { key: 'rotation_failures', label: 'Rotation Failures', value: s.rotation_failures, mode: 'findings', params: { finding_type: 'CREDENTIAL_ROTATION_FAILED' } },
        { key: 'inactive_users_over_60_days', label: 'Inactive Users >60 Days', value: s.inactive_users_over_60_days, mode: 'findings', params: { finding_type: 'USER_INACTIVE' } },
        { key: 'mfa_missing', label: 'MFA Missing', value: s.mfa_missing, mode: 'findings', params: { finding_type: 'MFA_NOT_ENROLLED' } }
      ]
    },
    agingBars() {
      const aging = this.summary.credential_aging || {}
      const total = Object.values(aging).reduce((a, b) => a + b, 0) || 1
      return AGING_BUCKETS.map((b) => ({
        ...b,
        count: aging[b.key] || 0,
        pct: Math.round(((aging[b.key] || 0) / total) * 100)
      }))
    },
    complianceChips() {
      const compliance = this.summary.rotation_compliance || {}
      return COMPLIANCE_STATUSES.map((c) => ({ ...c, count: compliance[c.key] || 0 }))
    },
    hygieneStats() {
      const h = this.summary.identity_hygiene
      return [
        { key: 'active', label: 'Active Users', value: h.active_users },
        { key: 'inactive_30', label: 'Inactive >30 Days', value: h.inactive_over_30_days },
        { key: 'inactive_60', label: 'Inactive >60 Days', value: h.inactive_over_60_days },
        { key: 'inactive_90', label: 'Inactive >90 Days', value: h.inactive_over_90_days },
        { key: 'never_logged_in', label: 'Never Logged In', value: h.never_logged_in },
        { key: 'mfa_missing', label: 'MFA Not Enrolled', value: h.mfa_not_enrolled },
        { key: 'disabled', label: 'Disabled Users', value: h.disabled_users }
      ]
    }
  },
  mounted() {
    if (this.$hasPerm('risk.view_risk_dashboard')) {
      this.loadSummary()
    }
  },
  methods: {
    async loadSummary() {
      this.loadingSummary = true
      try {
        this.summary = await getRiskSummary()
      } finally {
        this.loadingSummary = false
      }
    },
    async drillFinding(card) {
      this.activeFilter = { key: card.key, label: card.label, mode: card.mode, params: card.params }
      await this.runDrilldown()
    },
    async drillAging(bucket) {
      this.activeFilter = { key: 'aging-' + bucket.key, label: bucket.label, mode: 'accounts', params: { age_bucket: bucket.key } }
      await this.runDrilldown()
    },
    async drillCompliance(status) {
      this.activeFilter = { key: 'compliance-' + status.key, label: status.label, mode: 'accounts', params: { compliance_status: status.key } }
      await this.runDrilldown()
    },
    async runDrilldown() {
      this.loadingTable = true
      this.tableRows = []
      try {
        if (this.activeFilter.mode === 'findings') {
          const resp = await getRiskFindings(this.activeFilter.params)
          this.tableRows = resp.results || resp
        } else {
          const resp = await getRiskAccounts(this.activeFilter.params)
          this.tableRows = resp.results || resp
        }
      } finally {
        this.loadingTable = false
      }
    },
    clearFilter() {
      this.activeFilter = null
      this.tableRows = []
    }
  }
}
</script>

<style lang="scss" scoped>
.kpi-row {
  margin-bottom: 16px;
}
.kpi-card {
  cursor: pointer;
  text-align: center;
  margin-bottom: 16px;
  &.active {
    border-color: var(--color-primary);
  }
}
.kpi-value {
  font-size: 28px;
  font-weight: 600;
}
.kpi-label {
  color: var(--color-text-secondary, #909399);
  font-size: 13px;
}
.section-row {
  margin-bottom: 16px;
}
.aging-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
}
.aging-bar-label {
  width: 110px;
  font-size: 13px;
}
.aging-bar-track {
  flex: 1;
  height: 10px;
  background: var(--el-fill-color-light, #f0f2f5);
  border-radius: 5px;
  overflow: hidden;
}
.aging-bar-fill {
  height: 100%;
  background: var(--color-primary);
}
.aging-bar-pct {
  width: 110px;
  font-size: 13px;
  text-align: right;
}
.compliance-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.compliance-chip {
  cursor: pointer;
}
.hygiene-stat {
  text-align: center;
  margin-bottom: 12px;
}
.hygiene-value {
  font-size: 22px;
  font-weight: 600;
}
.hygiene-label {
  color: var(--color-text-secondary, #909399);
  font-size: 12px;
}
.hygiene-note {
  color: var(--color-text-secondary, #909399);
  font-size: 12px;
  margin-top: 8px;
}
.drilldown-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
</style>
