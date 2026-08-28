<template>
  <Page>
    <div v-if="$hasPerm('risk.view_reportschedule')" v-loading="loading">
      <div class="toolbar">
        <el-button type="primary" size="small" @click="openCreate">{{ $t('New Schedule') }}</el-button>
      </div>
      <el-table :data="schedules" size="small">
        <el-table-column prop="name" :label="$t('Name')" />
        <el-table-column prop="base_template" :label="$t('Report')" />
        <el-table-column :label="$t('Frequency')" width="220">
          <template #default="{ row }">{{ $t(row.frequency) }} @ {{ row.execution_time }} ({{ row.timezone }})</template>
        </el-table-column>
        <el-table-column prop="dynamic_period" :label="$t('Period')" width="160">
          <template #default="{ row }">{{ $t(row.dynamic_period) }}</template>
        </el-table-column>
        <el-table-column :label="$t('Recipients')" width="120">
          <template #default="{ row }">{{ (row.recipients || []).length }}</template>
        </el-table-column>
        <el-table-column prop="format" :label="$t('Format')" width="80" />
        <el-table-column :label="$t('Status')" width="140">
          <template #default="{ row }">
            <el-tag size="small" :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? $t('Active') : $t('Disabled') }}
            </el-tag>
            <div v-if="row.disabled_reason" class="disabled-reason">{{ $t(row.disabled_reason) }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('Actions')" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">{{ $t('Edit') }}</el-button>
            <el-button size="small" @click="toggleActive(row)">{{ row.is_active ? $t('Disable') : $t('Enable') }}</el-button>
            <el-button size="small" type="danger" plain @click="remove(row)">{{ $t('Delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <Page403 v-else />

    <el-dialog v-model="dialogVisible" :title="editing ? $t('Edit Schedule') : $t('New Schedule')" width="560px">
      <el-form label-width="140px" size="small">
        <el-form-item :label="$t('Name')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('Report')">
          <el-select v-model="form.base_template" style="width: 100%" :disabled="editing">
            <el-option v-for="tpl in templates" :key="tpl.key" :label="tpl.name" :value="tpl.key" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('Frequency')">
          <el-select v-model="form.frequency" style="width: 100%">
            <el-option label="Daily" value="DAILY" />
            <el-option label="Weekly (Monday)" value="WEEKLY" />
            <el-option label="Monthly (day 1)" value="MONTHLY" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('Execution Time')">
          <el-time-picker v-model="form.execution_time" format="HH:mm" value-format="HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('Timezone')">
          <el-select v-model="form.timezone" filterable style="width: 100%">
            <el-option label="UTC" value="UTC" />
            <el-option label="America/Sao_Paulo" value="America/Sao_Paulo" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('Dynamic Period')">
          <el-select v-model="form.dynamic_period" style="width: 100%">
            <el-option v-for="p in dynamicPeriods" :key="p" :label="$t(p)" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('Device Groups')">
          <el-select v-model="form.device_groups" multiple filterable style="width: 100%" :placeholder="$t('All authorized')">
            <el-option v-for="n in nodes" :key="n.id" :label="n.value" :value="n.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('Format')">
          <el-radio-group v-model="form.format">
            <el-radio label="PDF">PDF</el-radio>
            <el-radio label="XLSX">Excel</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('Recipients')">
          <el-select v-model="form.recipients" multiple filterable allow-create default-first-option style="width: 100%" :placeholder="$t('Up to 10 emails')" />
        </el-form-item>
        <el-form-item :label="$t('Watermark')">
          <el-checkbox v-model="form.watermark">{{ $t('Confidential') }}</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submit">{{ $t('Save') }}</el-button>
      </template>
    </el-dialog>
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import Page403 from '@/views/403'
import { ElMessageBox } from 'element-plus'
import { message } from '@/utils/vue/message'
import {
  getReportSchedules, createReportSchedule, updateReportSchedule, deleteReportSchedule,
  getReportTemplates, getNodes
} from '@/api/reportsCenter'

const DEFAULT_FORM = () => ({
  name: '', base_template: '', frequency: 'DAILY', execution_time: '08:00:00', timezone: 'UTC',
  dynamic_period: 'PREVIOUS_DAY', device_groups: [], format: 'PDF', recipients: [], watermark: true
})

export default {
  name: 'MySchedules',
  components: { Page, Page403 },
  data() {
    return {
      loading: false,
      saving: false,
      schedules: [],
      templates: [],
      nodes: [],
      dialogVisible: false,
      editing: null,
      form: DEFAULT_FORM(),
      dynamicPeriods: [
        'PREVIOUS_DAY', 'PREVIOUS_7_DAYS', 'PREVIOUS_WEEK', 'PREVIOUS_30_DAYS',
        'PREVIOUS_CALENDAR_MONTH', 'CURRENT_MONTH'
      ]
    }
  },
  mounted() {
    if (this.$hasPerm('risk.view_reportschedule')) {
      this.load()
      this.loadTemplates()
      this.loadNodes()
    }
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const resp = await getReportSchedules()
        this.schedules = resp.results || resp
      } finally {
        this.loading = false
      }
    },
    async loadTemplates() {
      this.templates = await getReportTemplates()
    },
    async loadNodes() {
      try {
        const resp = await getNodes()
        this.nodes = resp.results || resp
      } catch (e) {
        this.nodes = []
      }
    },
    openCreate() {
      this.editing = null
      this.form = DEFAULT_FORM()
      this.dialogVisible = true
    },
    openEdit(row) {
      this.editing = row
      this.form = {
        name: row.name, base_template: row.base_template, frequency: row.frequency,
        execution_time: row.execution_time, timezone: row.timezone, dynamic_period: row.dynamic_period,
        device_groups: row.device_groups || [], format: row.format, recipients: row.recipients || [],
        watermark: row.watermark
      }
      this.dialogVisible = true
    },
    async submit() {
      this.saving = true
      try {
        if (this.editing) {
          await updateReportSchedule(this.editing.id, this.form)
        } else {
          await createReportSchedule(this.form)
        }
        message.success(this.$t('Saved'))
        this.dialogVisible = false
        this.load()
      } finally {
        this.saving = false
      }
    },
    async toggleActive(row) {
      await updateReportSchedule(row.id, { is_active: !row.is_active })
      this.load()
    },
    async remove(row) {
      await ElMessageBox.confirm(
        this.$t('Delete schedule?') + ' ' + row.name + ' ' + this.$t('will no longer be generated automatically.'),
        this.$t('Confirm'), { type: 'warning' }
      )
      await deleteReportSchedule(row.id)
      message.success(this.$t('Deleted'))
      this.load()
    }
  }
}
</script>

<style lang="scss" scoped>
.toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}
.disabled-reason {
  font-size: 11px;
  color: var(--el-color-danger);
}
</style>
