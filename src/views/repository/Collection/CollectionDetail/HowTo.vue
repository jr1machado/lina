<template>
  <IBox>
    <div class="how-to">
      <h4>{{ $t('HowToUseCollectionTitle') }}</h4>
      <p>{{ $t('HelpItemCollectionsIntro') }}</p>
      <ul>
        <li>{{ $t('HelpItemCollectionsOrg') }}</li>
        <li>{{ $t('HelpItemCollectionsAccess') }}</li>
        <li>{{ $t('HelpItemCollectionsApprover') }}</li>
        <li>{{ $t('HelpItemCollectionsNoAccess') }}</li>
        <li>{{ $t('HelpItemCollectionsDelete') }}</li>
      </ul>

      <h4>{{ $t('HowToUseCollectionSteps') }}</h4>
      <ol class="steps">
        <li>{{ $t('HowToUseCollectionStep1') }}</li>
        <li>{{ $t('HowToUseCollectionStep2') }}</li>
        <li>{{ $t('HowToUseCollectionStep3') }}</li>
        <li>{{ $t('HowToUseCollectionStep4') }}</li>
        <li>{{ $t('HowToUseCollectionStep5') }}</li>
        <li>{{ $t('HowToUseCollectionStep6') }}</li>
      </ol>
    </div>
  </IBox>
</template>

<script>
import IBox from '@/components/Common/IBox'

export default {
  name: 'HowTo',
  components: { IBox },
  props: {
    object: { type: Object, default: () => ({}) }
  }
}
</script>

<style scoped>
.how-to {
  max-width: 720px;
}
.how-to h4 {
  margin: 0 0 8px;
}
.how-to h4:not(:first-child) {
  margin-top: 22px;
}
.how-to p {
  margin: 0 0 8px;
  color: var(--el-text-color-regular);
}
.how-to ul,
.how-to .steps {
  margin: 0;
  padding-left: 20px;
}
.how-to li {
  margin-bottom: 8px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}
</style>
