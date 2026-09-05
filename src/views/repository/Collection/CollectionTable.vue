<template>
  <div>
    <ListTable
      ref="collectionTable"
      :create-drawer="createDrawer"
      :detail-drawer="createDrawer"
      :header-actions="headerActions"
      :table-config="tableConfig"
      :resource="$t('Collections')"
    />
    <CollectionAccessDialog v-model="accessDialog" :collection="accessTarget" />
    <CollectionDeleteDialog v-model="deleteDialog" :collection="deleteTarget" @deleted="reload" />
  </div>
</template>

<script>
import ListTable from '@/components/Table/DrawerListTable'
import { ActionsFormatter } from '@/components/Table/TableFormatters'
import CollectionAccessDialog from './CollectionAccessDialog.vue'
import CollectionDeleteDialog from './CollectionDeleteDialog.vue'

export default {
  name: 'CollectionTable',
  components: { ListTable, CollectionAccessDialog, CollectionDeleteDialog },
  data() {
    const vm = this
    return {
      createDrawer: () => import('./CollectionCreateUpdate.vue'),
      accessDialog: false,
      accessTarget: null,
      deleteDialog: false,
      deleteTarget: null,
      tableConfig: {
        url: '/api/v1/repository/collections/',
        permissions: { app: 'repository', resource: 'repositorycollection' },
        columns: [
          'name', 'approver_group_name', 'requires_approval_workflow', 'entries_amount', 'status', 'actions'
        ],
        columnsMeta: {
          name: { width: '220px' },
          approver_group_name: { label: this.$t('ApproverGroup') },
          requires_approval_workflow: { label: this.$t('ApprovalRequired') },
          entries_amount: { label: this.$t('CredentialsAmount') },
          actions: {
            formatter: ActionsFormatter,
            formatterArgs: {
              hasClone: false,
              hasDelete: false,
              hasUpdate: false,
              extraActions: [
                {
                  name: 'Access',
                  title: this.$t('CollectionAccess'),
                  can: this.$hasPerm('repository.manage_repositoryaccess'),
                  callback: ({ row }) => {
                    vm.accessTarget = row
                    vm.accessDialog = true
                  }
                },
                {
                  name: 'Delete',
                  title: this.$t('DeleteCollection'),
                  type: 'danger',
                  can: this.$hasPerm('repository.manage_repositorycollection'),
                  callback: ({ row }) => {
                    vm.deleteTarget = row
                    vm.deleteDialog = true
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
        hasBulkDelete: false,
        hasMoreActions: false
      }
    }
  },
  methods: {
    reload() {
      this.$refs.collectionTable?.reloadTable?.()
    }
  }
}
</script>
