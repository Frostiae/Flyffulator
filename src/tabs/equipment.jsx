import { useState } from 'react';
import '../styles/equipment.scss';
import Inventory from '../components/inventory';
import ItemEdit from '../components/itemedit';

function Equipment() {
  const [selectedItemElem, setSelectedItemElem] = useState(null);

  return (
    <div id="equipment">
      <Inventory onSelectItem={setSelectedItemElem}/>
      <ItemEdit itemElem={selectedItemElem} />
    </div>
  )
}

export default Equipment;
