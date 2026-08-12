import { useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { useTooltip } from '../../../tooltipcontext';
import { createTooltip } from '../../../flyff/flyfftooltip';
import * as Utils from '../../../flyff/flyffutils';
import { useTranslation } from "react-i18next";

import '../../../styles/equipment.scss';
import Skill from '../../../flyff/flyffskill';

function Slot({ backgroundIcon, content, className, onRemove, showStacks = true }, ref) {
  const { showTooltip, hideTooltip } = useTooltip();
  const slotRef = useRef(null);
  const { i18n } = useTranslation();
  const [ skillStacks, setSkillStacks ] = useState(content instanceof Skill ? content.stacks : 0);

  function toggleTooltip(enabled) {
    if (content == null) {
      return;
    }

    if (enabled) {
      const settings = {
        rect: slotRef.current.getBoundingClientRect(),
        text: createTooltip(content, i18n)
      };
      showTooltip(settings);
    }
    else {
      hideTooltip();
    }
  }

  useImperativeHandle(ref, () => ({
    content: content
  }));

  function clearSlot(e) {
    e.stopPropagation();
    onRemove(content);
    toggleTooltip(false);
  }

  function addNum(num) {
    if (content == null) {
      return;
    }

    if (content instanceof Skill) {
      content.addStacks(num);
      setSkillStacks(content.stacks);
    }
  }

  return (
    <div className={`slot ${className}`}
      onMouseEnter={() => toggleTooltip(true)}
      onMouseLeave={() => toggleTooltip(false)}
      ref={slotRef}>
      {
        backgroundIcon != null && backgroundIcon.length > 0 &&
        <img src={backgroundIcon} draggable={false} id="placeholder" />
      }

      {
        content != null &&
        <>
          {
            (content.itemProp != undefined) ? 
            <img src={`https://api.flyff.com/image/item/${content.itemProp.icon}`} draggable={false} id="slot-content" />
            :
            <img src={`https://api.flyff.com/image/skill/colored/${content.skillProp?.icon ?? content.icon}`} draggable={false} id="slot-content" />
          }

          {
            (content.skillProp == undefined && content.itemProp && content.itemProp.rarity != "common") &&
            <div id="slot-rarity-corner" style={{
              background: `linear-gradient(45deg, #ffffff00 0%, #ffffff00 50%, ${Utils.getItemNameColor(content.itemProp)} 51%, ${Utils.getItemNameColor(content.itemProp)} 100%)`
            }}></div>
          }

          {
            (showStacks && content.skillProp != undefined && content.levelProp != undefined && content.levelProp.maxSkillStacks != undefined) &&
            <>
              <span className="skill-stacks-num">{skillStacks}</span>
              <button disabled={skillStacks == content.levelProp.maxSkillStacks} onClick={() => addNum(1)} className="flyff-button small" style={{position: "absolute", top: -3, right: -3, width: "15px", height: "15px", display: "flex", alignItems: "center"}}>+</button>
              <button disabled={skillStacks == 1} onClick={() => addNum(-1)} className="flyff-button small" style={{position: "absolute", bottom: -3, right: -3, width: "15px", height: "15px", display: "flex", alignItems: "center", justifyContent: "center"}}>-</button>
            </>
          }

          {
            onRemove != undefined &&
            <button className="flyff-close-button" onClick={(e) => clearSlot(e)}>
              <img src="close-icon.svg" alt="remove" />
            </button>
          }
        </>
      }
    </div>
  )
}

export default forwardRef(Slot);
