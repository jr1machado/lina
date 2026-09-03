<template>
  <IBox v-loading="loading" class="templates-card" title="RotationPolicyTemplates">
    <div class="templates-intro">{{ $t('RotationPolicyTemplatesIntro') }}</div>
    <div class="templates-grid">
      <div v-for="tpl in templates" :key="tpl.id" class="template-item">
        <div class="template-name">{{ tpl.name }}</div>
        <div class="template-detail">
          {{ tpl.periodic_rotation ? $t('Every') + ' ' + tpl.rotation_interval_days + ' ' + $t('days') : $t('NotApplicable') }}
        </div>
        <el-button size="small" :loading="cloning === tpl.id" @click="clone(tpl)">
          {{ $t('Clone') }}
        </el-button>
      </div>
    </div>
  </IBox>
</template>

<script>
import { ElMessageBox } from 'element-plus'
import { IBox } from '@/components'
import { cloneRotationPolicyTemplate, listRotationPolicyTemplates } from '@/api/accounts'

// Sprint_35-Rotation-Policy-Editor.md §19-25, §78, §124 - built-in,
// read-only templates; the only action is Clone -> a new tenant policy.
export default {
  name: 'RotationPolicyTemplates',
  components: { IBox },
  emits: ['cloned'],
  data() {
    return {
      loading: true,
      templates: [],
      cloning: null
    }
  },
  created() {
    this.load()
  },
  methods: {
    load() {
      this.loading = true
      listRotationPolicyTemplates()
        .then((resp) => {
          this.templates = resp.results || resp
        })
        .finally(() => {
          this.loading = false
        })
    },
    clone(tpl) {
      ElMessageBox.prompt(this.$t('CloneTemplateNamePrompt'), this.$t('Clone'), {
        inputValue: `Copy of ${tpl.name}`
      })
        .then(({ value }) => {
          this.cloning = tpl.id
          return cloneRotationPolicyTemplate(tpl.id, value)
        })
        .then(() => {
          this.$message.success(this.$t('OperationSuccessful'))
          this.$emit('cloned')
        })
        .catch(() => {})
        .finally(() => {
          this.cloning = null
        })
    }
  }
}
</script>

<style scoped lang="scss">
.templates-card {
  margin-bottom: 16px;
}
.templates-intro {
  font-size: 13px;
  color: var(--color-text-secondary, #909399);
  margin-bottom: 12px;
}
.templates-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.template-item {
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  padding: 10px 14px;
  min-width: 200px;
}
.template-name {
  font-weight: 600;
  margin-bottom: 4px;
}
.template-detail {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
  margin-bottom: 8px;
}
</style>
