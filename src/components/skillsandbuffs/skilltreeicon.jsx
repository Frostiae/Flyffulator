import { useRef } from 'react';
import { useTooltip } from '../../tooltipcontext';
import { createTooltip } from '../../flyff/flyfftooltip';
import { getFlyffLanguageShortCodeFromLanguage } from '../../flyff/flyffutils';
import { useTranslation } from "react-i18next";

function SkillTreeIcon({ skill, disabled, level, clickHandle, rightClickHandle }) {
    const { showTooltip, hideTooltip } = useTooltip();
    const slotRef = useRef(null);
    const { i18n } = useTranslation();
    var shortCode = "en";
    if(i18n.resolvedLanguage) {
        shortCode = getFlyffLanguageShortCodeFromLanguage(i18n);
    }

    const levelText = level == skill.levels.length ? "MAX" : level;

    function toggleTooltip(enabled) {
        if (skill == null) {
            return;
        }

        if (enabled) {
            const settings = {
                rect: slotRef.current.getBoundingClientRect(),
                text: createTooltip(skill, i18n)
            };
            showTooltip(settings);
        }
        else {
            hideTooltip();
        }
    }

    const xPos = skill.treePosition.x * 2;
    const yPos = skill.treePosition.y * 2;

    return (
        <div onClick={clickHandle} onContextMenu={rightClickHandle} className={`skill-tree-icon ${disabled && "disabled"} ${level > 0 && "active"}`}
            style={{ left: xPos, top: yPos }}
            onMouseEnter={() => toggleTooltip(true)}
            onMouseLeave={() => toggleTooltip(false)}
            ref={slotRef}
        >
            <img
                key={skill.id}
                src={`https://api.flyff.com/image/skill/colored/${skill.icon}`}
                alt={skill.name[shortCode] ?? skill.name.en}
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