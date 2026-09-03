<template>
  <el-dialog
    v-model="visible"
    :title="$t('AssignAccounts')"
    width="560px"
    @close="reset"
  >
    <div class="assign-intro">{{ $t('AssignAccountsIntro') }}</div>
    <AssetSelect v-model="selectedAssets" />

    <div class="assign-actions">
      <el-button size="small" :loading="previewing" :disabled="!selectedAssets.length" @click="doPreview">
        {{ $t('PreviewImpact') }}
      </el-button>
    </div>

    <div v-if="preview" class="assign-preview">
      <div class="preview-row">{{ $t('MatchedAccounts') }}: <b>{{ preview.matched_accounts }}</b></div>
      <div class="preview-row">{{ $t('RemainCompliant') }}: <b>{{ preview.remain_compliant }}</b></div>
      <div class="preview-row">{{ $t('WillBecomeOverdue') }}: <b class="warn">{{ preview.will_become_overdue }}</b></div>
      <div class="preview-row">{{ $t('AlreadyOverdue') }}: <b class="warn">{{ preview.already_overdue }}</b></div>
    </div>

    <template #footer>
      <el-button size="small" @click="visible = false">{{ $t('Cancel') }}</el-button>
      <el-button
        size="small"
        type="primary"
        :loading="assigning"
        :disabled="!preview"
        @click="doAssign"
      >
        {{ $t('ApplyChanges') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import { AssetSelect } from '@/components'
import { assignRotationPolicy, previewRotationPolicyAssignment } from '@/api/accounts'

// Sprint_35-Rotation-Policy-Editor.md §28-30, §63-68 - Bulk Assignment
// with a mandatory Impact Preview step (§66) before applying. Scope is
// asset-based only (no Device Group/tag picker) - same lazy scope
// BulkProvision.vue already uses; adding those pickers can come later if
// actually needed, not speculatively now.
export default {
  name: 'AssignAccountsDialog',
  components: { AssetSelect },
  props: {
    modelValue: { type: Boolean, default: false },
    policy: { type: Object, default: () => ({}) }
  },
  emits: ['update:modelValue', 'assigned'],
  data() {
    return {
      selectedAssets: [],
      preview: null,
      previewing: false,
      assigning: false
    }
  },
  computed: {
    visible: {
      get() {
        return this.modelValue
      },
      set(val) {
        this.$emit('update:modelValue', val)
      }
    }
  },
  watch: {
    selectedAssets() {
      this.preview = null
    }
  },
  methods: {
    reset() {
      this.selectedAssets = []
      this.preview = null
    },
    scopeParams() {
      return { asset_ids: this.selectedAssets }
    },
    doPreview() {
      this.previewing = true
      previewRotationPolicyAssignment(this.policy.id, this.scopeParams())
        .then((resp) => {
          this.preview = resp
        })
        .finally(() => {
          this.previewing = false
        })
    },
    doAssign() {
      this.assigning = true
      assignRotationPolicy(this.policy.id, this.scopeParams())
        .then((resp) => {
          this.$message.success(`${this.$t('AccountsAssignedSuccess')}: ${resp.assigned}`)
          this.$emit('assigned')
          this.visible = false
        })
        .finally(() => {
          this.assigning = false
        })
    }
  }
}
</script>

<style scoped lang="scss">
.assign-intro {
  font-size: 13px;
  color: var(--color-text-secondary, #909399);
  margin-bottom: 12px;
}
.assign-actions {
  margin-top: 12px;
}
.assign-preview {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 4px;
}
.preview-row {
  font-size: 13px;
  margin-bottom: 4px;
}
.warn {
  color: var(--el-color-warning, #e6a23c);
}
</style>
