<template>
  <Page>
    <IBox class="provision-card">
      <div class="provision-intro">
        {{
          $t(
            'Select the devices (assets) to protect. Each one gets its own, unique, never-revealed Recovery/Reconciliation account - never a shared secret across devices.'
          )
        }}
      </div>
      <AssetSelect v-model="selectedAssets" :base-url="assetsUrl" />
      <div class="provision-actions">
        <el-button type="primary" :loading="submitting" :disabled="selectedAssets.length === 0" @click="submit">
          {{ $t('Configure Recovery Protection') }}
        </el-button>
        <span v-if="results.length" class="provision-summary">
          {{ $t('Processed') }}: {{ results.length }}
        </span>
      </div>

      <el-table v-if="results.length" :data="results" size="small" class="provision-results">
        <el-table-column prop="asset_name" :label="$t('Asset')" min-width="160" />
        <el-table-column :label="$t('Status')" width="200">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(row.status)">{{ $t(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" :label="$t('Account')" width="140" />
        <el-table-column :label="$t('Detail')" min-width="260">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING_FINGERPRINT'">
              <el-input
                v-model="row.fingerprint"
                size="small"
                placeholder="SHA256:xxxxxxxx"
                style="width: 200px; margin-right: 8px"
              />
              <el-button size="small" :loading="row.finishing" @click="finishLinuxBinding(row)">
                {{ $t('Finish') }}
              </el-button>
            </template>
            <span v-else class="provision-error">{{ row.error }}</span>
          </template>
        </el-table-column>
      </el-table>
    </IBox>
  </Page>
</template>

<script>
import { AssetSelect, IBox } from '@/components'
import { Page } from '@/layout/components'
import { createLinuxRotationExecutorBinding, provisionRecoveryAccounts } from '@/api/accounts'

// Sprint_34-Credential-Recovery-Contas-Reconciliacao.md §12/15-17/74-75/90 -
// dedicated Bulk Provision screen over the API/CRUD that already existed
// (Account create + Linux/WindowsRotationExecutorBinding create) - see
// INFO/Workflow/S34/00-Sumario.md "Fora do escopo desta rodada" (backend
// PR) for why this was previously API-only.
export default {
  name: 'RecoveryAccountBulkProvision',
  components: { Page, IBox, AssetSelect },
  data() {
    return {
      assetsUrl: '/api/v1/assets/assets/?category=host',
      selectedAssets: [],
      submitting: false,
      results: []
    }
  },
  methods: {
    statusTagType(status) {
      return (
        {
          HEALTHY: 'success',
          ALREADY_PROVISIONED: 'info',
          PENDING_FINGERPRINT: 'warning',
          UNSUPPORTED: 'info',
          FAILED: 'danger'
        }[status] || 'info'
      )
    },
    async submit() {
      this.submitting = true
      try {
        const assetIds = this.selectedAssets.map((a) => a.id)
        const data = await provisionRecoveryAccounts({ asset_ids: assetIds })
        this.results = data.map((row) => ({ ...row, fingerprint: '', finishing: false }))
      } finally {
        this.submitting = false
      }
    },
    async finishLinuxBinding(row) {
      if (!row.fingerprint) {
        this.$message.warning(this.$t('SSH host key fingerprint is required'))
        return
      }
      row.finishing = true
      try {
        await createLinuxRotationExecutorBinding({
          asset: row.asset_id,
          executor: row.account_id,
          ssh_host_key_fingerprint: row.fingerprint
        })
        row.status = 'HEALTHY'
        row.error = ''
      } finally {
        row.finishing = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.provision-card {
  padding: 8px;
}
.provision-intro {
  font-size: 13px;
  color: var(--color-text-secondary, #909399);
  margin-bottom: 12px;
  max-width: 720px;
}
.provision-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.provision-summary {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
.provision-results {
  margin-top: 16px;
}
.provision-error {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
</style>
