import i18n from '@/i18n/i18n'

export default [
  {
    path: 'library',
    name: 'ReportLibrary',
    component: () => import('@/views/reports_center/ReportLibrary/index.vue'),
    meta: {
      title: i18n.t('Report Library'),
      permissions: ['risk.view_reports_center']
    }
  },
  {
    path: 'schedules',
    name: 'MySchedules',
    component: () => import('@/views/reports_center/MySchedules/index.vue'),
    meta: {
      title: i18n.t('My Schedules'),
      permissions: ['risk.view_reportschedule']
    }
  },
  {
    path: 'history',
    name: 'ReportHistory',
    component: () => import('@/views/reports_center/ReportHistory/index.vue'),
    meta: {
      title: i18n.t('Report History'),
      permissions: ['risk.view_report_history']
    }
  },
  {
    path: 'branding',
    name: 'ReportBranding',
    component: () => import('@/views/reports_center/ReportBranding/index.vue'),
    meta: {
      title: i18n.t('Report Branding'),
      permissions: ['risk.view_report_branding']
    }
  }
]
