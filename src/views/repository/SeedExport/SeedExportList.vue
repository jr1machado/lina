<template>
  <Page>
    <SeedExportTable ref="table" />
  </Page>
</template>

<script>
import SeedExportTable from './SeedExportTable.vue'
import { Page } from '@/layout/components'

export default {
  name: 'SeedExportList',
  components: { Page, SeedExportTable },
  methods: {
    reload() {
      this.$refs.table?.reload?.()
    }
  }
}
</script>
