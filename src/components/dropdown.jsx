import { useState } from "react";

function Dropdown({ options, onSelectionChanged, valueKey, onRemove }) {
    const [opened, setOpened] = useState(false);

    if (options == null || Object.keys(options).length == 0) {
        return null;
    }

    function selectOption(optionKey) {
        setOpened(false);
        onSelectionChanged(optionKey);
    }

    function removeOption(e, optionKey) {
        e.stopPropagation();
        onRemove(optionKey);
      }

    return (
        <div className="flyff-dropdown" >
            <span onClick={() => setOpened(!opened)} className="flyff-dropdown-arrow">
                {options[valueKey]}
                <img style={{ transform: opened ? "scale(-1)" : "scale(1)" }} draggable={false} src="/arrow-down.png" />
            </span>
            {
                opened &&
                <div className="flyff-dropdown-options">
                    {
                        Object.entries(options).map(([key, value], ) => (
                            <div key={key} style={{position: "relative"}}>
                                <option value={key} onClick={() => selectOption(key)}>{value}</option>
                                {
                                    onRemove != undefined &&
                                    <button className="flyff-close-button right" onClick={(e) => removeOption(e, key)}>
                                      <img src="close-icon.svg" alt="remove" />
                                    </button>
                                }
                            </div>
                        ))
                    }
                </div>
            }
        </div>
    );
}

export default Dropdown;