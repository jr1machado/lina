import Layout from '@/layout'
import i18n from '@/i18n/i18n'

// Sprint_37-Cofre-Senhas.md section 4-6 - a top-level module, sibling to
// PAM/Auditoria (not nested under Settings), with exactly the four areas
// section 5 lists.
//
// 2026-09-04 fix - showNavSwitcher was wrongly copied from reports/index.js
// (false there because Reports is reached a different way, not via the
// top view switcher). PAM/Audit both set this true (or a truthy fn) -
// that boolean is literally what ViewSwitcher.vue's `views` computed
// filters on to decide which tabs render in the top nav bar
// (NavHeader/ViewSwitcher.vue). With it false, there was no click path
// into this module at all - only a typed URL got you in, so it looked
// completely absent from the interface even though every route/API
// underneath worked. Repository isn't org-scoped like PAM/Audit (no
// pamOrgs/auditOrgs-style membership check makes sense here), so a plain
// `true` is correct - visibility is already gated by
// meta.permissions below.
export default {
  path: '/credential-repository/',
  name: 'credential-repository',
  component: Layout,
  redirect: '/credential-repository/dashboard',
  meta: {
    title: i18n.t('CredentialRepository'),
    icon: 'lock',
    view: 'credential-repository',
    showNavSwitcher: true,
    permissions: ['repository.access_repository']
  },
  children: [
    {
      path: '/credential-repository/dashboard',
      name: 'RepositoryDashboard',
      component: () => import('@/views/repository/Dashboard/index.vue'),
      meta: {
        title: i18n.t('Dashboard'),
        icon: 'dashboard',
        permissions: ['repository.view_repositoryentry']
      }
    },
    {
      path: '/credential-repository/credentials',
      name: 'RepositoryCredentials',
      component: () => import('@/views/repository/Entry/EntryList.vue'),
      meta: {
        title: i18n.t('AllCredentials'),
        icon: 'accounts',
        permissions: ['repository.view_repositoryentry']
      }
    },
    {
      path: '/credential-repository/credentials/new',
      name: 'RepositoryCredentialCreate',
      component: () => import('@/views/repository/Entry/EntryCreateUpdate.vue'),
      hidden: true,
      meta: {
        title: i18n.t('NewCredential'),
        activeMenu: '/credential-repository/credentials',
        permissions: ['repository.add_repositoryentry']
      }
    },
    {
      path: '/credential-repository/credentials/:id',
      name: 'RepositoryCredentialDetail',
      component: () => import('@/views/repository/Entry/EntryDetail.vue'),
      hidden: true,
      meta: {
        title: i18n.t('CredentialDetail'),
        activeMenu: '/credential-repository/credentials',
        permissions: ['repository.view_repositoryentry']
      }
    },
    {
      path: '/credential-repository/collections',
      name: 'RepositoryCollections',
      component: () => import('@/views/repository/Collection/CollectionList.vue'),
      meta: {
        title: i18n.t('Collections'),
        icon: 'node',
        permissions: ['repository.view_repositorycollection']
      }
    },
    {
      path: '/credential-repository/requests',
      name: 'RepositoryRequests',
      component: () => import('@/views/repository/Request/RequestList.vue'),
      meta: {
        title: i18n.t('Requests'),
        icon: 'ticket',
        permissions: ['repository.view_repositoryrequest']
      }
    },
    {
      path: '/credential-repository/requests/:id',
      name: 'RepositoryRequestDetail',
      component: () => import('@/views/repository/Request/RequestDetail.vue'),
      hidden: true,
      meta: {
        title: i18n.t('RequestDetail'),
        activeMenu: '/credential-repository/requests',
        permissions: ['repository.view_repositoryrequest']
      }
    },
    {
      // 2026-09-04 - the module's "Relatorios" sidebar entry sends the
      // user straight into the platform's real Reports Center library
      // (console/reports-center/library), scoped to the 4 new
      // "Vault: ..." templates registered in risk/reports/registry.py -
      // that's the actual biblioteca de relatorios/agendamentos/historico
      // system (this is a redirect, not a separate report engine: the
      // apps/reports "RepositoryGovernanceReport" type below is a second,
      // independent integration kept for completeness but not linked
      // from here to avoid two different "Reports" UIs in the same menu).
      path: '/credential-repository/reports',
      name: 'RepositoryReports',
      redirect: '/console/reports-center/library',
      meta: {
        title: i18n.t('Reports'),
        icon: 'reports',
        permissions: ['risk.view_reports_center']
      }
    },
    {
      path: '/credential-repository/reports/governance',
      name: 'RepositoryGovernanceReport',
      component: () => import('@/views/repository/Reports/Governance.vue'),
      hidden: true,
      meta: {
        title: i18n.t('RepositoryGovernanceReport'),
        activeMenu: '/credential-repository/reports',
        permissions: ['rbac.view_repositorygovernancereport']
      }
    },
    {
      path: '/credential-repository/audit',
      name: 'RepositoryAudit',
      component: () => import('@/views/repository/Audit/AuditList.vue'),
      meta: {
        title: i18n.t('Audit'),
        icon: 'audit',
        permissions: ['repository.view_repository_audit']
      }
    },
    {
      path: '/credential-repository/help',
      name: 'RepositoryHelp',
      component: () => import('@/views/repository/Help/HelpPage.vue'),
      meta: {
        title: i18n.t('HowToUse'),
        icon: 'help',
        permissions: []
      }
    }
  ]
}
