import Layout from '@/layout'
import i18n from '@/i18n/i18n'

import SessionRoutes from './sessions'
import LogRoutes from './audits'
import JobRoutes from './jobs'
import ReportsRoutes from './reports'
import TicketRoutes from './tickets'
import empty from '@/layout/empty'
import store from '@/store'

export default {
  path: '/audit/',
  name: 'audit',
  component: Layout,
  redirect: '/audit/dashboard',
  meta: {
    title: i18n.t('Audits'),
    icon: 'audit',
    showNavSwitcher: () => {
      return store.getters.auditOrgs.length > 0
    },
    permissions: [],
    view: 'audit'
  },
  children: [
    {
      path: '/audit/dashboard',
      component: () => import('@/views/dashboard/Audit/index'),
      name: 'AuditDashboard',
      meta: {
        icon: 'dashboard',
        title: i18n.t('Dashboard'),
        permissions: []
      }
    },
    {
      path: '/audit/sessions',
      component: empty,
      name: 'AuditSessions',
      redirect: '/audit/sessions/sessions',
      meta: {
        title: i18n.t('SessionsAudit'),
        icon: 'session',
        permissions: []
      },
      children: SessionRoutes
    },
    {
      path: '/audit/audits',
      component: empty,
      redirect: '',
      name: 'Audits',
      meta: {
        title: i18n.t('LogsAudit'),
        icon: 'log',
        permissions: []
      },
      children: LogRoutes
    },
    {
      path: '/audit/jobs',
      component: empty,
      redirect: '',
      name: 'AuditsJobs',
      meta: {
        title: i18n.t('JobsAudit'),
        icon: 'job',
        permissions: ['audits.view_joblog']
      },
      children: JobRoutes
    },
    {
      path: '/audit/tickets',
      component: empty,
      redirect: '',
      name: 'TicketRoutes',
      meta: {
        title: i18n.t('TicketsAudit'),
        icon: 'job',
        permissions: ['tickets.view_ticket']
      },
      children: TicketRoutes
    },
    {
      path: '/audit/reports',
      component: empty,
      redirect: '',
      name: 'AuditsReports',
      meta: {
        // Not an xpack feature: not in rbac/tree.py's xpack_nodes, no
        // backend XPACK_ENABLED gate in the reports app, and the builtin
        // Auditor role (rbac/builtin.py) is granted these report
        // permissions unconditionally as core CE functionality -
        // licenseRequired:true hid a working, permitted screen.
        title: i18n.t('Report'),
        icon: 'report',
        permissions: []
      },
      children: ReportsRoutes
    }
  ]
}
