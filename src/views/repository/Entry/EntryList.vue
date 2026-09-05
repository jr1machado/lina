<template>
  <Page>
    <div class="filters-bar">
      <el-radio-group v-model="scope">
        <el-radio-button label="all">{{ $t('All') }}</el-radio-button>
        <el-radio-button label="favorites">{{ $t('Favorites') }}</el-radio-button>
      </el-radio-group>
      <el-select
        v-model="filter.category"
        :placeholder="$t('Category')"
        clearable
        filterable
        style="width: 220px"
      >
        <el-option v-for="c in categories" :key="c.category" :label="`${c.category} (${c.count})`" :value="c.category" />
      </el-select>
      <el-select v-model="filter.security_tier" :placeholder="$t('Tier')" clearable style="width: 140px">
        <el-option label="TIER_0" value="TIER_0" />
        <el-option label="TIER_1" value="TIER_1" />
        <el-option label="TIER_2" value="TIER_2" />
      </el-select>
      <el-select v-model="filter.secret_age" :placeholder="$t('SecretAge')" clearable style="width: 160px">
        <el-option :label="`< 30 ${$t('Days')}`" value="lt30" />
        <el-option label="30-90" value="30to90" />
        <el-option :label="$t('Over90Days')" value="gt90" />
      </el-select>
    </div>

    <EntryTable ref="table" :key="tableKey" :extra-query="tableQuery" />
  </Page>
</template>

<script>
import EntryTable from './EntryTable.vue'
import { Page } from '@/layout/components'

// 2026-09-04 - "Todas as credenciais" (sidebar): the filterable full
// list, drilled into from the Dashboard's cards/insights via query
// params. Cards/technology chart/insights live on the Dashboard now
// (Dashboard/index.vue) - this page is filters + table only.
export default {
  name: 'EntryList',
  components: { Page, EntryTable },
  data() {
    return {
      categories: [],
      scope: 'all',
      filter: {
        category: this.$route.query.category || undefined,
        security_tier: this.$route.query.security_tier || undefined,
        secret_age: this.$route.query.secret_age || undefined,
        // DRF's default SearchFilter query param - lets the Dashboard's
        // search bar deep-link straight into filtered results here.
        search: this.$route.query.search || undefined
      }
    }
  },
  computed: {
    tableQuery() {
      // el-select clearable emits '' (not undefined) when cleared, and
      // the initial route-query defaults above can be undefined - both
      // must be dropped, not sent, since URLSearchParams stringifies an
      // undefined value as the literal text "undefined" (rejected by the
      // backend ChoiceField as "not one of the available choices").
      const q = {}
      for (const [k, v] of Object.entries(this.filter)) {
        if (v !== undefined && v !== null && v !== '') q[k] = v
      }
      if (this.scope === 'favorites') q.favorites = 'true'
      return q
    },
    tableKey() {
      return JSON.stringify(this.tableQuery)
    }
  },
  created() {
    this.loadCategories()
  },
  methods: {
    async loadCategories() {
      const data = await this.$axios.get('/api/v1/repository/entries/summary/')
      this.categories = (data.by_category || []).filter((c) => c.count > 0)
    },
    reload() {
      this.$refs.table?.reload?.()
    }
  }
}
</script>

<style scoped>
.filters-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
</style>
