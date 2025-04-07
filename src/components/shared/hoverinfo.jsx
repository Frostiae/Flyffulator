import { useTooltip } from "../../tooltipcontext";
import { useRef } from 'react';

function HoverInfo({ text, icon="info-icon.svg", link=null }) {
    const { showTooltip, hideTooltip } = useTooltip();
    const iconRef = useRef(null);

  function toggleTooltip(enabled) {
    if (text == null) {
      return;
    }

    if (enabled) {
      const settings = {
        rect: iconRef.current.getBoundingClientRect(),
        text: text
      };
      showTooltip(settings);
    }
    else {
      hideTooltip();
    }
  }

    return (
      <a href={link} target="_blank">
        <img src={icon} className="info-icon" onMouseEnter={() => toggleTooltip(true)} onMouseLeave={() => toggleTooltip(false)} ref={iconRef} />
      </a>
    );
}

export default HoverInfo;
