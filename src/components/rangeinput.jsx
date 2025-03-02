import NumberInput from "./numberinput";

function RangeInput({ min, max, step = 0.1, value, onChange, isRange, disabled, prefix }) {
    return (
        <div className="flyff-range" >
            <input type="range" min={min} max={max} id="range" onChange={(e) => onChange(e.target.value)} disabled={disabled} step={step} value={value}/>
            <NumberInput min={min} max={max} prefix={prefix} suffix={isRange && "%"} onChange={onChange} value={value} />
        </div>
    );
}

export default RangeInput;