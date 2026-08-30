<template>
  <Page>
    <div v-if="$hasPerm('risk.view_kri_dashboard')" v-loading="loading">
      <el-row :gutter="16">
        <el-col v-for="kri in kris" :key="kri.kri_type" :lg="6" :md="8" :sm="12" :xs="24">
          <IBox class="kri-card">
            <div class="kri-name">{{ $t(kriLabel(kri.kri_type)) }}</div>

            <div v-if="kri.current_value === null" class="kri-unavailable">
              {{ $t('Data unavailable') }}
            </div>
            <template v-else>
              <div class="kri-value" :class="statusClass(kri.status)">{{ formatValue(kri) }}</div>
              <div class="kri-target">{{ $t('Target') }} {{ formatTarget(kri) }}</div>
              <div class="kri-previous">
                {{ $t('Previous Period') }}: {{ formatPrevious(kri) }}
                <span v-if="kri.trend_percentage_points !== null" :class="trendClass(kri)">
                  {{ formatTrend(kri) }}
                </span>
              </div>
              <div v-if="kri.denominator !== null" class="kri-fraction">
                {{ kri.numerator }} / {{ kri.denominator }}
              </div>
            </template>

            <el-tag size="small" :type="statusTagType(kri.status)" class="kri-status-tag">
              {{ $t(kri.status) }}
            </el-tag>

            <div class="kri-footer">
              <el-button size="small" text @click="openDetails(kri)">{{ $t('View Details') }}</el-button>
            </div>
          </IBox>
        </el-col>
      </el-row>
    </div>
    <Page403 v-else />

    <el-dialog v-model="detailsVisible" :title="detailsTitle" width="640px">
      <div class="details-formula">
        <div><b>{{ $t('Purpose') }}:</b> {{ $t(kriPurpose(detailsKri?.kri_type)) }}</div>
        <div><b>{{ $t('Period') }}:</b> {{ detailsKri?.period?.start }} - {{ detailsKri?.period?.end }}</div>
      </div>
      <el-table v-loading="loadingHistory" :data="history" size="small" max-height="360">
        <el-table-column prop="snapshot_date" :label="$t('Date')" width="140" />
        <el-table-column prop="numerator" :label="$t('Numerator')" width="120" />
        <el-table-column prop="denominator" :label="$t('Denominator')" width="120" />
        <el-table-column prop="value" :label="$t('Value')" />
      </el-table>
    </el-dialog>
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import Page403 from '@/views/403'
import { IBox } from '@/components'
import { getKriHistory, getKriSummary } from '@/api/risk'

// Mirrors risk/const.py KRIType / KRI_HIGHER_IS_BETTER - a tiny, stable
// display lookup, not business logic (the value/status/trend themselves
// always come from the API, never recomputed here).
const KRI_DISPLAY = {
  ROTATION_COMPLIANCE: { label: 'Rotation Compliance', purpose: 'Share of eligible managed credentials compliant with their rotation policy.', unit: 'percent', higherIsBetter: true },
  OVERDUE_CREDENTIAL_RATE: { label: 'Overdue Credential Rate', purpose: 'Share of eligible managed credentials past their rotation deadline.', unit: 'percent', higherIsBetter: false },
  ROTATION_FAILURE_RATE: { label: 'Rotation Failure Rate', purpose: 'Share of rotation attempts that failed in the period.', unit: 'percent', higherIsBetter: false },
  MFA_COVERAGE: { label: 'MFA Coverage', purpose: 'Share of eligible users enrolled in MFA.', unit: 'percent', higherIsBetter: true },
  DORMANT_ENABLED_USERS: { label: 'Dormant Enabled Users', purpose: 'Share of enabled users inactive beyond the configured threshold.', unit: 'percent', higherIsBetter: false },
  PRIVILEGED_ACCOUNT_COVERAGE: { label: 'Privileged Account Coverage', purpose: 'Managed privileged accounts over known privileged accounts. Shown only when a reliable denominator exists.', unit: 'percent', higherIsBetter: true },
  ORPHAN_PRIVILEGED_ACCOUNTS: { label: 'Orphan Privileged Accounts', purpose: 'Privileged accounts with no assigned owner.', unit: 'count', higherIsBetter: false },
  EXPIRED_ACCESS_GRANTS: { label: 'Expired Access Grants', purpose: 'Access grants past their expiration still effectively active.', unit: 'count', higherIsBetter: false },
  MFA_COVERAGE_OPERATORS: { label: 'MFA Coverage - Operators', purpose: 'Share of eligible Operators enrolled in MFA.', unit: 'percent', higherIsBetter: true },
  MFA_COVERAGE_ADMINS: { label: 'MFA Coverage - Administrators', purpose: 'Share of eligible Administrators enrolled in MFA.', unit: 'percent', higherIsBetter: true },
  PRIVILEGED_ROTATION_NONCOMPLIANCE: { label: 'Privileged Rotation Non-Compliance', purpose: 'Privileged accounts out of their defined rotation policy.', unit: 'percent', higherIsBetter: false }
}

export default {
  name: 'KRIDashboard',
  components: { Page, Page403, IBox },
  data() {
    return {
      loading: false,
      loadingHistory: false,
      kris: [],
      detailsVisible: false,
      detailsKri: null,
      history: []
    }
  },
  computed: {
    detailsTitle() {
      return this.detailsKri ? this.$t(this.kriLabel(this.detailsKri.kri_type)) : ''
    }
  },
  mounted() {
    if (this.$hasPerm('risk.view_kri_dashboard')) {
      this.load()
    }
  },
  methods: {
    kriLabel(kriType) {
      return KRI_DISPLAY[kriType]?.label || kriType
    },
    kriPurpose(kriType) {
      return kriType ? (KRI_DISPLAY[kriType]?.purpose || '') : ''
    },
    kriUnit(kriType) {
      return KRI_DISPLAY[kriType]?.unit || 'percent'
    },
    async load() {
      this.loading = true
      try {
        const resp = await getKriSummary()
        this.kris = resp.kris || []
      } finally {
        this.loading = false
      }
    },
    statusTagType(status) {
      return { HEALTHY: 'success', ATTENTION: 'warning', CRITICAL: 'danger', UNKNOWN: 'info' }[status] || 'info'
    },
    statusClass(status) {
      return `status-${(status || 'unknown').toLowerCase()}`
    },
    formatValue(kri) {
      return this.kriUnit(kri.kri_type) === 'percent' ? `${kri.current_value}%` : `${kri.current_value}`
    },
    formatTarget(kri) {
      const t = kri.target
      if (!t) return ''
      const unit = this.kriUnit(kri.kri_type) === 'percent' ? '%' : ''
      const higherIsBetter = KRI_DISPLAY[kri.kri_type]?.higherIsBetter
      const symbol = higherIsBetter === false ? '≤' : '≥'
      return `${symbol}${t.healthy}${unit}`
    },
    formatPrevious(kri) {
      if (kri.previous_period_value === null) return this.$t('No data')
      return this.kriUnit(kri.kri_type) === 'percent' ? `${kri.previous_period_value}%` : `${kri.previous_period_value}`
    },
    trendClass(kri) {
      const higherIsBetter = KRI_DISPLAY[kri.kri_type]?.higherIsBetter
      const trend = kri.trend_percentage_points
      if (trend === 0 || trend === null) return 'trend-flat'
      const improving = higherIsBetter ? trend > 0 : trend < 0
      return improving ? 'trend-up' : 'trend-down'
    },
    formatTrend(kri) {
      const trend = kri.trend_percentage_points
      const sign = trend > 0 ? '+' : ''
      const unit = this.kriUnit(kri.kri_type) === 'percent' ? ' p.p.' : ''
      return `${sign}${trend}${unit}`
    },
    async openDetails(kri) {
      this.detailsKri = kri
      this.detailsVisible = true
      this.loadingHistory = true
      this.history = []
      try {
        const resp = await getKriHistory({ kri_type: kri.kri_type })
        this.history = resp.results || resp
      } finally {
        this.loadingHistory = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.kri-card {
  margin-bottom: 16px;
  text-align: center;
  position: relative;
}
.kri-name {
  font-size: 13px;
  color: var(--color-text-secondary, #909399);
  margin-bottom: 6px;
}
.kri-value {
  font-size: 26px;
  font-weight: 600;
}
.kri-value.status-healthy { color: var(--el-color-success); }
.kri-value.status-attention { color: var(--el-color-warning); }
.kri-value.status-critical { color: var(--el-color-danger); }
.kri-target {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
.kri-previous {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
  margin-top: 4px;
}
.kri-fraction {
  font-size: 11px;
  color: var(--color-text-secondary, #909399);
}
.kri-unavailable {
  font-size: 13px;
  color: var(--color-text-secondary, #909399);
  padding: 12px 0;
}
.trend-up { color: var(--el-color-success); }
.trend-down { color: var(--el-color-danger); }
.trend-flat { color: var(--color-text-secondary, #909399); }
.kri-status-tag {
  margin-top: 8px;
}
.kri-footer {
  margin-top: 6px;
}
.details-formula {
  font-size: 13px;
  color: var(--color-text-secondary, #909399);
  margin-bottom: 12px;
  line-height: 1.8;
}
</style>
