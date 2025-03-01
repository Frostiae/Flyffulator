import { useState } from "react";

function Dropdown({ options, onSelectionChanged, valueKey }) {
    const [opened, setOpened] = useState(false);

    if (options == null || Object.keys(options).length == 0) {
        return null;
    }

    function selectOption(optionIndex, optionKey) {
        setOpened(false);
        onSelectionChanged(optionKey);
    }

    return (
        <div className="flyff-dropdown" >
            <span onClick={() => setOpened(!opened)} className="flyff-dropdown-arrow">
                {options[valueKey]}
                <img style={{transform: opened ? "scale(-1)" : "scale(1)"}} draggable={false} src="/arrow-down.png" />
            </span>
            {
                opened &&
                <div className="flyff-dropdown-options">
                    {
                        Object.entries(options).map(([key, value], i) => (
                            <option value={key} key={key} onClick={() => selectOption(i, key)}>{value}</option>
                        ))
                    }
                </div>
            }
        </div>
    );
}

export default Dropdown;