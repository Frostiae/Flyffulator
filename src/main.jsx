import App from './App.jsx'
import LocaleSwitcher from "./i18n/LocaleSwitcher";
import './styles/index.scss'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import flyffulatorLogo from '/logonew.png'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import Annotation from 'chartjs-plugin-annotation'
import "./i18n/config.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Annotation);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="header">
      <img src={flyffulatorLogo} className="logo" alt="Flyffulator logo" />
      <h2>Flyffulator</h2>
    </div>
      <App />
    <footer>
      <div className="footer-wrapper">
        <div className="footer-info">
          <div className="footer-logo">
            <img src={flyffulatorLogo} className="logo" alt="Flyffulator logo" />
            <h2>Flyffulator</h2>
          </div>
          <p>
            <b>Flyffulator</b> is not officially affiliated with Gala Lab Corp.
            <br />
            <b>Flyffulator</b> is an extensive Flyff Universe character simulator and damage calculator.
            <br />
            <b>Flyffulator</b> 2025.
            <br />
            <br />
            <i>Feedback? <a href="https://github.com/Frostiae/Flyffulator/issues">GitHub</a> or <a href="https://discord.gg/DpyPpyU4TR">Discord</a></i>
            <br />
            <i>Created by Frostiae & contributors</i>
          </p>
        </div>
        <div>
          <h2>More Links</h2>
          <br />
          <a href="https://github.com/Frostiae/Flyffulator">GitHub</a>
          <br />
          <a href="https://universe.flyff.com/">Flyff Universe</a>
          <br />
          <a href="https://api.flyff.com/">Flyff API</a>
          <br />
          <br />
          Select your Language
          <br />
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  </StrictMode>,
)
