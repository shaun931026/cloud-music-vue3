<template>
  <div class="home">
    hello
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { homepage } from '@/api'

export default defineComponent({
  name: 'Home',
  setup() {
    onMounted(() => {
      homepage({
        refresh: true
      }).then(res => {
        console.log(res)
      })
    })
  }
})
</script>

<style lang="less" scoped>
.home {
  font-size: 12px;
}
</style>
