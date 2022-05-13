<p align="center">
  <a href="https://flyffulator.com/">
    <img src="https://i.imgur.com/l9bO03e.png" alt="flyffulator" width="256" height="256">
  </a>
</p>

<h3 align="center">
  <b>
      Flyffulator - The extensive Flyff simulator
  </b>
</h3>

## About
Flyffulator is a [website](https://flyffulator.com/) for [Flyff Universe](https://discord.gg/flyffuniverse) players to simulate characters and be able to calculate an optimal build or leveling strategy. 

- [x] Highest experience per kill monster at your level.
- [x] Kills per level chart for the relevant monsters.
- [x] Experience-to-Health ratio chart for the relevant.
- [x] An extensive hits per level chart for the relevant monsters.
  - [x] Take user-specified damage output into account.
  - [x] Take critical chance and damage into account.
  - [x] Take level difference damage reduction into account.
  - [x] Take level difference experience reduction into account.
  - [ ] Take hit-rate into account.
- [x] Relevant skills' damage calculations.
- [x] General stat calculations.
- [x] Assist buffs calculation.
- [x] Class-specific buffs calculation and option.
- [x] Equipment bonus calculation.
- [x] Equipment customization. 
- [ ] Skill customization.
- [ ] Mobile browser support.

<p align="center">
  <img src="https://i.imgur.com/z54z0qT.gif" alt="flyffulator" width=75%>
</p>

This project uses [Pyff](https://github.com/Frostiae/Pyff), a python wrapper for the [Flyff Universe](https://flyff-api.sniegu.fr/) API, [ApexCharts](https://apexcharts.com/) for chart and graph rendering, and is built in Vue3.

## Installation for development
Clone the repository into any directory.
```
git clone https://github.com/Frostiae/Flyffulator.git
```

Start a terminal in the directory of the step from above, and run the following command.
```
npm install
```

In the same directory, start the local server by running the following.
```
npm run serve
```
