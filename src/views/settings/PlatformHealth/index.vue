<template>
  <Page>
    <div v-if="$hasPerm('ops.view_platform_health')">
      <div class="ph-toolbar">
        <span class="ph-updated">
          {{ $t('LastUpdated') }}: {{ updatedLabel }}
          <el-tag v-if="isStale" type="warning" size="small">{{ $t('DataStale') }}</el-tag>
        </span>
        <el-button size="small" :loading="loading" @click="fetchAll">
          {{ $t('Refresh') }}
        </el-button>
      </div>

      <el-row :gutter="16" class="ph-row">
        <el-col :span="6">
          <IBox :title="'PlatformStatus'">
            <el-tag :type="statusTagType(summary.status)" size="large">
              {{ summary.status || 'unknown' }}
            </el-tag>
          </IBox>
        </el-col>
        <el-col :span="6">
          <IBox title="CriticalAlerts">
            <div class="ph-metric">{{ summary.severity_counts?.critical ?? '-' }}</div>
          </IBox>
        </el-col>
        <el-col :span="6">
          <IBox title="Warnings">
            <div class="ph-metric">{{ summary.severity_counts?.warning ?? '-' }}</div>
          </IBox>
        </el-col>
        <el-col :span="6">
          <IBox title="LastBackup">
            <div class="ph-metric">{{ formatAge(summary.backup?.age_seconds) }}</div>
          </IBox>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="ph-row">
        <el-col :span="6">
          <IBox title="Host">
            <el-tag :type="statusTagType(host.status)" size="small">{{
              host.status || 'unknown'
            }}</el-tag>
            <el-descriptions :column="1" size="small" class="ph-desc">
              <el-descriptions-item label="CPU">{{
                formatPercent(host.cpu_percent)
              }}</el-descriptions-item>
              <el-descriptions-item label="Memory">{{
                formatPercent(host.memory_percent)
              }}</el-descriptions-item>
              <el-descriptions-item label="Disk">{{
                formatPercent(host.disk_percent)
              }}</el-descriptions-item>
              <el-descriptions-item label="Uptime">{{
                formatDuration(host.uptime_seconds)
              }}</el-descriptions-item>
            </el-descriptions>
          </IBox>
        </el-col>
        <el-col :span="6">
          <IBox title="PostgreSQL">
            <el-tag :type="statusTagType(postgres.status)" size="small">{{
              postgres.status || 'unknown'
            }}</el-tag>
            <el-descriptions :column="1" size="small" class="ph-desc">
              <el-descriptions-item label="Connections">
                {{ postgres.connections ?? '-' }} / {{ postgres.max_connections ?? '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="Utilization">
                {{ formatPercent(postgres.connection_utilization_percent) }}
              </el-descriptions-item>
              <el-descriptions-item label="BlockedSessions">
                {{ postgres.blocked_sessions ?? '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="DatabaseSize">
                {{ formatBytes(postgres.database_size_bytes) }}
              </el-descriptions-item>
            </el-descriptions>
          </IBox>
        </el-col>
        <el-col :span="6">
          <IBox title="Containers">
            <el-tag :type="statusTagType(containers.status)" size="small">{{
              containers.status || 'unknown'
            }}</el-tag>
            <el-descriptions :column="1" size="small" class="ph-desc">
              <el-descriptions-item label="Running">
                {{ runningContainersCount }} / {{ containers.containers?.length ?? 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="UnapprovedCriticalFindings">
                {{ unapprovedCriticalFindingsCount }}
              </el-descriptions-item>
            </el-descriptions>
          </IBox>
        </el-col>
        <el-col :span="6">
          <IBox title="Workers">
            <el-tag :type="statusTagType(workers.status)" size="small">{{
              workers.status || 'unknown'
            }}</el-tag>
            <el-descriptions :column="1" size="small" class="ph-desc">
              <el-descriptions-item v-for="w in workers.workers" :key="w.worker" :label="w.worker">
                <el-tag :type="w.up ? 'success' : 'danger'" size="small">
                  {{ w.up ? $t('Up') : $t('Down') }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item
                v-for="q in workers.queues"
                :key="q.pool"
                :label="`${q.pool} queue`"
              >
                {{ q.depth }}
              </el-descriptions-item>
            </el-descriptions>
          </IBox>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="ph-row">
        <el-col :span="6">
          <IBox title="UsersOnline">
            <div class="ph-metric">{{ users.online_count ?? '-' }}</div>
          </IBox>
        </el-col>
        <el-col :span="18">
          <IBox title="UsersOnlineByRole">
            <el-descriptions :column="4" size="small">
              <el-descriptions-item v-for="r in users.by_role" :key="r.role" :label="r.role">
                {{ r.count }}
              </el-descriptions-item>
            </el-descriptions>
            <div v-if="!users.by_role || users.by_role.length === 0" class="ph-empty">
              {{ $t('NoActiveAlerts') }}
            </div>
          </IBox>
        </el-col>
      </el-row>

      <IBox title="Containers" class="ph-row">
        <el-table :data="containers.containers || []" size="small">
          <el-table-column prop="service" label="Service" width="160" />
          <el-table-column prop="description" label="Description" />
          <el-table-column label="Status" width="110">
            <template #default="{ row }">
              <el-tag :type="row.running ? 'success' : 'danger'" size="small">
                {{ row.running ? $t('Up') : $t('Down') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="RAM" width="100">
            <template #default="{ row }">{{ formatBytes(row.ram_bytes) }}</template>
          </el-table-column>
          <el-table-column prop="restart_count" label="Restarts" width="100" />
          <el-table-column label="OOM" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.oom_killed" type="danger" size="small">OOM</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </IBox>

      <IBox title="ActiveAlerts" class="ph-row">
        <el-table :data="alerts.alerts || []" size="small" :empty-text="$t('NoActiveAlerts')">
          <el-table-column prop="severity" label="Severity" width="110">
            <template #default="{ row }">
              <el-tag :type="statusTagType(alertSeverityToStatus(row.severity))" size="small">
                {{ row.severity }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="alertname" label="Alert" width="260" />
          <el-table-column prop="component" label="Component" width="140" />
          <el-table-column prop="summary" label="Summary" />
          <el-table-column label="Since" width="180">
            <template #default="{ row }">{{ formatSince(row.since) }}</template>
          </el-table-column>
        </el-table>
      </IBox>
    </div>
    <Page403 v-else />
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import { IBox } from '@/components'
import Page403 from '@/views/403'

const REFRESH_INTERVAL_MS = 30 * 1000
const STALE_AFTER_MS = 90 * 1000

export default {
  name: 'PlatformHealth',
  components: { Page, Page403, IBox },
  data() {
    return {
      loading: false,
      lastUpdated: null,
      now: Date.now(),
      summary: {},
      host: {},
      postgres: {},
      containers: {},
      workers: {},
      backup: {},
      alerts: {},
      users: {},
      timer: null,
      clock: null
    }
  },
  computed: {
    updatedLabel() {
      if (!this.lastUpdated) return '-'
      const secs = Math.max(0, Math.floor((this.now - this.lastUpdated) / 1000))
      return this.$t('SecondsAgo', { n: secs })
    },
    isStale() {
      return !!this.lastUpdated && this.now - this.lastUpdated > STALE_AFTER_MS
    },
    runningContainersCount() {
      return (this.containers.containers || []).filter((c) => c.running).length
    },
    unapprovedCriticalFindingsCount() {
      return (this.containers.security_findings || []).filter(
        (f) => f.severity === 'critical' && !f.approved
      ).length
    }
  },
  mounted() {
    this.fetchAll()
    this.timer = setInterval(this.fetchAll, REFRESH_INTERVAL_MS)
    this.clock = setInterval(() => {
      this.now = Date.now()
    }, 1000)
  },
  beforeUnmount() {
    clearInterval(this.timer)
    clearInterval(this.clock)
  },
  methods: {
    async fetchAll() {
      this.loading = true
      const base = '/api/v1/ops/platform-health/'
      try {
        const [summary, host, postgres, containers, workers, backup, alerts, users] = await Promise.all([
          this.$axios.get(`${base}summary/`),
          this.$axios.get(`${base}host/`),
          this.$axios.get(`${base}postgres/`),
          this.$axios.get(`${base}containers/`),
          this.$axios.get(`${base}workers/`),
          this.$axios.get(`${base}backup/`),
          this.$axios.get(`${base}alerts/`),
          this.$axios.get(`${base}users/`)
        ])
        // $axios's response interceptor already unwraps response.data
        // (src/utils/request.js: `return res` where `res = response.data`)
        // — these are already the parsed JSON bodies, not axios Response
        // objects. A `.data` access here was the bug (undefined.alerts).
        this.summary = summary
        this.host = host
        this.postgres = postgres
        this.containers = containers
        this.workers = workers
        this.backup = backup
        this.alerts = alerts
        this.users = users
        this.lastUpdated = Date.now()
        this.now = this.lastUpdated
      } finally {
        this.loading = false
      }
    },
    statusTagType(status) {
      return (
        { healthy: 'success', degraded: 'warning', critical: 'danger', unknown: 'info' }[status] ||
        'info'
      )
    },
    alertSeverityToStatus(severity) {
      return { critical: 'critical', warning: 'degraded', info: 'unknown' }[severity] || 'unknown'
    },
    formatPercent(v) {
      return typeof v === 'number' ? `${v.toFixed(1)}%` : '-'
    },
    formatBytes(v) {
      if (typeof v !== 'number') return '-'
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let i = 0
      while (v >= 1024 && i < units.length - 1) {
        v /= 1024
        i++
      }
      return `${v.toFixed(1)} ${units[i]}`
    },
    formatDuration(seconds) {
      if (typeof seconds !== 'number') return '-'
      const d = Math.floor(seconds / 86400)
      const h = Math.floor((seconds % 86400) / 3600)
      return `${d}d ${h}h`
    },
    formatAge(seconds) {
      if (typeof seconds !== 'number') return '-'
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      return `${h}h ${m}m`
    },
    formatSince(iso) {
      if (!iso) return '-'
      return new Date(iso).toLocaleString()
    }
  }
}
</script>

<style lang="scss" scoped>
.ph-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.ph-updated {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.ph-row {
  margin-bottom: 16px;
}
.ph-metric {
  font-size: 28px;
  font-weight: 600;
}
.ph-desc {
  margin-top: 8px;
}
.ph-empty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
