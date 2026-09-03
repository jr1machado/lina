<template>
  <div>
    <ListTable
      ref="policyTable"
      :create-drawer="createDrawer"
      :detail-drawer="createDrawer"
      :header-actions="headerActions"
      :table-config="tableConfig"
      :resource="$t('RotationPolicy')"
    />
    <AssignAccountsDialog
      v-model="showAssignDialog"
      :policy="assignTarget"
      @assigned="reload"
    />
  </div>
</template>

<script>
import ListTable from '@/components/Table/DrawerListTable'
import { ActionsFormatter } from '@/components/Table/TableFormatters'
import AssignAccountsDialog from './AssignAccountsDialog.vue'

export default {
  name: 'RotationPolicyTable',
  components: {
    ListTable,
    AssignAccountsDialog
  },
  data() {
    const vm = this
    return {
      createDrawer: () => import('./RotationPolicyCreateUpdate.vue'),
      showAssignDialog: false,
      assignTarget: {},
      tableConfig: {
        url: '/api/v1/accounts/rotation-policies/',
        // getResourceNameByPath() (utils/jms) only strips a trailing "s"
        // to singularize the last URL segment - "policies" -> "policie"
        // instead of "policy", so the auto-derived add/change/delete/view
        // permission strings never matched accounts.*_rotationpolicy and
        // every action silently showed "No permissions". Passing this
        // explicitly bypasses that derivation entirely.
        permissions: { app: 'accounts', resource: 'rotationpolicy' },
        columns: [
          'name', 'is_active', 'periodic_rotation', 'rotation_interval_days',
          'rotate_after_use', 'rotate_after_incident', 'accounts_amount', 'actions'
        ],
        columnsMeta: {
          name: { width: '200px' },
          accounts_amount: { label: this.$t('AccountsAssigned') },
          actions: {
            formatter: ActionsFormatter,
            formatterArgs: {
              hasUpdate: this.$hasPerm('accounts.change_rotationpolicy'),
              hasDelete: this.$hasPerm('accounts.delete_rotationpolicy'),
              hasClone: false,
              extraActions: [
                {
                  name: 'Assign',
                  title: this.$t('AssignAccounts'),
                  can: this.$hasPerm('accounts.assign_rotationpolicy'),
                  callback: ({ row }) => {
                    vm.assignTarget = row
                    vm.showAssignDialog = true
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
        hasMoreActions: false,
        hasLabelSearch: false
      }
    }
  },
  methods: {
    reload() {
      this.$refs.policyTable?.reloadTable?.()
    }
  }
}
</script>
