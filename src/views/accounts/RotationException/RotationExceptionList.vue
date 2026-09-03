<template>
  <Page>
    <IBox title="RotationExceptions">
      <div class="header-row">
        <el-button
          v-if="$hasPerm('accounts.add_rotationexception')"
          size="small"
          type="primary"
          @click="showCreate = true"
        >
          {{ $t('CreateException') }}
        </el-button>
      </div>
      <el-table v-loading="loading" :data="exceptions" size="small">
        <el-table-column prop="account_name" :label="$t('Account')" min-width="140" />
        <el-table-column prop="asset_name" :label="$t('Asset')" min-width="140" />
        <el-table-column prop="reason" :label="$t('Reason')" min-width="200" />
        <el-table-column prop="reference" :label="$t('Reference')" min-width="140" />
        <el-table-column :label="$t('Status')" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expires_at" :label="$t('ExpiresAt')" width="180" />
        <el-table-column :label="$t('Actions')" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'ACTIVE' && $hasPerm('accounts.revoke_rotationexception')"
              size="small"
              :loading="revoking === row.id"
              @click="revoke(row)"
            >
              {{ $t('Revoke') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </IBox>

    <el-dialog v-model="showCreate" :title="$t('CreateException')" width="480px">
      <el-form label-position="top">
        <el-form-item :label="$t('Account')">
          <Select2 v-model="form.account" :url="'/api/v1/accounts/accounts/'" :multiple="false" />
        </el-form-item>
        <el-form-item :label="$t('Reason')">
          <el-input v-model="form.reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="$t('Reference')">
          <el-input v-model="form.reference" placeholder="Ticket / change / incident" />
        </el-form-item>
        <el-form-item :label="$t('ExpiresAt')">
          <el-date-picker v-model="form.expires_at" type="datetime" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="showCreate = false">{{ $t('Cancel') }}</el-button>
        <el-button size="small" type="primary" :loading="creating" @click="create">
          {{ $t('CreateException') }}
        </el-button>
      </template>
    </el-dialog>
  </Page>
</template>

<script>
import { IBox, Select2 } from '@/components'
import { Page } from '@/layout/components'
import { createRotationException, revokeRotationException } from '@/api/accounts'

// Sprint_35-Rotation-Policy-Editor.md §30-35 - temporary, justified
// rotation suspension. Never edits the assigned RotationPolicy (§34);
// once expired/revoked, the policy is simply effective again.
export default {
  name: 'RotationExceptionList',
  components: { Page, IBox, Select2 },
  data() {
    return {
      loading: true,
      exceptions: [],
      showCreate: false,
      creating: false,
      revoking: null,
      form: { account: null, reason: '', reference: '', expires_at: null }
    }
  },
  created() {
    this.load()
  },
  methods: {
    load() {
      this.loading = true
      this.$axios
        .get('/api/v1/accounts/rotation-exceptions/?order=-valid_from')
        .then((resp) => {
          this.exceptions = resp.results || resp
        })
        .finally(() => {
          this.loading = false
        })
    },
    statusTagType(status) {
      return { ACTIVE: 'warning', EXPIRED: 'info', REVOKED: 'info' }[status] || 'info'
    },
    create() {
      if (!this.form.account) {
        this.$message.warning(this.$t('Account'))
        return
      }
      if (!this.form.expires_at) {
        this.$message.warning(this.$t('ExceptionRequiresExpiry'))
        return
      }
      this.creating = true
      const accountId = this.form.account?.id || this.form.account
      createRotationException({
        account: accountId,
        reason: this.form.reason,
        reference: this.form.reference,
        expires_at: new Date(this.form.expires_at).toISOString()
      })
        .then(() => {
          this.$message.success(this.$t('OperationSuccessful'))
          this.showCreate = false
          this.form = { account: null, reason: '', reference: '', expires_at: null }
          this.load()
        })
        .finally(() => {
          this.creating = false
        })
    },
    revoke(row) {
      this.revoking = row.id
      revokeRotationException(row.id)
        .then(() => {
          this.$message.success(this.$t('OperationSuccessful'))
          this.load()
        })
        .finally(() => {
          this.revoking = null
        })
    }
  }
}
</script>

<style scoped>
.header-row {
  margin-bottom: 12px;
}
</style>
