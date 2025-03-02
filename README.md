<table align="center">
  <tr>
    <td>
      <img src="https://i.imgur.com/8F2kGqQ.png" alt="flyffulator" width="64" height="64">
    </td>
    <td>
      <h1>Flyffulator</h1>
    </td>
  </tr>
</table>

<h3 align="center">
  <b>
    Flyff simulator and damage calculator
  </b>
</h3>

## About
Flyffulator is a [website](https://flyffulator.com/) for [Flyff Universe](https://universe.flyff.com/) players to simulate characters and be able to calculate an optimal build.

Flyffulator allows you to calculate both offensive and defensive capabilities, skills and auto attacks, and provides the full build customization possibilities of the game.

The website design was built with the aim to look identical to the game, so that everything is familiar and easy to use. All tooltips, icons, buttons, tabs, and other UI elements are identical to the game's golden theme.
<p align="center">
  <img src="https://i.imgur.com/J64fpSJ.png" alt="flyffulator" width=75%>
</p>

This project uses [Pyff](https://github.com/Frostiae/Pyff), a python wrapper for the [Flyff Universe](https://api.flyff.com/) API, [Chart.js](https://www.chartjs.org/) for chart and graph rendering, Bun, Vite, and React.

## Add new language
To add a new language copy the translation.json from public/en_US/ to your new language folder and translate strings to your language.
E.g. public/yourlanguage-code/translation.json

Finally, in src/i18n/config.js add your language code to the supportedLngs Array.

Make sure to lint your Json file before making a PR

## Installation for development
Clone the repository into any directory.
```
git clone https://github.com/Frostiae/Flyffulator.git
```

Start a terminal in the directory of the step from above, and run the following command.
```
bun install
```

In the same directory, start the local server by running the following.
```
bun run dev
```
