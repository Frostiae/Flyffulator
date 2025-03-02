import * as Utils from "../../flyff/flyffutils"

function PetTier({ petTier, petTierLevel, isEditable = false, currentlyEditing = false, onChange = null, onClick = null, canRemove = false }) {
    return (
        <div className={`flyff-pet-tier ${isEditable ? "" : "disabled"}`}>
            <img src={`pets/petlevels/${petTier}.png`} onMouseDown={() => onClick()} id="pet-tier" />

            {
                petTierLevel &&
                <img src={`pets/petlevels/${petTierLevel}.png`} onMouseDown={() => onClick()} id="pet-level" />
            }

            {currentlyEditing && (
                <div id='level-select'>
                    {Utils.getPetOptionsForTier(petTier).map((level) => {
                        if (level == 0) return null;
                        return <img key={level} onClick={() => onChange(level)} src={`pets/petlevels/${level.toString()}.png`} />
                    })}
                </div>
            )}

            {canRemove && (
                <button className="flyff-close-button" onClick={() => onChange(null)}><img src="close-icon.svg" alt="remove" /></button>
            )}
        </div>
    )
}

export default PetTier;