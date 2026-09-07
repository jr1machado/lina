<template>
  <div>
    <ListTable
      ref="collectionTable"
      :create-drawer="createDrawer"
      :detail-drawer="detailDrawer"
      :update-drawer="detailDrawer"
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
      // 2026-09-07, user request - clicking a collection (and its Edit
      // action) opens the tabbed detail view: edit form + credentials
      // that belong to it + "How to use" explainer.
      detailDrawer: () => import('./CollectionDetail/index.vue'),
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
              hasUpdate: true,
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
                  name: 'ToggleStatus',
                  title: ({ row }) => (row.status === 'DISABLED' ? this.$t('EnableCollection') : this.$t('DisableCollection')),
                  can: this.$hasPerm('repository.manage_repositorycollection'),
                  callback: ({ row }) => vm.toggleStatus(row)
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
    },
    async toggleStatus(row) {
      const action = row.status === 'DISABLED' ? 'enable' : 'disable'
      await this.$axios.post(`/api/v1/repository/collections/${row.id}/${action}/`)
      this.$message.success(action === 'enable' ? this.$t('CollectionEnabled') : this.$t('CollectionDisabled'))
      this.reload()
    }
  }
}
</script>
