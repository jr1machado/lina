<template>
  <GenericDetailPage
    v-bind="config"
    v-model:active-menu="config.activeMenu"
    v-model:object="object"
  >
    <keep-alive>
      <component :is="config.activeMenu" :object="object" />
    </keep-alive>
  </GenericDetailPage>
</template>

<script>
// 2026-09-07, user request - collection detail gains tabs: edit (existing
// fields), the credentials that belong to it, and a "How to use" tab
// explaining what a Collection is (reuses the same i18n copy as the
// module Help page - one source of truth, see HelpPage.vue).
import { GenericDetailPage, TabPage } from '@/layout/components'
import Info from './Info.vue'
import Entries from './Entries.vue'
import HowTo from './HowTo.vue'

export default {
  components: { GenericDetailPage, TabPage, Info, Entries, HowTo },
  data() {
    return {
      object: {},
      config: {
        url: '/api/v1/repository/collections',
        activeMenu: 'Info',
        submenu: [
          { title: this.$t('Basic'), name: 'Info' },
          { title: this.$t('Credentials'), name: 'Entries' },
          { title: this.$t('HowToUse'), name: 'HowTo' }
        ]
      }
    }
  }
}
</script>
