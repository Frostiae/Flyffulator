import { useState } from 'react';
import '../styles/equipment.scss';
import Inventory from '../components/inventory';
import ItemEditSwitcher from '../components/itemeditswitcher';

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
