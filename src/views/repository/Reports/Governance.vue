<template>
  <div>
    <BaseReport
      :title="reportTitle"
      :nav="nav"
      :name="name"
      :charts="charts"
      :tables="tables"
      :show-display-mode-toggle="true"
      v-model:display-mode="displayMode"
      :current-days="currentFilters.days"
      v-bind="$attrs"
    >
      <template #toolbar>
        <ReportToolbar
          :filters="currentFilters"
          class="chart-container full-width report-toolbar-wrap"
          @filter-change="handleToolbarFilterChange"
        />
      </template>
      <template #default>
        <div v-if="showChart" class="charts-grid">
          <div class="chart-container full-width" data-report-type="chart" data-report-name="Overview">
            <div class="chart-container-title">
              <div class="chart-container-title-text">{{ $t('Overview') }}</div>
              <SummaryCountCard :items="totalData" />
            </div>
          </div>
          <div class="chart-container" data-report-type="chart" data-report-name="ByCategory">
            <div class="chart-container-title">
              <div class="chart-container-title-text">{{ $t('Technology') }}</div>
              <div class="chart">
                <Echart :options="categoryOptions" :autoresize="true" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #table>
        <div v-if="showTable" class="full-width">
          <div class="report-table-wrap chart-container full-width" data-report-type="table" data-report-name="Overview">
            <div class="chart-container-title">
              <div class="chart-container-title-text">{{ $t('Overview') }}</div>
            </div>
            <div class="report-card-body">
              <el-table :data="tableRows" border>
                <el-table-column :label="$t('Metric')" prop="metric" min-width="140" />
                <el-table-column :label="$t('Value')" prop="value" min-width="140" />
              </el-table>
            </div>
          </div>
        </div>
      </template>
    </BaseReport>
  </div>
</template>

<script>
import BaseReport from '../../reports/base/BaseReport.vue'
import SummaryCountCard from '@/components/Dashboard/SummaryCountCard.vue'
import Echart from '@/components/Dashboard/Echart.vue'
import reportPageMixin from '../../reports/base/reportPageMixin'
import ReportToolbar from '../../reports/base/ReportToolbar.vue'

// 2026-09-04 - Reports Center integration for the Credential Repository
// module (report type "RepositoryGovernanceReport" - see
// apps/reports/mixins.py build_repository_governance_report). A
// point-in-time posture snapshot, not a time-series, so this only has
// one chart-worth of real content (category breakdown) plus the summary
// cards - never padded with fabricated charts to look busier.
export default {
  components: { BaseReport, SummaryCountCard, Echart, ReportToolbar },
  mixins: [reportPageMixin],
  props: {
    nav: { type: Boolean, default: true }
  },
  data() {
    return {
      title: this.$t('RepositoryGovernanceReport'),
      name: 'RepositoryGovernanceReport',
      charts: [
        { name: 'Overview', title: this.$t('Overview') },
        { name: 'ByCategory', title: this.$t('Technology') }
      ],
      tables: [{ name: 'Overview', title: this.$t('Overview') }],
      days: localStorage.getItem('RepositoryGovernanceReport') || '30',
      stats: {
        total: 0, tier0: 0, without_owner: 0, weak_secrets: 0, reused_secrets: 0,
        stale_secrets: 0, certs_expiring_60d: 0, api_keys_no_expiration: 0, pending_approvals: 0
      },
      byCategory: []
    }
  },
  computed: {
    totalData() {
      const items = [
        [this.$t('Total'), this.stats.total],
        ['Tier 0', this.stats.tier0],
        [this.$t('WithoutOwner'), this.stats.without_owner],
        [this.$t('WeakSecretsShort'), this.stats.weak_secrets],
        [this.$t('ReusedSecretsShort'), this.stats.reused_secrets],
        [this.$t('StaleSecretsShort'), this.stats.stale_secrets],
        [this.$t('CertsExpiring60dShort'), this.stats.certs_expiring_60d],
        [this.$t('APIKeysNoExpirationShort'), this.stats.api_keys_no_expiration],
        [this.$t('PendingApprovals'), this.stats.pending_approvals]
      ]
      return items.map(([title, count]) => ({ title, body: { count } }))
    },
    tableRows() {
      return Object.entries(this.stats).map(([metric, value]) => ({ metric, value }))
    },
    categoryOptions() {
      return {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [
          {
            type: 'pie',
            minAngle: 5,
            radius: ['40%', '70%'],
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 15, fontWeight: 'bold' } },
            data: this.byCategory
          }
        ]
      }
    }
  },
  async mounted() {
    await this.getData()
  },
  methods: {
    async getData() {
      const baseUrl = '/api/v1/reports/reports/repository-governance/'
      const data = await this.fetchReportData(baseUrl)
      this.stats = { ...this.stats, ...(data.stats || {}) }
      this.byCategory = data.by_category || []
      await this.loadTableData(baseUrl)
    }
  }
}
</script>

<style lang="scss" scoped></style>
