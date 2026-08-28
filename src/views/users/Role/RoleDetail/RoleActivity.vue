<template>
  <div>
    <div v-loading="loading">
      <GenericListPage :header-actions="headerActions" :table-config="tableConfig" />
    </div>
    <DiffDetail ref="DetailDialog" :title="$tc('OperateLog')" />
  </div>
</template>

<script>
import GenericListPage from '@/layout/components/GenericListPage'
import { ActionsFormatter } from '@/components/Table/TableFormatters'
import DiffDetail from '@/components/Dialog/DiffDetail'

// S08A §14, §44 - reuses the native OperateLog list/diff-detail exactly as
// AccountActivityList.vue does for Account (`resource_type` filter only,
// same as that component - `resource_id` isn't a filterable field on
// OperateLog today, see apps/audits/filters.py).
export default {
  name: 'RoleActivity',
  components: {
    GenericListPage,
    DiffDetail
  },
  props: {
    object: {
      type: Object,
      required: true
    }
  },
  data() {
    const vm = this
    return {
      loading: false,
      tableConfig: {
        url: '/api/v1/audits/operate-logs/?resource_type=Role',
        columnsShow: {
          min: ['user', 'resource'],
          default: ['user', 'action_display', 'resource', 'remote_addr', 'datetime', 'actions']
        },
        columnsMeta: {
          actions: {
            formatter: ActionsFormatter,
            formatterArgs: {
              hasUpdate: false,
              hasDelete: false,
              hasClone: false,
              extraActions: [
                {
                  name: 'View',
                  title: this.$t('View'),
                  type: 'primary',
                  callback: ({ row }) => {
                    vm.loading = true
                    this.$axios
                      .get(`/api/v1/audits/operate-logs/${row.id}/?type=action_detail`)
                      .then((res) => {
                        this.$refs.DetailDialog.show(res.diff)
                      })
                      .finally(() => {
                        vm.loading = false
                      })
                  }
                }
              ]
            }
          }
        }
      },
      headerActions: {
        hasLeftActions: false,
        hasImport: false,
        hasDatePicker: true,
        searchConfig: {
          exclude: ['resource_type', 'action']
        }
      }
    }
  }
}
</script>
