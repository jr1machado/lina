<template>
  <el-dialog :model-value="modelValue" :title="$t('DeleteCollection')" width="480px" @update:model-value="close">
    <el-alert type="error" :closable="false" show-icon :title="$t('DeleteCollectionWarning')" class="warning" />
    <p v-if="collection" class="entries-count">
      {{ $t('CredentialsAmount') }}: <strong>{{ collection.entries_amount }}</strong>
    </p>
    <el-form label-position="top">
      <el-form-item :label="$t('TypeCollectionNameToConfirm', { name: collection ? collection.name : '' })">
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
        :disabled="!collection || confirmName !== collection.name || !totpCode"
        @click="confirmDelete"
      >
        {{ $t('DeleteCollection') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
// 2026-09-05 - hard delete, user request. Cascades to every entry in the
// collection (repository/api/collection.py delete action) - the same
// "type the exact name" + fresh MFA friction as the DB restore flow
// (PlatformHealth/index.vue), never a bare confirm checkbox for
// something this irreversible.
export default {
  name: 'CollectionDeleteDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    collection: { type: Object, default: () => null }
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
        await this.$axios.post(`/api/v1/repository/collections/${this.collection.id}/delete/`, {
          confirm_name: this.confirmName,
          totp_code: this.totpCode
        })
        this.$message.success(this.$t('CollectionDeleted'))
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
.entries-count {
  margin: 0 0 12px;
  font-size: 13px;
}
</style>
