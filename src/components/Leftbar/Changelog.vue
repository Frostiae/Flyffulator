<template>
  <div class="char">
    <h3>Changelog</h3>
    <div class="stats" id="changelog">
        <h5>October 20</h5>
        <ul>
        <li>Fixed issues with input validation.</li>
        </ul>
        <h5>October 19</h5>
        <ul>
        <li>Added time-to-kill information in the damage section.</li>
        <li>Improved calculations for average auto-attack damage to be more accurate with critical damage. (Ranger currently has inconsistencies)</li>
        <li>Added an input for the amount of INT an assist has for assist buffs.</li>
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
