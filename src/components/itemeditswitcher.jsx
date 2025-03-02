import ItemEdit from "./itemedit";
import ItemEditPet from "./itemeditpet";

function ItemEditSwitcher({ itemElem }) {
    const category = itemElem?.itemProp?.category ?? null;
    
    switch(category) {
        case "raisedpet": 
            return <ItemEditPet itemElem={itemElem} />
        default:
            return <ItemEdit itemElem={itemElem} />
    }
}

export default ItemEditSwitcher;