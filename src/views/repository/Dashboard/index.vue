<template>
  <Page>
    <!-- INFO/INSPI/cofre-senhas1.jpg - title/subtitle + search + primary
         action row, above the summary cards. -->
    <div class="dashboard-header">
      <div>
        <h2 class="dashboard-title">{{ $t('CredentialRepository') }}</h2>
        <p class="dashboard-subtitle">{{ $t('RepositoryManualAccessNotice') }}</p>
      </div>
    </div>
    <div class="search-row">
      <el-input
        v-model="searchQuery"
        :placeholder="$t('SearchCredentialsPlaceholder')"
        clearable
        @keyup.enter="runSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="$router.push({ name: 'RepositoryCredentialCreate' })">
        <el-icon><Plus /></el-icon>
        {{ $t('NewCredential') }}
      </el-button>
    </div>

    <div class="summary-cards">
      <IBox class="card accent-blue" @click="goCredentials({})">
        <el-icon class="card-icon"><Lock /></el-icon>
        <div class="card-body">
          <div class="card-value">{{ summary.total ?? '-' }}</div>
          <div class="card-label">{{ $t('TotalCredentials') }}</div>
        </div>
      </IBox>
      <IBox class="card accent-red" @click="goCredentials({ security_tier: 'TIER_0' })">
        <el-icon class="card-icon"><Warning /></el-icon>
        <div class="card-body">
          <div class="card-value">{{ summary.tier0 ?? '-' }}</div>
          <div class="card-label">Tier 0</div>
        </div>
      </IBox>
      <IBox class="card accent-orange" @click="$router.push({ name: 'RepositoryRequests' })">
        <el-icon class="card-icon"><Clock /></el-icon>
        <div class="card-body">
          <div class="card-value">{{ summary.pending_approvals ?? '-' }}</div>
          <div class="card-label">{{ $t('PendingApprovals') }}</div>
        </div>
      </IBox>
      <IBox class="card accent-gray" @click="goCredentials({ secret_age: 'gt90' })">
        <el-icon class="card-icon"><RefreshRight /></el-icon>
        <div class="card-body">
          <div class="card-value">{{ summary.over_90_days ?? '-' }}</div>
          <div class="card-label">{{ $t('Over90Days') }}</div>
        </div>
      </IBox>
    </div>

    <div class="home-layout">
      <div class="home-main">
        <IBox>
          <template #header>
            <div class="quick-access-header">
              <h5>{{ $t('QuickAccess') }}</h5>
              <el-button link type="primary" @click="goCredentials({})">
                {{ $t('ViewAllCredentials') }} ›
              </el-button>
            </div>
          </template>
          <el-tabs v-model="quickTab">
            <el-tab-pane :label="$t('Favorites')" name="favorites" />
            <el-tab-pane :label="$t('Recent')" name="recent" />
          </el-tabs>
          <EntryTable :key="quickTab" :extra-query="quickQuery" />
        </IBox>
      </div>

      <!-- "Insights acionaveis" (INFO/INSPI mockups) - only real, cheaply
           computed signals from summary(); never a fabricated number. -->
      <IBox :title="$t('ActionableInsights')" class="insights-box">
        <div v-if="summary.expiring_soon" class="insight-row" @click="goCredentials({})">
          <el-icon class="insight-icon warn"><Clock /></el-icon>
          <div>
            <div>{{ $t('CredentialsExpiringSoon', { n: summary.expiring_soon }) }}</div>
            <span class="insight-link">{{ $t('ViewCredentials') }} ›</span>
          </div>
        </div>
        <div v-if="summary.without_owner" class="insight-row" @click="goCredentials({})">
          <el-icon class="insight-icon"><User /></el-icon>
          <div>
            <div>{{ $t('CredentialsWithoutOwner', { n: summary.without_owner }) }}</div>
            <span class="insight-link">{{ $t('ViewCredentials') }} ›</span>
          </div>
        </div>
        <div v-if="summary.pending_approvals" class="insight-row" @click="$router.push({ name: 'RepositoryRequests' })">
          <el-icon class="insight-icon"><Bell /></el-icon>
          <div>
            <div>{{ $t('RequestsAwaiting', { n: summary.pending_approvals }) }}</div>
            <span class="insight-link">{{ $t('ViewRequests') }} ›</span>
          </div>
        </div>
        <!-- 2026-09-04 - weak/reused secret risk. Real, computed at
             set_secret() time (repository/secret_strength.py + an HMAC
             fingerprint keyed with the tenant KEK), never fabricated or
             decrypted just to display this count. -->
        <div v-if="summary.weak_secrets" class="insight-row warn" @click="goCredentials({ secret_is_weak: 'true' })">
          <el-icon class="insight-icon warn"><WarningFilled /></el-icon>
          <div>
            <div>{{ $t('WeakSecrets', { n: summary.weak_secrets }) }}</div>
            <span class="insight-link">{{ $t('ViewCredentials') }} ›</span>
          </div>
        </div>
        <div v-if="summary.reused_secrets" class="insight-row warn" @click="goCredentials({})">
          <el-icon class="insight-icon warn"><CopyDocument /></el-icon>
          <div>
            <div>{{ $t('ReusedSecrets', { n: summary.reused_secrets }) }}</div>
            <span class="insight-link">{{ $t('ViewCredentials') }} ›</span>
          </div>
        </div>
        <div v-if="summary.certs_expiring_60d" class="insight-row" @click="goCredentials({ category: 'CERTIFICATE' })">
          <el-icon class="insight-icon warn"><Calendar /></el-icon>
          <div>
            <div>{{ $t('CertsExpiring60d', { n: summary.certs_expiring_60d }) }}</div>
            <span class="insight-link">{{ $t('ViewCredentials') }} ›</span>
          </div>
        </div>
        <div v-if="summary.api_keys_no_expiration" class="insight-row" @click="goCredentials({ category: 'API_CREDENTIAL' })">
          <el-icon class="insight-icon"><QuestionFilled /></el-icon>
          <div>
            <div>{{ $t('APIKeysNoExpiration', { n: summary.api_keys_no_expiration }) }}</div>
            <span class="insight-link">{{ $t('ViewCredentials') }} ›</span>
          </div>
        </div>
        <div
          v-if="
            !summary.expiring_soon && !summary.without_owner && !summary.pending_approvals &&
              !summary.weak_secrets && !summary.reused_secrets &&
              !summary.certs_expiring_60d && !summary.api_keys_no_expiration
          "
          class="insight-empty"
        >
          {{ $t('NoActiveAlerts') }}
        </div>
      </IBox>
    </div>

    <!-- INFO/INSPI/cofre-senhas1.jpg - technology distribution as an
         icon row (not a bar chart) across the bottom of the dashboard. -->
    <IBox v-if="categories.length" :title="$t('TechnologyDistribution')" class="tech-distribution">
      <div class="tech-row">
        <div
          v-for="c in categories"
          :key="c.category"
          class="tech-item"
          @click="goCredentials({ category: c.category })"
        >
          <el-icon class="tech-icon"><component :is="categoryIcon(c.category)" /></el-icon>
          <div>
            <div class="tech-count">{{ c.count }}</div>
            <div class="tech-label">{{ c.category }}</div>
          </div>
        </div>
      </div>
    </IBox>
  </Page>
</template>

<script>
import EntryTable from '../Entry/EntryTable.vue'
import { Page } from '@/layout/components'
import { IBox } from '@/components'
import { categoryIcon } from '@/utils/repository/categoryIcons'

// 2026-09-04 - dashboard is now the module's landing page (INFO/INSPI
// mockups); the filterable full list moved to Entry/EntryList.vue
// ("Todas as credenciais" in the sidebar). Still a small hybrid home
// (cards + technology grouping + quick access), never a big analytics
// dashboard (S38 section 79: "Eu nao criaria dashboard analitico
// grande") - the quick-access table drills into the same EntryTable,
// never a second list implementation.
export default {
  name: 'RepositoryDashboard',
  components: { Page, IBox, EntryTable },
  data() {
    return {
      summary: {},
      categories: [],
      quickTab: 'favorites',
      searchQuery: ''
    }
  },
  computed: {
    quickQuery() {
      // ORDERING_PARAM is "order", not DRF's default "ordering" (see
      // jumpserver/settings/libs.py DEFAULT_FILTER_BACKENDS).
      return this.quickTab === 'favorites' ? { favorites: 'true' } : { order: '-date_updated' }
    }
  },
  created() {
    this.loadSummary()
  },
  methods: {
    async loadSummary() {
      const data = await this.$axios.get('/api/v1/repository/entries/summary/')
      this.summary = data
      this.categories = (data.by_category || []).filter((c) => c.count > 0)
    },
    goCredentials(filter) {
      this.$router.push({ name: 'RepositoryCredentials', query: filter })
    },
    categoryIcon,
    runSearch() {
      if (!this.searchQuery) return
      this.goCredentials({ search: this.searchQuery })
    }
  }
}
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 12px;
}
.dashboard-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
}
.dashboard-subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.search-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.search-row .el-input {
  max-width: 420px;
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.card {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  border-left: 3px solid transparent;
  transition: transform 0.15s ease;
}
.card:hover {
  transform: translateY(-1px);
}
.card.accent-blue {
  border-left-color: var(--el-color-primary);
}
.card.accent-red {
  border-left-color: var(--el-color-danger);
}
.card.accent-orange {
  border-left-color: var(--el-color-warning);
}
.card.accent-gray {
  border-left-color: var(--el-text-color-secondary);
}
.card-icon {
  font-size: 22px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}
.card.accent-blue .card-icon {
  color: var(--el-color-primary);
}
.card.accent-red .card-icon {
  color: var(--el-color-danger);
}
.card.accent-orange .card-icon {
  color: var(--el-color-warning);
}
.card-value {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}
.card-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.tech-distribution {
  margin-top: 16px;
}
.tech-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.tech-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: background 0.15s ease;
}
.tech-item:hover {
  background: var(--el-fill-color-light);
}
.tech-icon {
  font-size: 22px;
  color: var(--el-color-primary);
}
.tech-count {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}
.tech-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.quick-access-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.quick-access-header h5 {
  margin: 0;
}
.home-layout {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.home-main {
  flex: 1;
  min-width: 0;
}
.insights-box {
  width: 280px;
  flex-shrink: 0;
}
.insight-row {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  font-size: 13px;
}
.insight-row:last-child {
  border-bottom: none;
}
.insight-icon {
  font-size: 18px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  flex-shrink: 0;
}
.insight-icon.warn {
  color: var(--el-color-danger);
}
.insight-row.warn {
  background: var(--el-color-danger-light-9);
  margin: 0 -8px;
  padding: 10px 8px;
  border-radius: 4px;
}
.insight-link {
  color: var(--el-color-primary);
  font-size: 12px;
}
.insight-empty {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
@media (max-width: 960px) {
  .home-layout {
    flex-direction: column;
  }
  .insights-box {
    width: 100%;
  }
}
</style>
