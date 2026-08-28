<template>
  <TwoCol>
    <DrawerListTable
      :detail-drawer="detailDrawer"
      :header-actions="headerActions"
      :table-config="tableConfig"
      :resource="$t('AssetPermissionRules')"
    />
  </TwoCol>
</template>

<script>
import { DrawerListTable } from '@/components'
import {
  AssetPermissionTableMeta,
  UserAssetPermissionListPageSearchConfigOptions
} from '@/views/perms/const'
import TwoCol from '@/layout/components/Page/TwoColPage.vue'

export default {
  // S27 - "Autorizações atribuídas": consolidated, read-only view of every
  // Asset Permission ("Ativos de Autorização") granted directly to this
  // Group. Same data/endpoint as the Asset Permission list, just scoped
  // by user_group_id - never a separately-maintained copy of the rule.
  name: 'GroupAssignedAuthorizations',
  components: {
    TwoCol,
    DrawerListTable
  },
  props: {
    object: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      detailDrawer: () => import('@/views/perms/AssetPermission/AssetPermissionDetail/index.vue'),
      tableConfig: {
        url: `/api/v1/perms/asset-permissions/?user_group_id=${this.object.id}`,
        hasTree: true,
        columnsExtra: ['action'],
        columnsShow: {
          min: ['name', 'actions'],
          default: [
            'name',
            'users_amount',
            'user_groups_amount',
            'assets_amount',
            'nodes_amount',
            'accounts',
            'actions'
          ]
        },
        columnsMeta: AssetPermissionTableMeta
      },
      headerActions: {
        hasLeftActions: false,
        hasCreate: false,
        hasExport: false,
        hasImport: false,
        searchConfig: {
          url: '',
          options: UserAssetPermissionListPageSearchConfigOptions
        }
      }
    }
  }
}
</script>
