<template>
  <div v-loading="loading">
    <el-alert
      v-if="data.full_access"
      :closable="false"
      :title="$t('FullAdministrativeAccess')"
      type="warning"
      style="margin-bottom: 12px"
    >
      {{ $t('OriginRoles') }}: {{ data.roles.join(', ') }}.
      {{ $t('FullAccessEditHint') }}
    </el-alert>
    <el-input
      v-model="filterText"
      :placeholder="$t('Search')"
      clearable
      size="small"
      style="width: 320px; margin-bottom: 12px"
    />
    <el-table :data="filteredPermissions" size="small" style="width: 100%" height="480">
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
      filterText: '',
      data: { full_access: false, roles: [], permissions: [] }
    }
  },
  computed: {
    filteredPermissions() {
      if (!this.filterText) return this.data.permissions
      const needle = this.filterText.toLowerCase()
      return this.data.permissions.filter(
        (p) => p.codename.toLowerCase().includes(needle) || p.name.toLowerCase().includes(needle)
      )
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
