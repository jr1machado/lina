<template>
  <ListTable
    ref="requestTable"
    :header-actions="headerActions"
    :table-config="tableConfig"
    :resource="$t('Requests')"
  />
</template>

<script>
import ListTable from '@/components/Table/ListTable'
import { ActionsFormatter } from '@/components/Table/TableFormatters'

export default {
  name: 'RequestTable',
  components: { ListTable },
  data() {
    const vm = this
    return {
      tableConfig: {
        url: '/api/v1/repository/requests/',
        permissions: { app: 'repository', resource: 'repositoryrequest' },
        columns: ['entry_name', 'action_type', 'tier', 'collection_name', 'requester_name', 'status', 'date_created', 'actions'],
        columnsMeta: {
          entry_name: { label: this.$t('Credential'), width: '200px' },
          action_type: { label: this.$t('RequestType') },
          requester_name: { label: this.$t('Requester') },
          collection_name: { label: this.$t('Collection') },
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
                    vm.$router.push({ name: 'RepositoryRequestDetail', params: { id: row.id } })
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
        hasCreate: false, // requests are created from the credential detail page (section 22)
        hasBulkDelete: false,
        hasMoreActions: false
      }
    }
  },
  methods: {
    reload() {
      this.$refs.requestTable?.reloadTable?.()
    }
  }
}
</script>
