<template>
  <ListTable
    ref="table"
    :header-actions="headerActions"
    :table-config="tableConfig"
    :resource="$t('TOTPSeedExport')"
  />
</template>

<script>
import ListTable from '@/components/Table/ListTable'
import { ActionsFormatter } from '@/components/Table/TableFormatters'

// Sprint_39-B-TOTP-Seed-Export.md section 47/107 - "Administration ->
// Approvals -> TOTP Seed Export" (this codebase's Requests page already
// lives at module level rather than under a separate Administration
// area, so this mirrors that same placement - Request/RequestTable.vue).
export default {
  name: 'SeedExportTable',
  components: { ListTable },
  data() {
    const vm = this
    return {
      tableConfig: {
        url: '/api/v1/repository/seed-export-requests/',
        permissions: { app: 'repository', resource: 'totpseedexportrequest' },
        columns: ['entry_name', 'requested_by_name', 'export_format', 'status', 'approvals_count', 'date_created', 'actions'],
        columnsMeta: {
          entry_name: { label: this.$t('Credential'), width: '200px' },
          requested_by_name: { label: this.$t('Requester') },
          export_format: { label: this.$t('Format') },
          approvals_count: { label: this.$t('Approvals') },
          date_created: { label: this.$t('Requested') },
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
                    vm.$router.push({ name: 'RepositorySeedExportDetail', params: { id: row.id } })
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
        hasExport: false,
        hasCreate: false, // requests are created from the credential detail page
        hasBulkDelete: false,
        hasMoreActions: false
      }
    }
  },
  methods: {
    reload() {
      this.$refs.table?.reloadTable?.()
    }
  }
}
</script>
