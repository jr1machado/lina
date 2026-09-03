<template>
  <div class="account-category">
    <el-tag v-for="tag in tags" :key="tag.key" :type="tag.type" size="small" disable-transitions>
      {{ tag.label }}
    </el-tag>
    <span v-if="!tags.length">-</span>
  </div>
</template>

<script>
// S34 - "which category is this account" was only visible one flag at a
// time (Rotation.vue/Recovery.vue read a single field each); the Asset
// Detail > Accounts tab needs all of them at a glance, so this reads the
// same governance flags set from the Account create/edit form directly
// off the row, no extra API field.
import BaseFormatter from './base.vue'

export default {
  name: 'AccountCategoryFormatter',
  extends: BaseFormatter,
  computed: {
    tags() {
      const row = this.row
      const items = [
        ['reconciliation_account', this.$t('ReconciliationAccount'), 'danger'],
        ['break_glass', this.$t('BreakGlass'), 'warning'],
        ['service_account', this.$t('ServiceAccount'), 'info'],
        ['is_shared', this.$t('Shared'), ''],
        ['exclusive_use', this.$t('ExclusiveUse'), '']
      ]
      return items
        .filter(([field]) => !!row[field])
        .map(([field, label, type]) => ({ key: field, label, type }))
    }
  }
}
</script>

<style lang="scss" scoped>
.account-category {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
