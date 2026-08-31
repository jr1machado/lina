<template>
  <Echart :options="options" class="kri-gauge-chart" />
</template>

<script>
import Echart from '@/components/Dashboard/Echart.vue'

// Sprint_34-Credential-Recovery-Contas-Reconciliacao.md follow-up - Health
// Center gauge widget, same status palette as the existing status pill/tag
// on the KRI card (el-color-success/warning/danger), reused here instead
// of inventing a new color scheme.
const STATUS_COLOR = {
  HEALTHY: '#67c23a',
  ATTENTION: '#e6a23c',
  CRITICAL: '#f56c6c',
  UNKNOWN: '#909399'
}

export default {
  name: 'KRIGauge',
  components: { Echart },
  props: {
    value: { type: Number, default: null },
    status: { type: String, default: 'UNKNOWN' }
  },
  computed: {
    color() {
      return STATUS_COLOR[this.status] || STATUS_COLOR.UNKNOWN
    },
    options() {
      const value = this.value === null ? 0 : this.value
      return {
        series: [
          {
            type: 'gauge',
            startAngle: 210,
            endAngle: -30,
            min: 0,
            max: 100,
            radius: '92%',
            progress: { show: true, width: 10, itemStyle: { color: this.color } },
            axisLine: { lineStyle: { width: 10, color: [[1, 'rgba(128,128,128,0.15)']] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            pointer: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: {
              valueAnimation: true,
              formatter: () => (this.value === null ? '--' : `${this.value}%`),
              fontSize: 20,
              fontWeight: 600,
              color: this.color,
              offsetCenter: [0, '0%']
            },
            data: [{ value }]
          }
        ]
      }
    }
  }
}
</script>

<style scoped>
.kri-gauge-chart {
  width: 100%;
  height: 110px;
}
</style>
