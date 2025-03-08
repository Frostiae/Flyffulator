import { useState } from 'react';
import './equipment.scss';
import Inventory from './inventory/inventory';
import ItemEditSwitcher from './itemedit/itemeditswitcher';

function Equipment() {
  const [selectedItemElem, setSelectedItemElem] = useState(null);

  return (
    <div id="equipment">
      <Inventory onSelectItem={setSelectedItemElem}/>
      <ItemEditSwitcher itemElem={selectedItemElem} />
    </div>
  )
}

export default Equipment;
