import { useState, useRef } from "react";
import NumberInput from "./numberinput";

function RangeInput({ min, max, step = 0.1, value, onChange, isRange = false, disabled, prefix }) {
    const [val, setVal] = useState(value);
    const numberInput = useRef(null);

    function changeSlider(e) {
        onChange(e.target.value);
        setVal(e.target.value);
        numberInput.current.refresh(e.target.value);
    }

    function changeInput(e) {
        onChange(e);
        setVal(e);
    }

    return (
        <div className="flyff-range" >
            <input type="range" min={min} max={max} id="range" onChange={changeSlider} disabled={disabled} step={step} value={val}/>
            <NumberInput ref={numberInput} min={min} max={max} prefix={prefix} suffix={isRange && "%"} onChange={changeInput} value={val} />
        </div>
    );
}

export default RangeInput;