<template>
  <span :class="cls"> {{ value }}</span>
</template>

<script>
import BaseFormatter from './base.vue'
export default {
  name: 'DisplayFormatter',
  extends: BaseFormatter,
  data() {
    // Vue 3: a prop's default() factory is not bound to the instance
    // (this === null inside it), so `this.col` there threw "Cannot read
    // properties of null (reading 'col')" for any column relying on the
    // default displayKey (no explicit formatterArgs.displayKey) - e.g.
    // accounts/AccountDetail/Rotation.vue's job history table. Computing
    // it here in data() instead, where `this` is bound correctly.
    const formatterArgsDefault = { displayKey: (this.col?.prop || '') + '_display' }
    return {
      formatterArgs: Object.assign(formatterArgsDefault, this.col.formatterArgs)
    }
  },
  computed: {
    value() {
      const displayKey = this.formatterArgs.displayKey
      let value = this.row[displayKey]
      if (value === undefined) {
        value = this.row[this.col.prop]
      }
      return value
    },
    cls() {
      const classChoices = this.formatterArgs?.classChoices
      if (!classChoices) {
        return ''
      }
      return classChoices[this.cellValue]
    }
  },
  methods: {}
}
</script>

<style scoped></style>
