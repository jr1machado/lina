<template>
  <div v-loading="loading">
    <el-alert
      v-if="data.full_access"
      :closable="false"
      :title="$t('FullAdministrativeAccess')"
      type="warning"
    >
      {{ $t('OriginRoles') }}: {{ data.roles.join(', ') }}
    </el-alert>
    <el-table v-else :data="data.permissions" size="small" style="width: 100%">
      <el-table-column :label="$t('Name')" prop="name" />
      <el-table-column :label="$t('Codename')" prop="codename" />
      <el-table-column :label="$t('OriginRoles')">
        <template #default="{ row }">
          {{ row.origin_roles.join(', ') }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
// S08A §36-38 - real backend union (apps/rbac/api/effective_permissions.py),
// not computed client-side.
export default {
  name: 'UserEffectivePermissions',
  props: {
    object: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      data: { full_access: false, roles: [], permissions: [] }
    }
  },
  created() {
    this.$axios
      .get(`/api/v1/rbac/users/${this.object.id}/effective-permissions/`)
      .then((res) => {
        this.data = res
      })
      .finally(() => {
        this.loading = false
      })
  }
}
</script>
