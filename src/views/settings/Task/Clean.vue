<template>
  <IBox>
    <GenericCreateUpdateForm v-bind="$data" />
  </IBox>
</template>

<script>
import { CronTab, IBox } from '@/components'
import { GenericCreateUpdateForm } from '@/layout/components'

export default {
  name: 'Senior',
  components: {
    IBox,
    GenericCreateUpdateForm
  },
  data() {
    return {
      url: '/api/v1/settings/setting/?category=clean',
      hasDetailInMsg: false,
      helpText: this.$t('CleanHelpText'),
      fields: [
        [
          this.$t('Logging'),
          [
            'LOGIN_LOG_KEEP_DAYS',
            'TASK_LOG_KEEP_DAYS',
            'OPERATE_LOG_KEEP_DAYS',
            'PASSWORD_CHANGE_LOG_KEEP_DAYS',
            'FTP_LOG_KEEP_DAYS',
            'TERMINAL_SESSION_KEEP_DURATION',
            'ACTIVITY_LOG_KEEP_DAYS'
          ]
        ],
        [
          this.$t('RetentionByCriticality'),
          [
            'REPLAY_KEEP_DAYS_CRITICAL',
            'REPLAY_KEEP_DAYS_NONCRITICAL',
            'COMMAND_KEEP_DAYS_CRITICAL',
            'COMMAND_KEEP_DAYS_NONCRITICAL'
          ]
        ],
        [
          this.$t('Database'),
          [
            'JOB_EXECUTION_KEEP_DAYS',
            'CLOUD_SYNC_TASK_EXECUTION_KEEP_DAYS',
            'ACCOUNT_CHANGE_SECRET_RECORD_KEEP_DAYS'
          ]
        ]
      ],
      fieldsMeta: {
        AUTH_LDAP_SYNC_CRONTAB: {
          component: CronTab,
          label: this.$t('Crontab'),
          helpText: this.$t('CrontabOfCreateUpdatePage')
        }
      },
      submitMethod() {
        return 'patch'
      }
    }
  },
  methods: {}
}
</script>

<style scoped></style>
