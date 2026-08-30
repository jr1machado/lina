<template>
  <IBox class="help-center">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-menu :default-active="activeKey" class="help-menu" @select="onSelect">
          <el-menu-item v-for="mod in modules" :key="mod.key" :index="mod.key">
            {{ mod.title[locale] || mod.title.en }}
          </el-menu-item>
        </el-menu>
      </el-col>
      <el-col :span="18">
        <div class="markdown-body">
          <VueMarkdown :source="activeContent" :html="false" />
        </div>
      </el-col>
    </el-row>
  </IBox>
</template>

<script>
// In-app Help center: usage docs, best practices and configuration
// guidance per module, bilingual (PT-BR/EN), switching with the
// operator's own language selection (same i18n locale the rest of the
// UI already uses - see content/index.js for how EN/PT-BR are picked).
import IBox from '@/components/Common/IBox/index.vue'
import VueMarkdown from '@/components/Widgets/VueMarkdown/index.vue'
import { HELP_MODULES } from './content/index.js'

export default {
  name: 'HelpCenter',
  components: { IBox, VueMarkdown },
  data() {
    return {
      modules: HELP_MODULES,
      activeKey: HELP_MODULES[0].key
    }
  },
  computed: {
    locale() {
      const raw = this.$i18n?.locale?.value || this.$i18n?.locale || 'en'
      return String(raw).toLowerCase().startsWith('pt') ? 'pt_br' : 'en'
    },
    activeModule() {
      return this.modules.find((m) => m.key === this.activeKey) || this.modules[0]
    },
    activeContent() {
      return this.activeModule.content[this.locale] || this.activeModule.content.en
    }
  },
  methods: {
    onSelect(key) {
      this.activeKey = key
    }
  }
}
</script>

<style lang="scss" scoped>
.help-menu {
  border-right: none;
}

.markdown-body {
  padding: 0 20px;
  max-width: 900px;

  :deep(table) {
    display: table;
    width: 100%;
  }
}

@import 'github-markdown-css/github-markdown-light.css';
</style>
