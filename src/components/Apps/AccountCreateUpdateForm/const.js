import { UpdateToken, UploadSecret } from '@/components/Form/FormFields'
import Select2 from '@/components/Form/FormFields/Select2.vue'
import AssetSelect from '@/components/Apps/AssetSelect/index.vue'
import { Required, RequiredChange } from '@/components/Form/DataForm/rules'
import AutomationParamsForm from '@/views/assets/Platform/AutomationParamsSetting.vue'

export const accountFieldsMeta = (vm) => {
  const defaultPrivilegedAccounts = ['root', 'administrator']
  // Sprint_36 §71-76 - choice fields arrive as a bare string while the
  // form is unsaved, but as {value, label} once loaded from an existing
  // account.
  const rawChoiceValue = (v) => (v && typeof v === 'object' ? v.value : v)

  function onPrivilegedUser(value, updateForm) {
    const maybePrivileged = defaultPrivilegedAccounts.includes(value)
    if (maybePrivileged) {
      updateForm({ privileged: true, secret_reset: false, push_now: false })
    }
  }

  return {
    nodes: {
      component: Select2,
      label: vm.$t('Node'),
      el: {
        value: [],
        ajax: {
          url: '/api/v1/assets/nodes/',
          transformOption: (item) => {
            return { label: item.full_value, value: item.id }
          }
        }
      },
      hidden: () => {
        return !vm.addTemplate
      }
    },
    assets: {
      component: AssetSelect,
      label: vm.$t('Asset'),
      el: {
        multiple: false
      },
      hidden: () => {
        return vm.platform || vm.asset
      }
    },
    template: {
      component: Select2,
      rules: [Required],
      el: {
        get disabled() {
          return vm.isDisabled
        },
        multiple: vm.addTemplate,
        ajax: {
          url: '/api/v1/accounts/account-templates/',
          transformOption: (item) => {
            return { label: item.name, value: item.id }
          }
        }
      },
      hidden: () => {
        return vm.platform || vm.asset || !vm.addTemplate
      }
    },
    on_invalid: {
      rules: [Required],
      label: vm.$t('AccountPolicy'),
      helpTip: vm.$t('AccountPolicyHelpText'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: () => {
        return vm.platform || vm.asset
      }
    },
    name: {
      label: vm.$t('Name'),
      rules: [RequiredChange],
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      on: {
        input: ([value], updateForm) => {
          if (!vm.usernameChanged) {
            if (!vm.account?.name) {
              updateForm({ username: value })
            }
          }
          onPrivilegedUser(value, updateForm)
        }
      },
      hidden: () => {
        return vm.addTemplate
      }
    },
    username: {
      el: {
        get disabled() {
          return !!vm.account?.name || vm.isDisabled
        }
      },
      on: {
        input: ([value], updateForm) => {
          vm.usernameChanged = true
        },
        change: ([value], updateForm) => {
          onPrivilegedUser(value, updateForm)
        }
      },
      hidden: () => {
        return vm.addTemplate
      }
    },
    privileged: {
      label: vm.$t('Privileged'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: () => {
        return vm.addTemplate
      }
    },
    su_from: {
      component: Select2,
      hidden: (formValue) => {
        return !vm.asset?.id || !vm.iPlatform.su_enabled
      },
      el: {
        multiple: false,
        clearable: true,
        ajax: {
          url: `/api/v1/accounts/accounts/su-from-accounts/?account=${vm.account?.id || ''}&asset=${vm.asset?.id || ''}`,
          transformOption: (item) => {
            return { label: `${item.name}(${item.username})`, value: item.id }
          }
        }
      }
    },
    su_from_username: {
      label: vm.$t('UserSwitchFrom'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: (formValue) => {
        return vm.platform || vm.asset || vm.addTemplate
      }
    },
    password: {
      label: vm.$t('Password'),
      component: UpdateToken,
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: (formValue) => {
        return formValue.secret_type !== 'password' || vm.addTemplate
      }
    },
    ssh_key: {
      label: vm.$t('PrivateKey'),
      component: UploadSecret,
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: (formValue) => formValue.secret_type !== 'ssh_key' || vm.addTemplate
    },
    passphrase: {
      label: vm.$t('Passphrase'),
      component: UpdateToken,
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: (formValue) => formValue.secret_type !== 'ssh_key' || vm.addTemplate
    },
    token: {
      label: vm.$t('Token'),
      component: UploadSecret,
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: (formValue) => formValue.secret_type !== 'token' || vm.addTemplate
    },
    access_key: {
      id: 'access_key',
      label: vm.$t('AccessKey'),
      component: UploadSecret,
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: (formValue) => formValue.secret_type !== 'access_key' || vm.addTemplate
    },
    api_key: {
      id: 'api_key',
      label: vm.$t('ApiKey'),
      component: UploadSecret,
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: (formValue) => formValue.secret_type !== 'api_key' || vm.addTemplate
    },
    secret_type: {
      type: 'radio-group',
      options: [],
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: () => {
        return vm.addTemplate
      }
    },
    push_now: {
      helpTip: vm.$t('WindowsPushHelpText'),
      hidden: (formValue) => {
        const automation = vm.iPlatform.automation || {}
        return (
          !automation.push_account_enabled ||
          !automation.ansible_enabled ||
          !vm.$hasPerm('accounts.push_account') ||
          (formValue.secret_type === 'ssh_key' && vm.iPlatform.type.value === 'windows') ||
          vm.addTemplate ||
          !formValue.secret_reset
        )
      }
    },
    params: {
      label: vm.$t('PushParams'),
      component: AutomationParamsForm,
      el: {},
      hidden: (formValue) => {
        const automation = vm.iPlatform.automation || {}
        if (!vm.iPlatform.automation) {
          return true
        }
        vm.fieldsMeta.params.el.method = vm.iPlatform.automation.push_account_method
        vm.fieldsMeta.params.el.pushAccountParams = vm.iPlatform.automation.push_account_params
        return (
          !formValue.push_now ||
          !automation.push_account_enabled ||
          !automation.ansible_enabled ||
          (formValue.secret_type === 'ssh_key' && vm.iPlatform.type.value === 'windows') ||
          !vm.$hasPerm('accounts.push_account') ||
          vm.addTemplate
        )
      }
    },
    is_active: {
      label: vm.$t('IsActive'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      }
    },
    comment: {
      label: vm.$t('Comment'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      }
    },
    secret_reset: {
      label: vm.$t('SecretReset'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      }
    },
    // Sprint_36-Account-Class-Lifecycle.md §71-76 - account_purpose is the
    // one choice the admin makes; usage_mode/concurrency_mode are shown
    // read-only (disabled) whenever the purpose forces them, since
    // BaseAccount.apply_purpose_governance() overwrites them server-side
    // regardless of what's submitted - showing them as editable would be
    // misleading. The old checkbox panel (service_account, break_glass,
    // is_shared, exclusive_use, reconciliation_account) is gone from this
    // form: those fields still exist on the account (kept in sync by the
    // backend, §102-103) but are no longer something an admin sets here.
    account_purpose: {
      label: vm.$t('AccountPurpose'),
      helpTip: vm.$t('AccountPurposeHelpText'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: () => vm.addTemplate
    },
    usage_mode: {
      label: vm.$t('UsageMode'),
      helpTip: vm.$t('UsageModeHelpText'),
      el: {
        get disabled() {
          return vm.isDisabled || ['RECONCILIATION', 'BREAK_GLASS'].includes(rawChoiceValue(vm.form.account_purpose))
        }
      },
      hidden: () => vm.addTemplate
    },
    concurrency_mode: {
      label: vm.$t('ConcurrencyMode'),
      helpTip: vm.$t('ConcurrencyModeHelpText'),
      el: {
        get disabled() {
          return vm.isDisabled || rawChoiceValue(vm.form.account_purpose) === 'BREAK_GLASS'
        }
      },
      hidden: () => vm.addTemplate
    },
    security_tier: {
      label: vm.$t('SecurityTier'),
      helpTip: vm.$t('SecurityTierHelpText'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: () => vm.addTemplate
    },
    // Sprint_36 §115-116 - a reason is required by the backend
    // (AccountViewSet.perform_update) only for a "sensitive" transition:
    // Security Tier moving away from Tier 0, or Purpose changing into/out
    // of Reconciliation/Break Glass. Shown only when the current in-flight
    // edit is actually one of those, comparing against the account's
    // original (pre-edit) values in vm.account.
    classification_change_reason: {
      label: vm.$t('Reason'),
      helpTip: vm.$t('ClassificationChangeReasonHelpText'),
      rules: [Required],
      el: {
        type: 'textarea',
        rows: 2
      },
      hidden: (formValue) => {
        if (vm.addTemplate || !vm.account?.id) {
          return true
        }
        const oldTier = rawChoiceValue(vm.account.security_tier)
        const newTier = rawChoiceValue(formValue.security_tier)
        const oldPurpose = rawChoiceValue(vm.account.account_purpose)
        const newPurpose = rawChoiceValue(formValue.account_purpose)
        const sensitive = ['RECONCILIATION', 'BREAK_GLASS']
        const tierLeftZero = oldTier === 'TIER_0' && newTier !== 'TIER_0'
        const purposeChanged =
          newPurpose !== oldPurpose && (sensitive.includes(oldPurpose) || sensitive.includes(newPurpose))
        return !(tierLeftZero || purposeChanged)
      }
    },
    password_management_mode: {
      label: vm.$t('PasswordManagementMode'),
      helpTip: vm.$t('PasswordManagementModeHelpText'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: () => vm.addTemplate
    },
    auto_reconcile: {
      label: vm.$t('RecoveryAutoReconcile'),
      hidden: (formValue) => vm.addTemplate || rawChoiceValue(formValue.account_purpose) !== 'RECONCILIATION',
      el: {
        get disabled() {
          return vm.isDisabled
        }
      }
    },
    dedicated_pam_account: {
      label: vm.$t('DedicatedPamAccount'),
      helpTip: vm.$t('DedicatedPamAccountHelpText'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: () => vm.addTemplate
    },
    credential_check_enabled: {
      label: vm.$t('CredentialCheckEnabled'),
      helpTip: vm.$t('CredentialCheckEnabledHelpText'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: () => vm.addTemplate
    },
    rotation_interval: {
      label: vm.$t('RotationInterval'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: (formValue) => vm.addTemplate || rawChoiceValue(formValue.password_management_mode) !== 'MANAGED'
    },
    identity_source: {
      label: vm.$t('IdentitySource'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: () => vm.addTemplate
    },
    password_owner: {
      label: vm.$t('PasswordOwner'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: () => vm.addTemplate
    },
    profile_code: {
      label: vm.$t('ProfileCode'),
      helpTip: vm.$t('ProfileCodeHelpText'),
      el: {
        get disabled() {
          return vm.isDisabled
        }
      },
      hidden: () => vm.addTemplate
    }
  }
}
