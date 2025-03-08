import { useTooltip } from "../../tooltipcontext";

function Tooltip() {
    const { isTooltipOpen, tooltipContent } = useTooltip();

    if (!isTooltipOpen) {
        return null;
    }

    return (
        <div className="tooltip" style={{left: tooltipContent.rect.x + tooltipContent.rect.width + 5, top: tooltipContent.rect.y}}>
            {tooltipContent.text}
        </div>
    );
}

export default Tooltip;
