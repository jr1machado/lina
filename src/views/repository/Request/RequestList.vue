<template>
  <Page>
    <RequestTable ref="table" />
  </Page>
</template>

<script>
import RequestTable from './RequestTable.vue'
import { Page } from '@/layout/components'

export default {
  name: 'RequestList',
  components: { Page, RequestTable },
  methods: {
    reload() {
      this.$refs.table?.reload?.()
    }
  }
}
</script>
