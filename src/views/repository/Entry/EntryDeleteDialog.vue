<template>
  <el-dialog :model-value="modelValue" :title="$t('DeleteCredential')" width="480px" @update:model-value="close">
    <el-alert type="error" :closable="false" show-icon :title="$t('DeleteCredentialWarning')" class="warning" />
    <el-form label-position="top">
      <el-form-item :label="$t('TypeCredentialNameToConfirm', { name: entry ? entry.name : '' })">
        <el-input v-model="confirmName" />
      </el-form-item>
      <el-form-item :label="$t('MFACodeTOTP')" required>
        <el-input v-model="totpCode" maxlength="6" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">{{ $t('Cancel') }}</el-button>
      <el-button
        type="danger"
        :loading="deleting"
        :disabled="!entry || confirmName !== entry.name || !totpCode"
        @click="confirmDelete"
      >
        {{ $t('DeleteCredential') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
// 2026-09-06 - hard delete, user request. Only reachable once the
// credential is already DISABLED (backend gate, api/entry.py `delete`) -
// same "type the exact name" + fresh MFA friction as collection delete.
// Tier 0 never reaches this dialog - see EntryRequestDeleteDialog.vue.
export default {
  name: 'EntryDeleteDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    entry: { type: Object, default: () => null }
  },
  emits: ['update:modelValue', 'deleted'],
  data() {
    return {
      confirmName: '',
      totpCode: '',
      deleting: false
    }
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.confirmName = ''
        this.totpCode = ''
      }
    }
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false)
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.$axios.post(`/api/v1/repository/entries/${this.entry.id}/delete/`, {
          confirm_name: this.confirmName,
          totp_code: this.totpCode
        })
        this.$message.success(this.$t('CredentialDeleted'))
        this.$emit('deleted')
        this.close()
      } finally {
        this.deleting = false
      }
    }
  }
}
</script>

<style scoped>
.warning {
  margin-bottom: 12px;
}
</style>
