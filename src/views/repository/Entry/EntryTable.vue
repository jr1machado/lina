<template>
  <ListTable
    ref="entryTable"
    :header-actions="headerActions"
    :table-config="tableConfig"
    :resource="$t('Credentials')"
    @row-click="handleRowClick"
  />
  <EntryDeleteDialog v-model="deleteDialog" :entry="deleteTarget" @deleted="reload" />
  <EntryRequestDeleteDialog v-model="requestDeleteDialog" :entry="requestDeleteTarget" @requested="reload" />
</template>

<script>
import ListTable from '@/components/Table/ListTable'
import { ActionsFormatter } from '@/components/Table/TableFormatters'
import EntryDeleteDialog from './EntryDeleteDialog.vue'
import EntryRequestDeleteDialog from './EntryRequestDeleteDialog.vue'

export default {
  name: 'EntryTable',
  props: {
    // S38 section 6/80 - home cards/technology groups drill into the same
    // table via query params, never a second list implementation.
    extraQuery: { type: Object, default: () => ({}) }
  },
  components: { ListTable, EntryDeleteDialog, EntryRequestDeleteDialog },
  data() {
    const vm = this
    return {
      deleteDialog: false,
      deleteTarget: null,
      requestDeleteDialog: false,
      requestDeleteTarget: null,
      tableConfig: {
        url: this.buildUrl(),
        permissions: { app: 'repository', resource: 'repositoryentry' },
        columns: [
          'name', 'category', 'collection_name', 'security_tier', 'sensitivity', 'secret_age_days', 'status', 'actions'
        ],
        columnsMeta: {
          name: {
            width: '200px',
            formatterArgs: { route: 'RepositoryCredentialDetail' }
          },
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
                },
                {
                  name: 'Edit',
                  title: this.$t('Edit'),
                  can: this.$hasPerm('repository.change_repositoryentry'),
                  callback: ({ row }) => {
                    vm.$router.push({ name: 'RepositoryCredentialDetail', params: { id: row.id }, query: { edit: 1 } })
                  }
                },
                {
                  name: 'Clone',
                  title: this.$t('Clone'),
                  can: this.$hasPerm('repository.add_repositoryentry'),
                  callback: ({ row }) => vm.cloneEntry(row)
                },
                {
                  name: 'Disable',
                  title: this.$t('Disable'),
                  can: ({ row }) => row.status === 'ACTIVE' && this.$hasPerm('repository.disable_repositoryentry'),
                  callback: ({ row }) => vm.disableEntry(row)
                },
                // 2026-09-06 - deletion only offered once already disabled
                // (backend also enforces this - api/entry.py `delete`).
                // Tier 0 gets "Request deletion" (Approver Group workflow)
                // instead of the direct hard-delete dialog.
                {
                  name: 'Delete',
                  title: this.$t('Delete'),
                  type: 'danger',
                  can: ({ row }) => row.status === 'DISABLED' && row.security_tier !== 'TIER_0' &&
                    this.$hasPerm('repository.delete_repositoryentry'),
                  callback: ({ row }) => {
                    vm.deleteTarget = row
                    vm.deleteDialog = true
                  }
                },
                {
                  name: 'RequestDeletion',
                  title: this.$t('RequestDeletion'),
                  type: 'danger',
                  can: ({ row }) => row.status === 'DISABLED' && row.security_tier === 'TIER_0' &&
                    this.$hasPerm('repository.add_repositoryrequest'),
                  callback: ({ row }) => {
                    vm.requestDeleteTarget = row
                    vm.requestDeleteDialog = true
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
    },
    // 2026-09-06 - "clicar em qualquer parte da linha" - skip clicks that
    // landed on an interactive element in the actions cell so those keep
    // their own behavior instead of also navigating.
    handleRowClick(row, column, event) {
      if (event?.target?.closest('button, a, .el-dropdown, .el-icon, .el-switch')) return
      this.$router.push({ name: 'RepositoryCredentialDetail', params: { id: row.id } })
    },
    async disableEntry(row) {
      await this.$axios.post(`/api/v1/repository/entries/${row.id}/disable/`)
      this.$message.success(this.$t('CredentialDisabled'))
      this.reload()
    },
    // 2026-09-07 - full clone (metadata + username + password), done
    // server-side so the plaintext secret never passes through the
    // browser (see api/entry.py `clone`). Lands straight on the new
    // entry's detail page - nothing left for the user to fill in.
    async cloneEntry(row) {
      const data = await this.$axios.post(`/api/v1/repository/entries/${row.id}/clone/`)
      this.$message.success(this.$t('CredentialCloned'))
      this.$router.push({ name: 'RepositoryCredentialDetail', params: { id: data.id } })
    }
  }
}
</script>
