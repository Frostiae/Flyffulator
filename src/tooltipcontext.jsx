import { createContext, useState, useContext } from "react";

const TooltipContext = createContext(undefined);

export function TooltipProvider({ children }) {
    const [tooltipContent, setTooltipContent] = useState(null);
    const [isTooltipOpen, setTooltipOpen] = useState(false);

    function showTooltip(content) {
        setTooltipContent(content);
        setTooltipOpen(true);
    }

    function hideTooltip() {
        setTooltipContent(null);
        setTooltipOpen(false);
    }

    return (
        <TooltipContext.Provider value={{ showTooltip, hideTooltip, isTooltipOpen, tooltipContent }}>
            {children}
        </TooltipContext.Provider>
    );
}

export function useTooltip() {
    return useContext(TooltipContext);
}