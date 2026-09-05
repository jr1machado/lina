<template>
  <el-dialog :model-value="modelValue" :title="$t('CollectionAccess')" width="520px" @update:model-value="close">
    <p class="hint">{{ $t('CollectionAccessHint') }}</p>

    <el-table v-loading="loading" :data="grants" size="small" class="grants-table">
      <el-table-column prop="user_group_name" :label="$t('UserGroup')" />
      <el-table-column prop="access_level" :label="$t('AccessLevel')" width="120" />
      <el-table-column width="80">
        <template #default="{ row }">
          <el-button link type="danger" @click="remove(row)">{{ $t('Remove') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="add-row">
      <el-select v-model="form.user_group" :placeholder="$t('UserGroup')" filterable style="flex: 1">
        <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
      </el-select>
      <el-select v-model="form.access_level" style="width: 130px">
        <el-option label="VIEW" value="VIEW" />
        <el-option label="MANAGE" value="MANAGE" />
      </el-select>
      <el-button type="primary" :disabled="!form.user_group" @click="add">{{ $t('Add') }}</el-button>
    </div>

    <template #footer>
      <el-button @click="close">{{ $t('Close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'CollectionAccessDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    collection: { type: Object, default: () => null }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      loading: false,
      grants: [],
      groups: [],
      form: { user_group: '', access_level: 'VIEW' }
    }
  },
  watch: {
    modelValue(val) {
      if (val && this.collection) this.load()
    }
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false)
    },
    async load() {
      this.loading = true
      try {
        const [grants, groups] = await Promise.all([
          this.$axios.get(`/api/v1/repository/collections/${this.collection.id}/access/`),
          this.$axios.get('/api/v1/users/groups/', { params: { limit: 999 } })
        ])
        this.grants = grants
        this.groups = groups.results || groups
      } finally {
        this.loading = false
      }
    },
    async add() {
      await this.$axios.post(`/api/v1/repository/collections/${this.collection.id}/access/`, this.form)
      this.form.user_group = ''
      await this.load()
    },
    async remove(row) {
      await this.$axios.delete(`/api/v1/repository/collections/${this.collection.id}/access/${row.id}/`)
      await this.load()
    }
  }
}
</script>

<style scoped>
.hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin: 0 0 12px;
}
.grants-table {
  margin-bottom: 16px;
}
.add-row {
  display: flex;
  gap: 8px;
}
</style>
