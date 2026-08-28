<template>
  <Page>
    <div v-if="$hasPerm('risk.view_reports_center')" v-loading="loading">
      <el-row :gutter="16" class="toolbar">
        <el-col :span="16">
          <el-radio-group v-model="categoryFilter" size="small">
            <el-radio-button label="">{{ $t('All') }}</el-radio-button>
            <el-radio-button label="IDENTITY">{{ $t('Identity') }}</el-radio-button>
            <el-radio-button label="CREDENTIALS">{{ $t('Credentials') }}</el-radio-button>
            <el-radio-button label="ACCESS">{{ $t('Access') }}</el-radio-button>
            <el-radio-button label="SESSIONS">{{ $t('Sessions') }}</el-radio-button>
            <el-radio-button label="GOVERNANCE_AUDIT">{{ $t('Governance & Audit') }}</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col :span="8">
          <el-input v-model="search" size="small" clearable :placeholder="$t('Search reports')" prefix-icon="Search" />
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col v-for="tpl in filteredTemplates" :key="tpl.key" :lg="8" :md="12" :sm="24" class="template-col">
          <IBox class="template-card">
            <div class="template-name">{{ tpl.name }}</div>
            <el-tag size="small" type="info">{{ $t(categoryLabel(tpl.category)) }}</el-tag>
            <p class="template-description">{{ tpl.description }}</p>
            <div class="template-footer">
              <span class="scope-hint">
                {{ tpl.device_group_scoped ? $t('Device Group scoped') : $t('Org-wide') }}
              </span>
              <el-button type="primary" size="small" @click="openGenerate(tpl)">{{ $t('Generate') }}</el-button>
            </div>
          </IBox>
        </el-col>
      </el-row>
    </div>
    <Page403 v-else />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form label-width="140px" size="small">
        <el-form-item :label="$t('Period')">
          <el-select v-model="form.dynamic_period" style="width: 100%">
            <el-option v-for="p in dynamicPeriods" :key="p.value" :label="$t(p.label)" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('Device Groups')" v-if="currentTemplate && currentTemplate.device_group_scoped">
          <el-select v-model="form.device_group_ids" multiple filterable style="width: 100%" :placeholder="$t('All authorized')">
            <el-option v-for="n in nodes" :key="n.id" :label="n.value" :value="n.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('Format')">
          <el-radio-group v-model="form.format">
            <el-radio label="PDF">PDF</el-radio>
            <el-radio label="XLSX">Excel</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('Watermark')">
          <el-checkbox v-model="form.watermark">{{ $t('Confidential') }}</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('Cancel') }}</el-button>
        <el-button type="primary" :loading="generating" @click="submitGenerate">{{ $t('Generate') }}</el-button>
      </template>
    </el-dialog>
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import Page403 from '@/views/403'
import { IBox } from '@/components'
import { getReportTemplates, generateReport, getNodes } from '@/api/reportsCenter'
import { message } from '@/utils/vue/message'

const CATEGORY_LABELS = {
  IDENTITY: 'Identity',
  CREDENTIALS: 'Credentials',
  ACCESS: 'Access',
  SESSIONS: 'Sessions',
  GOVERNANCE_AUDIT: 'Governance & Audit'
}

export default {
  name: 'ReportLibrary',
  components: { Page, Page403, IBox },
  data() {
    return {
      loading: false,
      templates: [],
      nodes: [],
      categoryFilter: '',
      search: '',
      dialogVisible: false,
      generating: false,
      currentTemplate: null,
      form: { dynamic_period: 'PREVIOUS_30_DAYS', device_group_ids: [], format: 'PDF', watermark: true },
      dynamicPeriods: [
        { value: 'PREVIOUS_DAY', label: 'Previous day' },
        { value: 'PREVIOUS_7_DAYS', label: 'Previous 7 days' },
        { value: 'PREVIOUS_WEEK', label: 'Previous week' },
        { value: 'PREVIOUS_30_DAYS', label: 'Previous 30 days' },
        { value: 'PREVIOUS_CALENDAR_MONTH', label: 'Previous calendar month' },
        { value: 'CURRENT_MONTH', label: 'Current month' }
      ]
    }
  },
  computed: {
    filteredTemplates() {
      return this.templates.filter((t) => {
        if (this.categoryFilter && t.category !== this.categoryFilter) return false
        if (this.search && !t.name.toLowerCase().includes(this.search.toLowerCase())) return false
        return true
      })
    },
    dialogTitle() {
      return this.currentTemplate ? this.currentTemplate.name : ''
    }
  },
  mounted() {
    if (this.$hasPerm('risk.view_reports_center')) {
      this.loadTemplates()
      this.loadNodes()
    }
  },
  methods: {
    categoryLabel(cat) {
      return CATEGORY_LABELS[cat] || cat
    },
    async loadTemplates() {
      this.loading = true
      try {
        this.templates = await getReportTemplates()
      } finally {
        this.loading = false
      }
    },
    async loadNodes() {
      try {
        const resp = await getNodes()
        this.nodes = resp.results || resp
      } catch (e) {
        this.nodes = []
      }
    },
    openGenerate(tpl) {
      this.currentTemplate = tpl
      this.form = { dynamic_period: 'PREVIOUS_30_DAYS', device_group_ids: [], format: 'PDF', watermark: true }
      this.dialogVisible = true
    },
    async submitGenerate() {
      this.generating = true
      try {
        await generateReport({
          template_key: this.currentTemplate.key,
          dynamic_period: this.form.dynamic_period,
          device_group_ids: this.form.device_group_ids,
          format: this.form.format,
          watermark: this.form.watermark
        })
        message.success(this.$t('Report queued. Check Report History for status.'))
        this.dialogVisible = false
      } finally {
        this.generating = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.toolbar {
  margin-bottom: 16px;
  align-items: center;
}
.template-col {
  margin-bottom: 16px;
}
.template-card {
  height: 100%;
}
.template-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}
.template-description {
  color: var(--color-text-secondary, #909399);
  font-size: 13px;
  min-height: 40px;
}
.template-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.scope-hint {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
</style>
