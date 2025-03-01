function RangeInput({ min, max, step = 0.1, value, onChange, isRange = false, disabled, prefix }) {
    return (
        <div className="flyff-range" >
            <input type="range" min={min} max={max} id="range" onChange={onChange} disabled={disabled} step={step} value={value}/>
            <label htmlFor="range">{prefix}{value}{isRange && "%"}</label>
        </div>
    );
}

export default RangeInput;