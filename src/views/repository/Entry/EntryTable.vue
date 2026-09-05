<template>
  <ListTable
    ref="entryTable"
    :header-actions="headerActions"
    :table-config="tableConfig"
    :resource="$t('Credentials')"
  />
</template>

<script>
import ListTable from '@/components/Table/ListTable'
import { ActionsFormatter } from '@/components/Table/TableFormatters'

export default {
  name: 'EntryTable',
  props: {
    // S38 section 6/80 - home cards/technology groups drill into the same
    // table via query params, never a second list implementation.
    extraQuery: { type: Object, default: () => ({}) }
  },
  components: { ListTable },
  data() {
    const vm = this
    return {
      tableConfig: {
        url: this.buildUrl(),
        permissions: { app: 'repository', resource: 'repositoryentry' },
        columns: [
          'name', 'category', 'collection_name', 'security_tier', 'sensitivity', 'secret_age_days', 'status', 'actions'
        ],
        columnsMeta: {
          name: { width: '200px' },
          category: { label: this.$t('Category') },
          security_tier: { label: this.$t('Tier') },
          sensitivity: { label: this.$t('Sensitivity') },
          secret_age_days: { label: this.$t('SecretAge') },
          collection_name: { label: this.$t('Collection') },
          actions: {
            formatter: ActionsFormatter,
            formatterArgs: {
              hasClone: false,
              hasDelete: false,
              hasUpdate: false,
              extraActions: [
                {
                  name: 'Open',
                  title: this.$t('Open'),
                  can: true,
                  callback: ({ row }) => {
                    vm.$router.push({ name: 'RepositoryCredentialDetail', params: { id: row.id } })
                  }
                }
              ]
            }
          }
        }
      },
      headerActions: {
        hasRefresh: true,
        hasImport: false,
        hasExport: false, // section 78 - export is metadata/audit only, never here
        hasBulkDelete: false, // section 79-80 - no bulk actions on credentials
        hasMoreActions: false,
        onCreate: () => this.$router.push({ name: 'RepositoryCredentialCreate' })
      }
    }
  },
  methods: {
    buildUrl() {
      const params = new URLSearchParams(this.extraQuery || {}).toString()
      return params ? `/api/v1/repository/entries/?${params}` : '/api/v1/repository/entries/'
    },
    reload() {
      this.$refs.entryTable?.reloadTable?.()
    }
  }
}
</script>
