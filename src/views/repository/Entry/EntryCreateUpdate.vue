<template>
  <Page>
    <div class="create-layout">
    <IBox :title="$t('NewCredential')" class="create-form-box">
      <el-form label-position="top">
        <h4><el-icon><User /></el-icon>{{ $t('Identification') }}</h4>
        <el-form-item :label="$t('Name')" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('Category')" required>
          <div class="category-picker">
            <div
              v-for="c in categories"
              :key="c"
              :class="['category-tile', { active: form.category === c }]"
              @click="form.category = c"
            >
              <el-icon class="category-tile-icon"><component :is="categoryIcon(c)" /></el-icon>
              <span>{{ categoryLabelOf(c) }}</span>
            </div>
          </div>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item :label="$t('Manufacturer')">
              <el-input v-model="form.manufacturer" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('Product')">
              <el-input v-model="form.product" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('Collection')" required>
          <el-select v-model="form.collection" filterable style="width: 100%">
            <el-option v-for="c in collections" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>

        <h4><el-icon><Lock /></el-icon>{{ $t('CredentialData') }}</h4>
        <template v-if="form.category === 'SNMP'">
          <el-form-item :label="$t('SNMPVersion')" required>
            <el-select v-model="form.category_fields.snmp_version" style="width: 100%">
              <el-option label="SNMPv1" value="V1" />
              <el-option label="SNMPv2c" value="V2C" />
              <el-option label="SNMPv3" value="V3" />
            </el-select>
          </el-form-item>
          <el-alert
            v-if="['V1', 'V2C'].includes(form.category_fields.snmp_version)"
            type="warning" :closable="false" show-icon class="legacy-alert"
            :title="$t('SNMPLegacyWarning')"
          />
          <el-form-item :label="$t('Target')">
            <el-input v-model="form.category_fields.target" />
          </el-form-item>
          <el-form-item :label="$t('AuthorizedCollectorIPs')">
            <el-input v-model="collectorIpsText" type="textarea" :rows="2" :placeholder="'10.20.30.0/24'" />
          </el-form-item>
          <template v-if="form.category_fields.snmp_version === 'V3'">
            <el-form-item :label="$t('Username')">
              <el-input v-model="form.username" />
            </el-form-item>
            <el-form-item :label="$t('SecurityLevel')">
              <el-select v-model="form.category_fields.snmpv3_security_level" style="width: 100%">
                <el-option label="noAuthNoPriv" value="noAuthNoPriv" />
                <el-option label="authNoPriv" value="authNoPriv" />
                <el-option label="authPriv" value="authPriv" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('AuthenticationSecret')">
              <el-input v-model="form.password" type="password" show-password />
            </el-form-item>
            <el-form-item :label="$t('PrivacySecret')">
              <el-input v-model="form.secret2" type="password" show-password />
            </el-form-item>
          </template>
          <el-form-item v-else :label="$t('CommunityString')" required>
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
        </template>

        <template v-else-if="form.category === 'SERVER_MANAGEMENT'">
          <el-form-item :label="$t('Technology')">
            <el-select v-model="form.category_fields.technology" style="width: 100%">
              <el-option v-for="t in ['iDRAC', 'iLO', 'IPMI', 'XClarity', 'CIMC', 'Other']" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('DeviceModel')">
            <el-input v-model="form.category_fields.device_model" />
          </el-form-item>
          <el-form-item :label="$t('IPHostname')">
            <el-input v-model="form.category_fields.ip_hostname" />
          </el-form-item>
          <el-form-item :label="$t('ManagementURL')">
            <el-input v-model="form.category_fields.management_url" />
          </el-form-item>
          <el-form-item :label="$t('Username')" required>
            <el-input v-model="form.username" />
          </el-form-item>
          <el-form-item :label="$t('Password')" required>
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
        </template>

        <template v-else-if="form.category === 'API_CREDENTIAL'">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item :label="$t('Provider')">
                <el-input v-model="form.category_fields.provider" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('APIType')">
                <el-select v-model="form.category_fields.api_type" style="width: 100%">
                  <el-option v-for="t in ['AI', 'Application', 'Cloud', 'Security', 'Infrastructure', 'Other']" :key="t" :label="t" :value="t" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item :label="$t('ApplicationService')">
            <el-input v-model="form.category_fields.application" />
          </el-form-item>
          <el-form-item :label="$t('Environment')">
            <el-input v-model="form.category_fields.environment" />
          </el-form-item>
          <el-form-item :label="$t('BaseURL')">
            <el-input v-model="form.category_fields.base_url" />
          </el-form-item>
          <el-form-item :label="$t('APIKeyToken')" required>
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <el-form-item :label="$t('ExpirationDate')">
            <el-date-picker v-model="form.category_fields.expiration_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </template>

        <template v-else-if="form.category === 'SOFTWARE_LICENSE'">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item :label="$t('Vendor')">
                <el-input v-model="form.category_fields.vendor" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('Software')">
                <el-input v-model="form.category_fields.software" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item :label="$t('LicenseKeySerial')" required>
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item :label="$t('TotalLicenses')">
                <el-input-number v-model="form.category_fields.total_licenses" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('LicensesInUse')">
                <el-input-number v-model="form.category_fields.licenses_in_use" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-alert
            v-if="licenseOveruse" type="warning" :closable="false" show-icon
            :title="$t('LicenseOveruseWarning')" class="legacy-alert"
          />
        </template>

        <template v-else-if="form.category === 'CERTIFICATE'">
          <el-form-item :label="$t('CertificateType')" required>
            <el-select v-model="form.category_fields.cert_type" style="width: 100%">
              <el-option :label="$t('SSLCertificate')" value="SSL_CERTIFICATE" />
              <el-option :label="$t('InternalCA')" value="INTERNAL_CA" />
              <el-option :label="$t('ExternalCA')" value="EXTERNAL_CA" />
            </el-select>
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item :label="$t('CommonName')">
                <el-input v-model="form.category_fields.common_name" placeholder="portal.example.com" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('Issuer')">
                <el-input v-model="form.category_fields.issuer" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item :label="$t('PublicCertificate')">
            <el-input v-model="form.category_fields.public_certificate" type="textarea" :rows="4" placeholder="-----BEGIN CERTIFICATE-----" />
          </el-form-item>
          <el-form-item :label="$t('PrivateKey')" required>
            <el-input v-model="form.password" type="textarea" :rows="4" placeholder="-----BEGIN PRIVATE KEY-----" />
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item :label="$t('ExpirationDate')">
                <el-date-picker v-model="form.category_fields.expiration_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('SelfSigned')">
                <el-checkbox v-model="form.category_fields.self_signed" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <template v-else-if="form.category === 'SSH_KEY'">
          <el-form-item :label="$t('KeyAlgorithm')">
            <el-select v-model="form.category_fields.key_algorithm" style="width: 100%">
              <el-option v-for="a in ['RSA', 'ED25519', 'ECDSA']" :key="a" :label="a" :value="a" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('PublicKey')">
            <el-input v-model="form.category_fields.public_key" type="textarea" :rows="3" placeholder="ssh-ed25519 AAAA..." />
          </el-form-item>
          <el-form-item :label="$t('PrivateKey')" required>
            <el-input v-model="form.password" type="textarea" :rows="4" placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" />
          </el-form-item>
          <el-form-item :label="$t('Passphrase')">
            <el-input v-model="form.secret2" type="password" show-password />
          </el-form-item>
        </template>

        <template v-else-if="isGrouped">
          <el-alert type="info" :closable="false" show-icon :title="$t('GroupedRecordNotice', { max: groupedMaxMembers })" />
        </template>

        <template v-else>
          <el-form-item :label="$t('Username')">
            <el-input v-model="form.username" />
          </el-form-item>
          <el-form-item :label="$t('Password')" required>
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <el-form-item :label="$t('System')">
            <el-input v-model="form.system_name" />
          </el-form-item>
        </template>

        <h4><el-icon><Medal /></el-icon>{{ $t('SecurityClassification') }}</h4>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item :label="$t('Tier')" required>
              <el-select v-model="form.security_tier" style="width: 100%">
                <el-option label="TIER_0" value="TIER_0" />
                <el-option label="TIER_1" value="TIER_1" />
                <el-option label="TIER_2" value="TIER_2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('Sensitivity')">
              <el-select v-model="form.sensitivity" style="width: 100%" :disabled="tierForcesCritical">
                <el-option label="CRITICAL" value="CRITICAL" />
                <el-option label="NONCRITICAL" value="NONCRITICAL" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-checkbox v-model="form.break_glass">{{ $t('BreakGlass') }}</el-checkbox>
        </el-form-item>

        <!-- Bitwarden-style progressive disclosure - tags/description/
             owner are optional and were the main source of "muita barra
             de rolagem" (2026-09-04); collapsed by default, still real
             form fields (submitted the same as everything else above). -->
        <el-collapse v-model="advancedOpen" class="advanced-collapse">
          <el-collapse-item :title="$t('AdditionalDetails')" name="advanced">
            <el-form-item :label="$t('Tags')">
              <el-select v-model="form.tags" multiple filterable allow-create default-first-option style="width: 100%" />
            </el-form-item>
            <el-form-item :label="$t('Description')">
              <el-input v-model="form.description" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item :label="$t('Owner')">
              <el-input v-model="form.owner" :placeholder="$t('OwnerUserId')" />
            </el-form-item>
          </el-collapse-item>
        </el-collapse>

        <div class="form-actions">
          <el-button @click="$router.back()">{{ $t('Cancel') }}</el-button>
          <el-button type="primary" :loading="submitting" @click="submit">{{ $t('Save') }}</el-button>
        </div>
      </el-form>
    </IBox>

    <!-- S38 section 28/118 - Effective Security Behavior, live; mirrors the
         "Resumo e proteção" side panel from INFO/INSPI mockups, built from
         data already on the form - no new backend call. -->
    <IBox :title="$t('SummaryAndProtection')" class="create-summary-box">
      <dl class="summary-list">
        <div v-if="selectedCollectionName" class="summary-row">
          <dt>{{ $t('Collection') }}</dt>
          <dd>{{ selectedCollectionName }}</dd>
        </div>
        <div class="summary-row">
          <dt>{{ $t('Category') }}</dt>
          <dd>{{ form.category }}</dd>
        </div>
        <div v-if="form.manufacturer" class="summary-row">
          <dt>{{ $t('Manufacturer') }}</dt>
          <dd>{{ form.manufacturer }}</dd>
        </div>
        <div class="summary-row">
          <dt>{{ $t('Tier') }}</dt>
          <dd><el-tag :type="tierTagType" size="small">{{ form.security_tier }}</el-tag></dd>
        </div>
        <div class="summary-row">
          <dt>{{ $t('Sensitivity') }}</dt>
          <dd>{{ form.sensitivity }}</dd>
        </div>
        <div v-if="form.break_glass" class="summary-row">
          <dt>{{ $t('BreakGlass') }}</dt>
          <dd><el-tag type="danger" size="small">{{ $t('BreakGlass') }}</el-tag></dd>
        </div>
      </dl>
      <el-divider />
      <template v-if="isProtected">
        <p>{{ $t('OperatorReveal') }}: {{ $t('MFAPlusApproval') }}</p>
        <p>{{ $t('ApprovalRequestTTL') }}: 8h</p>
        <p>{{ $t('RevealGrant') }}: {{ $t('SingleUse') }} (15 min)</p>
      </template>
      <p v-else>{{ $t('OperatorReveal') }}: {{ $t('MFAOnly') }}</p>
      <p>{{ $t('RevealTime') }}: 15s</p>
    </IBox>
    </div>
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import { IBox } from '@/components'
import { categoryIcon, categoryLabel } from '@/utils/repository/categoryIcons'

const CATEGORIES = [
  'GENERIC_CREDENTIAL', 'SERVER_MANAGEMENT', 'NETWORK_CREDENTIAL', 'SNMP',
  'API_CREDENTIAL', 'SOFTWARE_LICENSE', 'APPLICATION_CREDENTIAL', 'DATABASE_CREDENTIAL',
  'CERTIFICATE', 'SSH_KEY', 'GROUPED_10', 'GROUPED_20', 'GROUPED_30'
]
const GROUPED_MAX_MEMBERS = { GROUPED_10: 10, GROUPED_20: 20, GROUPED_30: 30 }

export default {
  name: 'EntryCreateUpdate',
  components: { Page, IBox },
  data() {
    return {
      categories: CATEGORIES,
      collections: [],
      submitting: false,
      collectorIpsText: '',
      advancedOpen: [],
      form: {
        name: '', username: '', password: '', secret2: '', system_name: '', description: '',
        collection: '', category: 'GENERIC_CREDENTIAL', manufacturer: '', product: '',
        category_fields: {}, tags: [], security_tier: 'TIER_2', sensitivity: 'NONCRITICAL',
        break_glass: false, owner: ''
      }
    }
  },
  computed: {
    selectedCollectionName() {
      return this.collections.find((c) => c.id === this.form.collection)?.name || ''
    },
    tierTagType() {
      return { TIER_0: 'danger', TIER_1: 'warning', TIER_2: 'info' }[this.form.security_tier] || 'info'
    },
    tierForcesCritical() {
      return ['TIER_0', 'TIER_1'].includes(this.form.security_tier) || this.form.break_glass
    },
    isProtected() {
      return this.tierForcesCritical || this.form.sensitivity === 'CRITICAL'
    },
    licenseOveruse() {
      const { total_licenses: total, licenses_in_use: used } = this.form.category_fields
      return total !== undefined && used !== undefined && used > total
    },
    isGrouped() {
      return Object.prototype.hasOwnProperty.call(GROUPED_MAX_MEMBERS, this.form.category)
    },
    groupedMaxMembers() {
      return GROUPED_MAX_MEMBERS[this.form.category] || 0
    }
  },
  watch: {
    tierForcesCritical(val) {
      if (val) this.form.sensitivity = 'CRITICAL'
    }
  },
  created() {
    this.loadCollections()
  },
  methods: {
    categoryIcon(c) {
      return categoryIcon(c)
    },
    categoryLabelOf(c) {
      return categoryLabel(c)
    },
    async loadCollections() {
      const data = await this.$axios.get('/api/v1/repository/collections/', { params: { limit: 999 } })
      this.collections = data.results || data
    },
    // 2026-09-04 fix - the `required` attribute on el-form-item here is
    // purely visual (an asterisk); nothing called validate() before
    // submit, so a blank required field (e.g. the license key on
    // SOFTWARE_LICENSE) silently reached the backend and came back as a
    // generic 400 ("Erro no pedido, por favor verifique o conteudo
    // preenchido") with no indication of which field was the problem.
    // This mirrors, per category, exactly the fields already marked
    // `required` in the template above.
    validateForm() {
      const missing = []
      if (!this.form.name) missing.push(this.$t('Name'))
      if (!this.form.collection) missing.push(this.$t('Collection'))
      if (this.form.category === 'SNMP') {
        if (!this.form.category_fields.snmp_version) missing.push(this.$t('SNMPVersion'))
        if (this.form.category_fields.snmp_version !== 'V3' && !this.form.password) {
          missing.push(this.$t('CommunityString'))
        }
      } else if (this.form.category === 'SERVER_MANAGEMENT') {
        if (!this.form.username) missing.push(this.$t('Username'))
        if (!this.form.password) missing.push(this.$t('Password'))
      } else if (this.form.category === 'API_CREDENTIAL') {
        if (!this.form.password) missing.push(this.$t('APIKeyToken'))
      } else if (this.form.category === 'SOFTWARE_LICENSE') {
        if (!this.form.password) missing.push(this.$t('LicenseKeySerial'))
      } else if (this.form.category === 'CERTIFICATE') {
        if (!this.form.category_fields.cert_type) missing.push(this.$t('CertificateType'))
        if (!this.form.password) missing.push(this.$t('PrivateKey'))
      } else if (this.form.category === 'SSH_KEY') {
        if (!this.form.password) missing.push(this.$t('PrivateKey'))
      } else if (this.isGrouped) {
        // no secret of its own - members are added afterward on the detail page
      } else if (!this.form.password) {
        missing.push(this.$t('Password'))
      }
      if (missing.length) {
        this.$message.error(`${this.$t('FieldRequiredError')} (${missing.join(', ')})`)
        return false
      }
      return true
    },
    async submit() {
      if (!this.validateForm()) return
      this.form.category_fields.authorized_collector_ips = this.collectorIpsText
        .split('\n').map((s) => s.trim()).filter(Boolean)
      this.submitting = true
      try {
        const data = await this.$axios.post('/api/v1/repository/entries/', this.form)
        this.$message.success(this.$t('SavedSuccessfully'))
        // grouped records land on Detail so members can be added right away
        this.$router.push(this.isGrouped
          ? { name: 'RepositoryCredentialDetail', params: { id: data.id } }
          : { name: 'RepositoryCredentials' })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
h4 {
  margin: 20px 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
h4 .el-icon {
  color: var(--el-color-primary);
}
.legacy-alert {
  margin-bottom: 12px;
}
.category-picker {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}
.category-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  text-align: center;
  color: var(--el-text-color-secondary);
  transition: all 0.15s ease;
  word-break: break-word;
}
.category-tile:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
.category-tile.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}
.category-tile-icon {
  font-size: 20px;
}
.advanced-collapse {
  margin: 8px 0 4px;
  border-top: none;
  border-bottom: none;
}
.advanced-collapse :deep(.el-collapse-item__header) {
  border-bottom: none;
  font-size: 13px;
}
.advanced-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}
.create-layout {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.create-form-box {
  flex: 1;
  min-width: 0;
}
.create-summary-box {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 16px;
}
.summary-list {
  margin: 0;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
}
.summary-row dt {
  color: var(--el-text-color-secondary);
}
.summary-row dd {
  margin: 0;
  font-weight: 500;
  text-align: right;
}
.create-summary-box p {
  margin: 4px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 8px;
}
@media (max-width: 960px) {
  .create-layout {
    flex-direction: column;
  }
  .create-summary-box {
    width: 100%;
    position: static;
  }
}
</style>
