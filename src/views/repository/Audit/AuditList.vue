<template>
  <Page>
    <ListTable
      ref="auditTable"
      :header-actions="headerActions"
      :table-config="tableConfig"
      :resource="$t('Audit')"
    />
  </Page>
</template>

<script>
import ListTable from '@/components/Table/ListTable'
import { Page } from '@/layout/components'

export default {
  name: 'AuditList',
  components: { Page, ListTable },
  data() {
    return {
      tableConfig: {
        url: '/api/v1/repository/audit/',
        permissions: { app: 'repository', resource: 'repositoryentry' },
        columns: ['datetime', 'user', 'resource_type', 'resource', 'remote_addr'],
        columnsMeta: {
          datetime: { label: this.$t('Timestamp'), width: '180px' },
          resource_type: { label: this.$t('Event') },
          resource: { label: this.$t('Resource') },
          remote_addr: { label: this.$t('SourceIP') }
        }
      },
      headerActions: {
        hasRefresh: true,
        hasImport: false,
        hasExport: false, // section 76 - export is metadata/audit report only, handled by Reports Center
        hasCreate: false,
        hasBulkDelete: false,
        hasMoreActions: false
      }
    }
  }
}
</script>
