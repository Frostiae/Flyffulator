import { useEffect, useState } from "react";
import NumberInput from "./numberinput";

function RangeInput({ min, max, step = 0.1, value, onChange, isRange, disabled, prefix, allowedValues }) {
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    function handleChange(newValue) {
        let v = parseFloat(newValue);

        if (allowedValues != null && allowedValues.length > 0) {
            var closest = allowedValues.reduce(function (prev, curr) {
                return (Math.abs(curr - newValue) < Math.abs(prev - newValue) ? curr : prev);
            });
            v = closest;
        }

        setCurrentValue(v);
        onChange(v);
    }

    let minValue = min;
    let maxValue = max;
    if (allowedValues != null && allowedValues.length > 0) {
        minValue = Math.min(...allowedValues);
        maxValue = Math.max(...allowedValues);
    }

    return (
        <div className="flyff-range" >
            <input type="range" min={minValue} max={maxValue} id="range" onChange={(e) => handleChange(e.target.value)} disabled={disabled} step={step} value={currentValue} />
            <NumberInput min={minValue} max={maxValue} prefix={prefix} suffix={isRange && "%"} onChange={handleChange} value={currentValue} />
        </div>
    );
}

export default RangeInput;