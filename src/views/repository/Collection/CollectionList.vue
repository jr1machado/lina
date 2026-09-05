<template>
  <Page>
    <CollectionTable ref="table" />
  </Page>
</template>

<script>
import CollectionTable from './CollectionTable.vue'
import { Page } from '@/layout/components'

export default {
  name: 'CollectionList',
  components: { Page, CollectionTable },
  methods: {
    reload() {
      this.$refs.table?.reload?.()
    }
  }
}
</script>
