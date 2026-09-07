<template>
  <EntryTable :extra-query="{ collection: object.id }" />
</template>

<script>
// reuses the same EntryTable used by "Todas as credenciais" (Entry/
// EntryList.vue) and the dashboard's quick-access widget - never a
// second list implementation, just scoped by collection.
import EntryTable from '../../Entry/EntryTable.vue'

export default {
  name: 'Entries',
  components: { EntryTable },
  props: {
    object: { type: Object, default: () => ({}) }
  }
}
</script>
