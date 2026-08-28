import Layout from '@/layout/index'
import i18n from '@/i18n/i18n'
import empty from '@/layout/empty'
import store from '@/store'

import UsersMenu from './users'
import AssetsMenu from './assets'
import PermsMenu from './perms'
import AccountMenus from './accounts'
import LabelMenus from './labels'
import ReportsCenterMenu from './reports_center'

export default {
  path: '/console',
  component: Layout,
  name: 'console',
  redirect: '/console/dashboard',
  meta: {
    title: i18n.t('Console'),
    icon: 'console',
    view: 'console',
    type: 'view',
    showNavSwitcher: () => {
      return store.getters.consoleOrgs.length > 0
    },

    permissions: []
  },
  children: [
    {
      path: '/console/dashboard',
      component: empty,
      name: 'Dashboard',
      redirect: { name: 'AdminDashboard' },
      meta: {
        icon: 'dashboard',
        title: i18n.t('Dashboard'),
        permissions: []
      },
      children: [
        {
          path: 'overview',
          component: () => import('@/views/dashboard/Console/index.vue'),
          name: 'AdminDashboard',
          meta: {
            title: i18n.t('Overview'),
            permissions: []
          }
        },
        {
          path: 'identity-risk',
          component: () => import('@/views/dashboard/IdentityRisk/index.vue'),
          name: 'IdentityRiskDashboard',
          meta: {
            title: i18n.t('Identity Risk'),
            permissions: ['risk.view_risk_dashboard']
          }
        },
        {
          path: 'kri',
          component: () => import('@/views/dashboard/KRI/index.vue'),
          name: 'KRIDashboard',
          meta: {
            title: i18n.t('KRI'),
            permissions: ['risk.view_kri_dashboard']
          }
        }
      ]
    },
    {
      path: '/console/users',
      component: empty,
      name: 'Users',
      meta: {
        title: i18n.t('MenuUsers'),
        icon: 'users'
      },
      children: UsersMenu
    },
    {
      path: '/console/assets',
      component: empty,
      name: 'Assets',
      meta: {
        title: i18n.t('MenuAssets'),
        icon: 'assets'
      },
      children: AssetsMenu
    },
    {
      path: '/console/accounts',
      component: empty,
      name: 'Accounts',
      meta: {
        title: i18n.t('MenuAccounts'),
        icon: 'key'
      },
      children: AccountMenus
    },
    {
      path: '/console/reports-center',
      component: empty,
      name: 'ReportsCenter',
      redirect: { name: 'ReportLibrary' },
      meta: {
        title: i18n.t('Reports'),
        icon: 'file'
      },
      children: ReportsCenterMenu
    },
    {
      path: '/console/perms',
      component: empty,
      name: 'Perms',
      meta: {
        title: i18n.t('MenuPermissions'),
        icon: 'permission',
        resource: 'assetpermission',
        permissions: []
      },
      children: PermsMenu
    },
    {
      path: '/console/more',
      component: empty,
      name: 'ConsoleMore',
      meta: {
        title: i18n.t('MenuMore'),
        icon: 'more'
      },
      children: LabelMenus
    }
  ]
}
