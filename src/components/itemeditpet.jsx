import { useState } from 'react';

import PetWindow from './pet/petwindow';
import * as Utils from './../flyff/flyffutils'

function ItemEditPet({ itemElem }) {
    const [currentPetLevels, setPetLevels] = useState(itemElem.petStats);
    
    function updateLevels(levels) {
        itemElem.petStats = levels;

        setPetLevels((prevLevels) => ({...prevLevels, ...levels}))
    }

    return (
        <PetWindow
            raisedPetDefinition = {Utils.getPetDefinitionByItemId(itemElem.itemProp.id)}
            petLevels = {currentPetLevels}
            editable = {true}
            onEditLevels = {(levels) => updateLevels(levels)}
        />
    )
}

export default ItemEditPet;
