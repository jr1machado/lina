<template>
  <Page>
    <div v-if="$hasPerm('risk.view_report_branding')" v-loading="loading">
      <IBox :title="$t('Company Logo')">
        <p class="rules">
          {{ $t('Shown on the cover page of every generated PDF report.') }}
          <br>
          {{ $t('Accepted formats: PNG or JPEG.') }}
          {{ $t('Maximum file size: 500KB.') }}
        </p>

        <div class="preview-row">
          <div class="preview-box">
            <img v-if="hasLogo" :src="previewUrl" :alt="$t('Company logo')" class="preview-image">
            <span v-else class="preview-empty">{{ $t('No logo uploaded') }}</span>
          </div>

          <div class="preview-meta" v-if="hasLogo">
            <div>{{ $t('Format') }}: {{ branding.content_type }}</div>
            <div v-if="branding.updated_by">{{ $t('Uploaded by') }}: {{ branding.updated_by }}</div>
            <div v-if="branding.date_updated">{{ $t('Uploaded at') }}: {{ formatDate(branding.date_updated) }}</div>
          </div>
        </div>

        <div v-if="$hasPerm('risk.manage_report_branding')" class="actions">
          <el-upload
            ref="upload"
            action=""
            :show-file-list="false"
            :auto-upload="false"
            accept=".png,.jpg,.jpeg"
            :on-change="onFileSelected"
          >
            <el-button size="small">{{ $t('Choose File') }}</el-button>
          </el-upload>
          <el-button
            size="small"
            type="primary"
            :disabled="!selectedFile"
            :loading="uploading"
            @click="submitUpload"
          >{{ $t('Upload') }}</el-button>
          <el-button
            v-if="hasLogo"
            size="small"
            type="danger"
            plain
            @click="removeLogo"
          >{{ $t('Remove Logo') }}</el-button>
        </div>
        <div v-if="selectedFile" class="selected-file">
          {{ $t('Selected') }}: {{ selectedFile.name }} ({{ formatSize(selectedFile.size) }})
        </div>
      </IBox>
    </div>
    <Page403 v-else />
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import Page403 from '@/views/403'
import { IBox } from '@/components'
import { deleteReportBranding, getReportBranding, reportBrandingImageUrl, uploadReportBranding } from '@/api/reportsCenter'
import { message } from '@/utils/vue/message'
import { ElMessageBox } from 'element-plus'

const MAX_LOGO_SIZE_BYTES = 500 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg']

export default {
  name: 'ReportBranding',
  components: { Page, Page403, IBox },
  data() {
    return {
      loading: false,
      uploading: false,
      branding: { has_logo: false },
      selectedFile: null,
      // Cache-busts the <img> src after a re-upload so the browser doesn't
      // keep showing the previous logo from its own cache.
      cacheBust: Date.now()
    }
  },
  computed: {
    hasLogo() {
      return !!this.branding.has_logo
    },
    previewUrl() {
      return `${reportBrandingImageUrl()}?t=${this.cacheBust}`
    }
  },
  mounted() {
    if (this.$hasPerm('risk.view_report_branding')) {
      this.load()
    }
  },
  methods: {
    async load() {
      this.loading = true
      try {
        this.branding = await getReportBranding()
      } finally {
        this.loading = false
      }
    },
    formatSize(bytes) {
      return `${(bytes / 1024).toFixed(1)} KB`
    },
    formatDate(value) {
      return new Date(value).toLocaleString()
    },
    onFileSelected(file) {
      const raw = file.raw
      if (!ALLOWED_TYPES.includes(raw.type)) {
        message.error(this.$t('Logo must be a PNG or JPEG image.'))
        this.selectedFile = null
        return
      }
      if (raw.size > MAX_LOGO_SIZE_BYTES) {
        message.error(this.$t('Logo must be at most 500KB.'))
        this.selectedFile = null
        return
      }
      this.selectedFile = raw
    },
    async submitUpload() {
      if (!this.selectedFile) return
      this.uploading = true
      try {
        await uploadReportBranding(this.selectedFile)
        message.success(this.$t('Logo uploaded'))
        this.selectedFile = null
        this.cacheBust = Date.now()
        await this.load()
      } finally {
        this.uploading = false
      }
    },
    async removeLogo() {
      await ElMessageBox.confirm(this.$t('Remove the company logo from generated reports?'), this.$t('Confirm'), { type: 'warning' })
      await deleteReportBranding()
      message.success(this.$t('Logo removed'))
      await this.load()
    }
  }
}
</script>

<style lang="scss" scoped>
.rules {
  color: var(--color-text-secondary, #909399);
  font-size: 13px;
  margin-bottom: 16px;
}
.preview-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 16px;
}
.preview-box {
  width: 200px;
  height: 100px;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.preview-image {
  max-width: 100%;
  max-height: 100%;
}
.preview-empty {
  color: var(--color-text-secondary, #909399);
  font-size: 12px;
}
.preview-meta {
  font-size: 13px;
  color: var(--color-text-secondary, #909399);
  line-height: 1.8;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.selected-file {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
</style>
