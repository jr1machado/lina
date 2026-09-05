<template>
  <Page>
    <IBox :title="$t('HowToUseVault')">
      <h4>{{ $t('Objective') }}</h4>
      <p>{{ $t('HelpObjectiveText') }}</p>

      <h4>{{ $t('WhenToUse') }}</h4>
      <ul>
        <li>{{ $t('HelpWhenLegacy') }}</li>
        <li>{{ $t('HelpWhenVendor') }}</li>
        <li>{{ $t('HelpWhenServerMgmt') }}</li>
        <li>{{ $t('HelpWhenSNMP') }}</li>
        <li>{{ $t('HelpWhenAPI') }}</li>
        <li>{{ $t('HelpWhenLicense') }}</li>
      </ul>

      <h4>{{ $t('WhenToUsePAM') }}</h4>
      <p>{{ $t('HelpWhenPAMText') }}</p>

      <h4>{{ $t('Classification') }}</h4>
      <p>{{ $t('HelpClassificationText') }}</p>

      <h4>{{ $t('Approval') }}</h4>
      <p>{{ $t('HelpApprovalProtected') }}</p>
      <p>{{ $t('HelpApprovalNoncritical') }}</p>

      <h4>{{ $t('Rotation') }}</h4>
      <p>{{ $t('HelpRotationText') }}</p>

      <h4>{{ $t('BreakGlass') }}</h4>
      <p>{{ $t('HelpBreakGlassText') }}</p>
    </IBox>

    <!-- 2026-09-05 - per-sidebar-item reference, requested to complement
         the sections above (which explain the module's rules) with what
         each menu item actually is/does - Collections in particular,
         since it's both an organization AND access-control unit, not
         just a folder. -->
    <IBox :title="$t('ModuleItemsReference')" class="items-reference">
      <h4>{{ $t('Dashboard') }}</h4>
      <p>{{ $t('HelpItemDashboard') }}</p>

      <h4>{{ $t('AllCredentials') }}</h4>
      <p>{{ $t('HelpItemAllCredentials') }}</p>

      <h4>{{ $t('Collections') }}</h4>
      <p>{{ $t('HelpItemCollectionsIntro') }}</p>
      <ul>
        <li>{{ $t('HelpItemCollectionsOrg') }}</li>
        <li>{{ $t('HelpItemCollectionsAccess') }}</li>
        <li>{{ $t('HelpItemCollectionsApprover') }}</li>
        <li>{{ $t('HelpItemCollectionsNoAccess') }}</li>
        <li>{{ $t('HelpItemCollectionsDelete') }}</li>
      </ul>

      <h4>{{ $t('Requests') }}</h4>
      <p>{{ $t('HelpItemRequests') }}</p>

      <h4>{{ $t('Reports') }}</h4>
      <p>{{ $t('HelpItemReports') }}</p>

      <h4>{{ $t('Audit') }}</h4>
      <p>{{ $t('HelpItemAudit') }}</p>
    </IBox>
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import { IBox } from '@/components'

export default {
  name: 'HelpPage',
  components: { Page, IBox }
}
</script>

<style scoped>
h4 {
  margin-top: 20px;
}
.items-reference {
  margin-top: 16px;
}
</style>
