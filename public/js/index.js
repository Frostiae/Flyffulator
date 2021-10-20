import { updateOutput } from "./communication.js";

// EVENT LISTENERS
document.getElementById("minusLevel").addEventListener("click", minusLevel)
document.getElementById("plusLevel").addEventListener("click", plusLevel)
document.getElementById("minusSTR").addEventListener("click", minusSTR)
document.getElementById("plusSTR").addEventListener("click", plusSTR)
document.getElementById("minusSTA").addEventListener("click", minusSTA)
document.getElementById("plusSTA").addEventListener("click", plusSTA)
document.getElementById("minusDEX").addEventListener("click", minusDEX)
document.getElementById("plusDEX").addEventListener("click", plusDEX)
document.getElementById("minusINT").addEventListener("click", minusINT)
document.getElementById("plusINT").addEventListener("click", plusINT)

const job = document.getElementById('job');
const level = document.getElementById('level');
const STR = document.getElementById('STR');
const STA = document.getElementById('STA');
const DEX = document.getElementById('DEX');
const INT = document.getElementById('INT');
const assistint = document.getElementById('assistint');
const assistBuffs = document.getElementById('buffs');
const tooltips = document.getElementsByClassName('info-tooltip');
const activeTooltip = document.getElementsByClassName('tooltip')[0];

job.addEventListener("change", updateStats);
level.addEventListener("change", updateStats);
STR.addEventListener("change", updateStats);
STA.addEventListener("change", updateStats);
DEX.addEventListener("change", updateStats);
INT.addEventListener("change", updateStats);
assistBuffs.addEventListener("change", updateStats);

const tooltips_arr = Array.prototype.slice.call(tooltips);
tooltips_arr.forEach(tooltip => {
    tooltip.addEventListener("mouseover", (event) => {
        let text = tooltip.parentNode.getElementsByTagName("p")[0];
        activeTooltip.getElementsByTagName('h5')[0].innerText = text.innerText;

        activeTooltip.style.left = event.clientX - 330 + 'px';
        activeTooltip.style.top = event.clientY - 100 + 'px';
        activeTooltip.style.display = 'inline';
    });

    tooltip.addEventListener("mouseout", () => {
        activeTooltip.style.display = 'None';
    })
});

updateStats();

function plusLevel() {
    var value = parseInt(level.value, 10)
    value = isNaN(value) ? 0 : value;
    value++;
    level.value = value;
    updateStats();
}

function minusLevel() {
    var value = parseInt(level.value, 10)
    value = isNaN(value) ? 0 : value;
    value--;
    level.value = value;
    updateStats();
}

function plusDEX() {
    var value = parseInt(DEX.value, 10)
    value = isNaN(value) ? 0 : value;
    value++;
    DEX.value = value;
    updateStats();
}

function minusDEX() {
    var value = parseInt(DEX.value, 10)
    value = isNaN(value) ? 0 : value;
    value--;
    DEX.value = value;
    updateStats();
}

function plusSTR() {
    var value = parseInt(STR.value, 10)
    value = isNaN(value) ? 0 : value;
    value++;
    STR.value = value;
    updateStats();
}

function minusSTR() {
    var value = parseInt(STR.value, 10)
    value = isNaN(value) ? 0 : value;
    value--;
    STR.value = value;
    updateStats();
}

function plusSTA() {
    var value = parseInt(STA.value, 10)
    value = isNaN(value) ? 0 : value;
    value++;
    STA.value = value;
    updateStats();
}

function minusSTA() {
    var value = parseInt(STA.value, 10)
    value = isNaN(value) ? 0 : value;
    value--;
    STA.value = value;
    updateStats();
}

function plusINT() {
    var value = parseInt(INT.value, 10)
    value = isNaN(value) ? 0 : value;
    value++;
    INT.value = value;
    updateStats();
}

function minusINT() {
    var value = parseInt(INT.value, 10)
    value = isNaN(value) ? 0 : value;
    value--;
    INT.value = value;
    updateStats();
}

function updateStats() {
    updateOutput(job.value, STR.value, STA.value, DEX.value, INT.value, level.value, assistint.value);
}