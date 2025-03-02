import { useState } from "react";
import Items from "../../assets/Items.json"
import PetTier from "./pettier";
import * as Utils from "./../../flyff/flyffutils"

function PetWindow({raisedPetDefinition, petLevels, editable = false, onEditLevels = null}) {
    const [currentlyEditingTier, setEditingTier] = useState(null);

    function tierIsEditable(tier) {
        const tierIndex = Object.keys(petLevels).findIndex((key) => key === tier);
        if(tierIndex === 0) return false;

        const nextSmallerTier = Object.keys(petLevels)[tierIndex - 1];
        if(!petLevels[nextSmallerTier]) return false;

        return editable;
    }

    function setLevel(tier, level) {
        petLevels[tier] = level;

        if(editable) {
            setEditingTier(null)
            onEditLevels(petLevels)
        }
    }

    return (
        <div className="pet">
            <div className="window-title">{Items[raisedPetDefinition.petItemId].name.en}</div>
            <div className="window-content">
                <div id="base-container">
                    <div id="image-container">
                        <img src={`https://api.flyff.com/image/item/${Items[raisedPetDefinition.petItemId].icon}`}></img>
                    </div>

                    <div id="stats-container">
                        <div className="stat-group">
                            <span className='stat-title'>Tier</span>
                            <span className='stat-value'>{Utils.getPetTierByLevels(petLevels)} Tier</span>
                        </div>

                        <div className="stat-group">
                            <span className='stat-title'>Stat</span>
                            <span className='stat-value'>{`${raisedPetDefinition.parameter} +${Utils.getPetStatSum(raisedPetDefinition, petLevels)}${raisedPetDefinition.rate ? '%' : ''}`}</span>
                        </div>
                    </div>
                </div>
                
                <div id="level-container">
                    {Object.keys(petLevels).map((tier, index) => (
                        <PetTier
                            key={tier}
                            petTier={tier}
                            petTierLevel={petLevels[tier]}
                            currentlyEditing={currentlyEditingTier === tier}
                            onChange={(level) => setLevel(tier, level)}
                            onClick={() => tierIsEditable(tier) ? setEditingTier((prev) => prev === tier ? null : tier) : null}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default PetWindow;