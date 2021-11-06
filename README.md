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
Flyffulator is a [website](https://flyffulator.com/) for [Flyff Project M](https://discord.gg/qDS8ZGUbmA) players to simulate characters and be able to calculate an optimal build or leveling strategy. 

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
- [ ] Class-specific buffs calculation and option.
- [x] Equipment bonus calculation.
- [ ] Skill customization. (Desktop app, probably)
- [ ] Equipment customization. (Desktop app, probably)
- [ ] Mobile browser support.

<p align="center">
  <img src="https://i.imgur.com/z54z0qT.gif" alt="flyffulator" width=75%>
</p>

This project originally used [Pyff](https://github.com/Frostiae/Pyff), a python wrapper for the [Project M API](https://flyff-api.sniegu.fr/). The library used for rendering the all the charts is [ApexCharts](https://apexcharts.com/). We are also now using Vue3 as the front end framework.

## Installation for development
Clone the repository into any directory.
```
git clone https://github.com/Frostiae/Flyffulator.git
```

Start a terminal in the directory of the step from above, and run the following command.
```
npm install
```

In the same directory, start the express server by running the following.
```
node server.js
```
