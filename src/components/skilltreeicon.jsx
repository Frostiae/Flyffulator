import { useRef } from 'react';
import { useTooltip } from '../tooltipcontext';
import { createTooltip } from '../flyff/flyfftooltip';
import { useTranslation } from "react-i18next";

function SkillTreeIcon({ skillElem, disabled, level, clickHandle, rightClickHandle }) {
    const { showTooltip, hideTooltip } = useTooltip();
    const slotRef = useRef(null);
    const { i18n } = useTranslation();
    var shortCode = "en";
    if(i18n.resolvedLanguage) {
        shortCode = i18n.resolvedLanguage.split('-')[0];
    }

    const levelText = level == skillElem.skillProp.levels.length ? "MAX" : level;

    function toggleTooltip(enabled) {
        if (skillElem == null) {
            return;
        }

        if (enabled) {
            const settings = {
                rect: slotRef.current.getBoundingClientRect(),
                text: createTooltip(skillElem, i18n)
            };
            showTooltip(settings);
        }
        else {
            hideTooltip();
        }
    }

    const xPos = skillElem.skillProp.treePosition.x * 2;
    const yPos = skillElem.skillProp.treePosition.y * 2;

    return (
        <div onClick={clickHandle} onContextMenu={rightClickHandle} className={`skill-tree-icon ${disabled && "disabled"} ${level > 0 && "active"}`}
            style={{ left: xPos, top: yPos }}
            onMouseEnter={() => toggleTooltip(true)}
            onMouseLeave={() => toggleTooltip(false)}
            ref={slotRef}
        >
            <img
                key={skillElem.skillProp.id}
                src={`https://api.flyff.com/image/skill/colored/${skillElem.skillProp.icon}`}
                alt={skillElem.skillProp.name[shortCode] ?? skillElem.skillProp.name.en}
                style={{
                    width: 50, height: 50,
                    transform: "scale(1.15)"
                }}
            />
            <b id="skill-level">{(!disabled && level > 0) && levelText}</b>
        </div>
    );
}

export default SkillTreeIcon;