<template>
  <IBox>
    <GenericCreateUpdateForm v-bind="$data" :object="object" class="form" />
  </IBox>
</template>

<script>
import IBox from '@/components/Common/IBox'
import { GenericCreateUpdateForm } from '@/layout/components'
import { setUrlId } from '@/utils/common/index'

export default {
  name: 'Info',
  components: { IBox, GenericCreateUpdateForm },
  props: {
    object: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      url: '/api/v1/repository/collections/',
      hasDetailInMsg: false,
      submitMethod: () => 'patch',
      // same field set as the create form (CollectionCreateUpdate.vue) -
      // section 26/83: Approver Group set here, API rejects activating a
      // Tier 0/Tier 1 entry until it's a healthy one.
      fields: [[this.$t('Basic'), ['name', 'description', 'approver_group', 'status']]],
      onSubmit: this.submit
    }
  },
  methods: {
    submit(validValues) {
      const url = setUrlId(this.url, this.object.id)
      this.$axios.patch(url, validValues).then(() => {
        this.$message.success(this.$tc('UpdateSuccessMsg'))
      })
    }
  }
}
</script>
