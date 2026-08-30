<template>
  <IBox :title="$t('VaultSecurityStatus')">
    <el-descriptions :column="2" border>
      <el-descriptions-item :label="$t('VaultStatus')">
        <el-tag :type="status.status === 'HEALTHY' ? 'success' : 'danger'">
          {{ status.status || '-' }}
        </el-tag>
        <span v-if="status.status_detail">{{ status.status_detail }}</span>
      </el-descriptions-item>
      <el-descriptions-item :label="$t('CryptoProvider')">
        {{ status.backend_display || '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="$t('HardwareBacked')">
        <span v-if="status.hardware_backed === true">{{ $t('Yes') }}</span>
        <span v-else-if="status.hardware_backed === false">{{ $t('No') }} ({{ status.seal_type }})</span>
        <span v-else>{{ $t('NotApplicable') }}</span>
      </el-descriptions-item>
      <el-descriptions-item :label="$t('EncryptionAlgorithm')">
        {{ status.encryption_algorithm || '-' }}
      </el-descriptions-item>
      <el-descriptions-item :label="$t('LastCryptoHealthCheck')">
        {{ status.checked_at ? toSafeLocalDateStr(status.checked_at) : '-' }}
      </el-descriptions-item>
    </el-descriptions>
  </IBox>
</template>

<script>
// Sprint_33-Vault-Protection.md §60/77-79 - Vault Security Center: status
// only, read from the live vault_client singleton
// (GET /api/v1/settings/vault/security-status/) - never a key/PIN/handle.
import IBox from '@/components/Common/IBox/index.vue'
import { useDateTime } from '@/composables/useDateTime'

export default {
  name: 'VaultSecurityStatus',
  components: { IBox },
  setup() {
    return useDateTime()
  },
  data() {
    return {
      status: {}
    }
  },
  mounted() {
    this.fetchStatus()
  },
  methods: {
    fetchStatus() {
      this.$axios
        .get('/api/v1/settings/vault/security-status/', { disableFlashErrorMsg: true })
        .then((res) => {
          this.status = res
        })
        .catch(() => {})
    }
  }
}
</script>

<style scoped></style>
