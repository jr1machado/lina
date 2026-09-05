<template>
  <GenericCreateUpdatePage v-bind="$data" />
</template>

<script>
import GenericCreateUpdatePage from '@/layout/components/GenericCreateUpdatePage'

export default {
  name: 'CollectionCreateUpdate',
  components: { GenericCreateUpdatePage },
  data() {
    return {
      url: '/api/v1/repository/collections/',
      hasDetailInMsg: false,
      // section 26/83 - Approver Group is set here; the API rejects
      // activating a Tier 0/Tier 1 entry until it's a healthy one.
      fields: [[this.$t('Basic'), ['name', 'description', 'approver_group', 'status']]]
    }
  }
}
</script>
