import { getProfile as apiGetProfile, getLinaPreference, logout } from '@/api/users'
import {
  getCurrentOrgLocal,
  getPreOrgLocal,
  getTokenFromCookie,
  saveCurrentOrgLocal,
  setPreOrgLocal
} from '@/utils/jms/auth'
import orgUtil from '@/utils/jms/org'
import { resetRouter } from '@/router'
import { applyUiTheme } from '@/utils/theme'
import store from '@/store'
import _ from 'lodash'

const getDefaultState = () => {
  return {
    token: getTokenFromCookie(),
    currentOrg: '',
    preOrg: '',
    profile: {},
    username: '',
    auditOrgs: [],
    consoleOrgs: [],
    workbenchOrgs: [],
    noRootWorkbenchOrgs: [],
    usingOrgs: [],
    perms: [],
    MFAVerifyAt: null,
    isSuperAdmin: false,
    isOrgAdmin: false,
    isAdmin: false,
    hasAdminPerm: false,
    hasAuditPerm: false,
    // 2026-09-04 - user preference (users.Preference, category=lina,
    // basic.collapse_asset_tree - see profile/Preferences/Lina.vue).
    // Defaults to collapsed (true) for a less cluttered screen; fetched
    // once alongside the profile in getProfile() below, read directly by
    // Table/TreeTable (the single component behind every asset/type tree
    // in both admin and end-user views) instead of each page fetching it.
    collapseAssetTree: true,
    // 2026-09-04 - Web interface theme (users.Preference, category=lina,
    // basic.ui_theme). Distinct from the Luna *terminal window* theme
    // (users.const.Themes / preference/luna.py) - this one recolors the
    // Lina admin/operator interface itself via <html class="dark">
    // (default-theme.scss). 'default' | 'dark'.
    uiTheme: 'default'
  }
}

const state = getDefaultState()

const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState())
  },
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_PROFILE: (state, profile) => {
    state.profile = profile
    state.username = profile.username
    state.perms = profile.perms
    state.isSuperAdmin = profile['is_superuser']
    state.isOrgAdmin = profile['is_org_admin']
    state.consoleOrgs = profile['console_orgs']
    state.pamOrgs = profile['pam_orgs']
    state.workbenchOrgs = profile['workbench_orgs']
    state.noRootWorkbenchOrgs = profile['workbench_orgs'].filter((item) => {
      return item.id !== '00000000-0000-0000-0000-000000000000'
    })
    state.auditOrgs = profile['audit_orgs']
    state.currentOrg = getCurrentOrgLocal(profile.username)
    state.preOrg = getPreOrgLocal(profile.username)
  },
  SET_USING_ORGS: (state, orgs) => {
    state.usingOrgs = orgs
  },
  MODIFY_ORG: (state, org) => {
    state.consoleOrgs = state.consoleOrgs.map((oldOrg) => {
      if (oldOrg.id === org.id) {
        oldOrg.name = org.name
      }
      return oldOrg
    })
  },
  ADD_ORG: (state, org) => {
    state.consoleOrgs.push(org)
  },
  DELETE_ORG: (state, org) => {
    state.consoleOrgs = state.consoleOrgs.filter((i) => i.id !== org.id)
  },
  SET_CURRENT_ORG(state, org) {
    // 系统组织不设置成 Pre org
    const currentOrg = state.currentOrg
    if (currentOrg && !currentOrg.autoEnter && !currentOrg.is_system) {
      state.preOrg = currentOrg
      setPreOrgLocal(state.username, currentOrg)
    }
    state.currentOrg = org
    saveCurrentOrgLocal(state.username, org)
  },
  SET_MFA_VERIFY(state) {
    state.MFAVerifyAt = new Date().valueOf()
  },
  SET_COLLAPSE_ASSET_TREE(state, value) {
    state.collapseAssetTree = value
  },
  SET_UI_THEME(state, value) {
    state.uiTheme = value
  },
  ADD_WORKBENCH_ORGS(state, org) {
    state.workbenchOrgs.push(org)
  },
  SET_IS_FIRST_LOGIN(state, flag) {
    state.profile.is_first_login = flag
  }
}

const actions = {
  // get user Profile
  getProfile({ commit, state, dispatch }, refresh = false) {
    return new Promise((resolve, reject) => {
      if (!refresh && state.profile && Object.keys(state.profile).length > 0) {
        resolve(state.profile)
        return
      }
      apiGetProfile()
        .then((response) => {
          if (!response) {
            reject('Verification failed, please Login again.')
          }
          if (typeof response !== 'object') {
            // 后端 middleware 对 API 做了校验，这里返回可能是 302 重定向, response 为 string 类型
            resolve(response)
            return
          }
          commit('SET_PROFILE', response)
          dispatch('getCollapseAssetTreePreference')
          resolve(response)
        })
        .catch((error) => {
          // debug(error)
          reject(error)
        })
    })
  },
  // 2026-09-04 - fetched once alongside the profile, not per tree-table
  // mount. A failure here just keeps the default (collapsed) - never
  // blocks login/profile loading over a preferences fetch. Also applies
  // the saved Web interface theme (basic.ui_theme) from the same
  // response - one GET covers both preferences, no second network call.
  getCollapseAssetTreePreference({ commit }) {
    getLinaPreference()
      .then((data) => {
        const value = data?.basic?.collapse_asset_tree
        if (typeof value === 'boolean') {
          commit('SET_COLLAPSE_ASSET_TREE', value)
        }
        const theme = data?.basic?.ui_theme
        if (theme === 'dark' || theme === 'default') {
          commit('SET_UI_THEME', theme)
          applyUiTheme(theme)
        }
      })
      .catch(() => {})
  },
  addAdminOrg({ commit, state }, org) {
    commit('ADD_ORG', org)
  },
  deleteAdminOrg({ commit }, org) {
    commit('DELETE_ORG', org)
  },
  modifyOrg({ commit, state }, org) {
    commit('MODIFY_ORG', org)
  },
  // user logout
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      logout(state.token)
        .then(() => {
          // removeToken() // must remove  token  first
          resetRouter()
          commit('RESET_STATE')
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  setCurrentOrg({ commit }, data) {
    commit('SET_CURRENT_ORG', data)
  },
  enterSettingOrg({ commit }) {
    const systemOrg = {
      id: orgUtil.SYSTEM_ORG_ID,
      name: 'SystemSetting',
      is_system: true,
      autoEnter: new Date().getTime()
    }
    commit('SET_CURRENT_ORG', systemOrg)
  },
  leaveSettingOrg({ commit }) {
    const preOrg = store.state.users.preOrg
    if (!preOrg) {
      return
    }
    commit('SET_CURRENT_ORG', preOrg)
  },
  enterGlobalOrg({ commit }) {
    const globalOrg = {
      id: orgUtil.GLOBAL_ORG_ID,
      name: 'Global',
      is_root: true,
      autoEnter: new Date().getTime()
    }
    commit('SET_CURRENT_ORG', globalOrg)
  },
  leaveGlobalOrg({ commit }) {
    const preOrg = store.state.users.preOrg
    if (!preOrg) {
      return
    }
    commit('SET_CURRENT_ORG', preOrg)
  },
  setPreOrg({ commit }, data) {
    commit('SET_PRE_ORG', data)
  },
  currentUserJoinNewOrg({ state, commit }, users) {
    const { profile, currentOrg, workbenchOrgs } = state
    if (users.includes(profile.id)) {
      const currentOrgInfo = { id: currentOrg.id, name: currentOrg.name }
      const notExistInWorkbenchOrgs = _.find(workbenchOrgs, currentOrgInfo)
      if (!notExistInWorkbenchOrgs) {
        commit('ADD_WORKBENCH_ORGS', currentOrg)
      }
    }
  },
  setMFAVerify({ commit }) {
    commit('SET_MFA_VERIFY')
  },
  changeToView({ commit }, viewName) {
    const mapper = {
      console: state.consoleOrgs,
      audit: state.auditOrgs,
      workbench: state.workbenchOrgs,
      tickets: state.consoleOrgs,
      settings: state.consoleOrgs
    }
    const usingOrgs = mapper[viewName] || state.consoleOrgs
    console.debug('Set using orgs: ', viewName, usingOrgs)
    commit('SET_USING_ORGS', usingOrgs)
  },
  ifFirstLogin({ commit }, flag) {
    commit('SET_IS_FIRST_LOGIN', flag)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
