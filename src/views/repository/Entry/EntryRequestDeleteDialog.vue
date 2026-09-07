<template>
  <el-dialog :model-value="modelValue" :title="$t('RequestDeletion')" width="480px" @update:model-value="close">
    <el-alert type="warning" :closable="false" show-icon :title="$t('RequestDeletionTier0Notice')" class="warning" />
    <el-form label-position="top">
      <el-form-item :label="$t('Reason')" required>
        <el-input v-model="form.reason" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item :label="$t('Reference')">
        <el-input v-model="form.reference" />
      </el-form-item>
      <el-form-item :label="$t('MFACodeTOTP')" required>
        <el-input v-model="form.totp_code" maxlength="6" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">{{ $t('Cancel') }}</el-button>
      <el-button
        type="danger"
        :loading="submitting"
        :disabled="!entry || !form.reason || !form.totp_code"
        @click="submit"
      >
        {{ $t('SubmitRequest') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
// 2026-09-06 - Tier 0 delete requires Approver Group sign-off, same
// RepositoryRequest state machine as reveal access requests (api/entry.py
// request_delete action, action_type=DELETE) - the requester can never be
// the one who approves it (RepositoryRequest.is_self_approval).
export default {
  name: 'EntryRequestDeleteDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    entry: { type: Object, default: () => null }
  },
  emits: ['update:modelValue', 'requested'],
  data() {
    return {
      form: { reason: '', reference: '', totp_code: '' },
      submitting: false
    }
  },
  watch: {
    modelValue(val) {
      if (val) this.form = { reason: '', reference: '', totp_code: '' }
    }
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false)
    },
    async submit() {
      this.submitting = true
      try {
        await this.$axios.post(`/api/v1/repository/entries/${this.entry.id}/request-delete/`, this.form)
        this.$message.success(this.$t('DeleteRequestCreated'))
        this.$emit('requested')
        this.close()
      } finally {
        this.submitting = false
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
