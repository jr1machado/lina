<template>
  <GenericCreateUpdatePage v-bind="$data" />
</template>

<script>
import GenericCreateUpdatePage from '@/layout/components/GenericCreateUpdatePage'

export default {
  name: 'RotationPolicyCreateUpdate',
  components: {
    GenericCreateUpdatePage
  },
  data() {
    return {
      initial: {
        is_active: true,
        periodic_rotation: true,
        rotation_interval_days: 30,
        rotate_after_use: true,
        rotate_after_incident: true
      },
      url: '/api/v1/accounts/rotation-policies/',
      hasDetailInMsg: false,
      fields: [
        [this.$t('Basic'), ['name', 'description', 'is_active']],
        [
          this.$t('Rotation'),
          ['periodic_rotation', 'rotation_interval_days', 'rotate_after_use', 'rotate_after_incident']
        ]
      ]
    }
  }
}
</script>
