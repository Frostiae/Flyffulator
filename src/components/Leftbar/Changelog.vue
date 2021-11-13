<template>
  <div class="char">
    <h3>Changelog</h3>
    <div class="stats" id="changelog">
      <h5>November 12</h5>
      <ul>
        <li>Hit of Penya damage is now more accurate.</li>
        <li>Blade DPS is now accurate.</li>
        <li>STR:DEX ratio graph is now more accurate.</li>
      </ul>
      <h5>November 8</h5>
      <ul>
        <li>Reduced the amount of calculations required for some numbers to improve performance.</li>
        <li>Added a more detailed damage info box which reflects the currently selected attack.</li>
        <li>Added a STR:DEX ratio graph which reflects auto attack DPS.</li>
        <li>Added the ability to apply class buffs.</li>
      </ul>
    </div>
    <h5 style="opacity: 0.5;">This section will only outline notable changes. If you would like to follow development more closely, visit the <a href="https://github.com/Frostiae/Flyffulator">GitHub</a> page.</h5>
  </div>
</template>

<script>
export default {
  name: 'Changelog'
}
</script>

<style scoped lang='scss'>

</style>
