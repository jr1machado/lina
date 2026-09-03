<template>
  <Page>
    <RotationPolicyTemplates @cloned="reload" />
    <RotationPolicyTable ref="table" />
  </Page>
</template>

<script>
import RotationPolicyTable from './RotationPolicyTable.vue'
import RotationPolicyTemplates from './RotationPolicyTemplates.vue'
import { Page } from '@/layout/components'

export default {
  name: 'RotationPolicyList',
  components: {
    Page,
    RotationPolicyTable,
    RotationPolicyTemplates
  },
  methods: {
    reload() {
      this.$refs.table?.reload?.()
    }
  }
}
</script>
