import { useState, useEffect } from "react";

function NumberInput({ min, max, value, onChange, label, hasButtons, prefix, suffix }) {
    const [refresh, setRefresh] = useState(false);
    const [val, setVal] = useState(value);

    useEffect(() => {
        setVal(value);
    }, [value]);

    function handleChange(input, blur) {
        if (typeof input == "string") {
            if (prefix) {
                input = input.replaceAll(prefix, "");
            }
    
            if (suffix) {
                input = input.replaceAll(suffix, "");
            }
        }

        if (blur) {
            input = parseFloat(input) || min;
            input = Math.max(input, min);
            input = Math.min(input, max);

            onChange(input);
        }
        
        setVal(input);
        setRefresh(!refresh);
    }

    return (
        <div className="row" style={{ justifyContent: "space-between" }}>
            <label htmlFor={label}>{label}</label>
            {
                hasButtons &&
                <button className="flyff-button small" onClick={() => { handleChange(val - 1, true) }}>-</button>
            }
            <input type="text" id={label} onBlur={(e) => handleChange(e.target.value, true)} onChange={(e) => handleChange(e.target.value, false)} value={`${prefix ? prefix : ""}${val}${suffix ? suffix : ""}`} />
            {
                hasButtons &&
                <button className="flyff-button small" onClick={() => { handleChange(val + 1, true) }}>+</button>
            }
        </div>
    );
}

export default NumberInput;