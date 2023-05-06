<p align="center">
  <a href="https://flyffulator.com/">
    <img src="https://i.imgur.com/K7ylR3y.png" alt="flyffulator" width="256" height="256">
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
- [x] Relevant skills' damage calculations.
- [x] General stat calculations.
- [x] Assist buffs calculation.
- [x] Class-specific buffs calculation and option.
- [x] Equipment bonus calculation.
- [x] Equipment customization. 
- [x] Skill options.
- [ ] Mobile browser support.

<p align="center">
  <img src="https://i.imgur.com/o83SQru.png" alt="flyffulator" width=75%>
</p>

This project uses [Pyff](https://github.com/Frostiae/Pyff), a python wrapper for the [Flyff Universe](https://api.flyff.com/) API, [ApexCharts](https://apexcharts.com/) for chart and graph rendering, Vue3, and Vite4.

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
npm run dev
```
