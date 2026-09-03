<template>
  <el-dialog v-model="visible" :title="$t('BulkClassification')" width="480px">
    <div class="intro">{{ $t('BulkClassificationIntro', { count: selectedRows.length }) }}</div>
    <el-form label-position="top">
      <el-form-item :label="$t('Field')">
        <el-select v-model="field" @change="preview = null">
          <el-option :label="$t('SecurityTier')" value="security_tier" />
          <el-option :label="$t('AccountPurpose')" value="account_purpose" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('Value')">
        <el-select v-model="value" @change="preview = null">
          <el-option v-for="opt in valueOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
    </el-form>

    <el-button size="small" :loading="previewing" :disabled="!value" @click="doPreview">
      {{ $t('Preview') }}
    </el-button>

    <div v-if="preview" class="preview-result">
      <div>{{ $t('WillChange') }}: <b>{{ preview.will_change }}</b> / {{ preview.total }}</div>
      <div v-if="preview.will_fail && preview.will_fail.length" class="preview-fail">
        <div class="preview-fail__title">{{ $t('WillBeSkipped') }}:</div>
        <div v-for="f in preview.will_fail" :key="f.id" class="preview-fail__row">
          {{ f.name }} — {{ f.reason }}
        </div>
      </div>
      <!-- Sprint_36 §115-116 - a sensitive transition (Tier 0 away, or
           Purpose into/out of Reconciliation/Break Glass) is present in
           the batch; a reason is mandatory before Apply. -->
      <el-form-item v-if="preview.needs_reason" :label="$t('Reason')" class="reason-field">
        <el-input v-model="reason" type="textarea" :rows="2" />
      </el-form-item>
    </div>

    <template #footer>
      <el-button size="small" @click="visible = false">{{ $t('Cancel') }}</el-button>
      <el-button
        size="small"
        type="primary"
        :loading="applying"
        :disabled="!preview || (preview.needs_reason && !reason.trim())"
        @click="doApply"
      >
        {{ $t('Apply') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { bulkClassifyAccounts } from '@/api/accounts'

// Sprint_36-Account-Class-Lifecycle.md §120-121 - Bulk Classification:
// always previews first, always validates each account individually on
// the backend (never a blanket write) - see AccountViewSet.bulk_classification.
export default {
  name: 'BulkClassificationDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    selectedRows: { type: Array, default: () => [] }
  },
  emits: ['update:modelValue', 'applied'],
  data() {
    return {
      field: 'security_tier',
      value: '',
      reason: '',
      preview: null,
      previewing: false,
      applying: false
    }
  },
  computed: {
    visible: {
      get() {
        return this.modelValue
      },
      set(v) {
        this.$emit('update:modelValue', v)
      }
    },
    valueOptions() {
      if (this.field === 'security_tier') {
        return [
          { value: 'TIER_0', label: this.$t('Tier0') },
          { value: 'TIER_1', label: this.$t('Tier1') },
          { value: 'TIER_2', label: this.$t('Tier2') },
          { value: 'UNCLASSIFIED', label: this.$t('Unclassified') }
        ]
      }
      return [
        { value: 'STANDARD', label: this.$t('Standard') },
        { value: 'PRIVILEGED', label: this.$t('Privileged') },
        { value: 'SERVICE', label: this.$t('Service') },
        { value: 'BREAK_GLASS', label: this.$t('BreakGlass') },
        { value: 'RECONCILIATION', label: this.$t('ReconciliationAccount') }
      ]
    },
    accountIds() {
      return this.selectedRows.map((r) => r.id)
    }
  },
  methods: {
    doPreview() {
      this.previewing = true
      bulkClassifyAccounts(this.accountIds, this.field, this.value, true, this.reason)
        .then((resp) => {
          this.preview = resp
        })
        .finally(() => {
          this.previewing = false
        })
    },
    doApply() {
      this.applying = true
      bulkClassifyAccounts(this.accountIds, this.field, this.value, false, this.reason)
        .then((resp) => {
          this.$message.success(`${this.$t('AccountsUpdated')}: ${resp.changed}`)
          this.visible = false
          this.$emit('applied')
        })
        .finally(() => {
          this.applying = false
        })
    }
  }
}
</script>

<style scoped>
.intro {
  font-size: 13px;
  color: var(--color-text-secondary, #909399);
  margin-bottom: 12px;
}
.preview-result {
  margin-top: 12px;
  font-size: 13px;
}
.preview-fail {
  margin-top: 8px;
}
.preview-fail__title {
  color: var(--el-color-danger, #f56c6c);
  font-weight: 600;
}
.preview-fail__row {
  color: var(--color-text-secondary, #909399);
}
</style>
