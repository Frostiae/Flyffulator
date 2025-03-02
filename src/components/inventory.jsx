import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSearch } from '../searchcontext';
import { OrbitControls } from '@react-three/drei';

import Slot from '../components/slot';
import Loader from './fallbackloader';
import PlayerModel from './playermodel';
import Context from '../flyff/flyffcontext';
import * as Utils from "../flyff/flyffutils";
import { useTranslation } from "react-i18next";

function Inventory({ onSelectItem }) {
  const [refresh, setRefresh] = useState(false);
  const { t } = useTranslation();

  const { showSearch } = useSearch();
  const mainhandSlot = useRef(null);
  const offhandSlot = useRef(null);
  const cloakSlot = useRef(null);
  const maskSlot = useRef(null);
  const ring1Slot = useRef(null);
  const earring1Slot = useRef(null);
  const necklaceSlot = useRef(null);
  const ring2Slot = useRef(null);
  const earring2Slot = useRef(null);
  const helmetSlot = useRef(null);
  const suitSlot = useRef(null);
  const gauntletsSlot = useRef(null);
  const bootsSlot = useRef(null);

  function selectSlot(subcategory, category, slotRef, onSet) {
    if (slotRef.current.content != null) {
      onSelectItem(slotRef.current.content);
    }
    else {
      showSearch({ type: "item", checkCanUse: true, subcategory: subcategory, category: category, onSet: onSet });
    }
  }

  function removeItem(slot) {
    if (slot == "mainhand") {
      Context.player.equipment[slot] = Utils.DEFAULT_WEAPON;
    }
    else {
      Context.player.equipment[slot] = null;
    }
    onSelectItem(null);
    setRefresh(!refresh);
  }

  function updateEquipSets() {
    Context.player.updateEquipSets();
  }

  return (
    <div className="inventory">
      <div id="inventory-side">
        <div onClick={() => selectSlot(null, "weapon", mainhandSlot, (result) => { Context.player.equipment.mainhand = result; Context.player.equipment.offhand = result.itemProp.twoHanded ? null : Context.player.equipment.offhand; })}>
          <Slot backgroundIcon='/mainhand.png' className={"slot-equipment slot-editable"} ref={mainhandSlot} onRemove={() => removeItem("mainhand")}
            content={Context.player.equipment.mainhand.itemProp.subcategory == "hand" ? null : Context.player.equipment.mainhand}
          />
        </div>
        <div onClick={Context.player.equipment.mainhand.itemProp.twoHanded ? null : () => selectSlot(Context.player.job.id == 2246 ? null :"shield", Context.player.job.id == 2246 ? "weapon" : null, offhandSlot, (result) => { Context.player.equipment.offhand = result })}>
          <Slot backgroundIcon='/offhand.png' className={`slot-equipment slot-editable ${Context.player.equipment.mainhand.itemProp.twoHanded ? "slot-disabled" : ""}`} ref={offhandSlot} onRemove={Context.player.equipment.mainhand.itemProp.twoHanded ? null : () => removeItem("offhand")}
            content={Context.player.equipment.mainhand.itemProp.twoHanded ? Context.player.equipment.mainhand : Context.player.equipment.offhand} />
        </div>
        <div onClick={() => selectSlot("cloak", null, cloakSlot, (result) => { Context.player.equipment.cloak = result })}>
          <Slot removable={true} backgroundIcon='/cloak.png' className={"slot-equipment slot-editable"} ref={cloakSlot} onRemove={() => removeItem("cloak")}
            content={Context.player.equipment.cloak} />
        </div>
        <div onClick={() => selectSlot("mask", null, maskSlot, (result) => { Context.player.equipment.mask = result })}>
          <Slot removable={true} backgroundIcon='/mask.png' className={"slot-equipment slot-editable"} ref={maskSlot} onRemove={() => removeItem("mask")}
            content={Context.player.equipment.mask} />
        </div>
      </div>
      <div id="inventory-middle">
        <div id="inventory-side">
          <div onClick={() => selectSlot("ring", null, ring1Slot, (result) => { Context.player.equipment.ring1 = result; updateEquipSets(); })}>
            <Slot removable={true} backgroundIcon='/ring.png' className={"slot-equipment slot-editable"} ref={ring1Slot} onRemove={() => removeItem("ring1")}
              content={Context.player.equipment.ring1} />
          </div>
          <div onClick={() => selectSlot("earring", null, earring1Slot, (result) => { Context.player.equipment.earring1 = result; updateEquipSets(); })}>
            <Slot removable={true} backgroundIcon='/earring.png' className={"slot-equipment slot-editable"} ref={earring1Slot} onRemove={() => removeItem("earring1")}
              content={Context.player.equipment.earring1} />
          </div>
          <div onClick={() => selectSlot("necklace", null, necklaceSlot, (result) => { Context.player.equipment.necklace = result; updateEquipSets(); })}>
            <Slot removable={true} backgroundIcon='/necklace.png' className={"slot-equipment slot-editable"} ref={necklaceSlot} onRemove={() => removeItem("necklace")}
              content={Context.player.equipment.necklace} />
          </div>
          <div onClick={() => selectSlot("earring", null, earring2Slot, (result) => { Context.player.equipment.earring2 = result; updateEquipSets(); })}>
            <Slot removable={true} backgroundIcon='/earring.png' className={"slot-equipment slot-editable"} ref={earring2Slot} onRemove={() => removeItem("earring2")}
              content={Context.player.equipment.earring2} />
          </div>
          <div onClick={() => selectSlot("ring", null, ring2Slot, (result) => { Context.player.equipment.ring2 = result; updateEquipSets(); })}>
            <Slot removable={true} backgroundIcon='/ring.png' className={"slot-equipment slot-editable"} ref={ring2Slot} onRemove={() => removeItem("ring2")}
              content={Context.player.equipment.ring2} />
          </div>
        </div>
        <div id='inventory-model'>
          <img src="/flyff.png" alt="flyff" id="flyff-logo" draggable={false} />
          <div className="player-model">
            <Canvas camera={{ fov: 30, position: [0, 1, 3.5] }}>
              <Suspense fallback={<Loader />}>
                <ambientLight intensity={Math.PI / 2} />
                <PlayerModel />
                <OrbitControls target={[0, 0.8, 0]} enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />
              </Suspense>
            </Canvas>
            <i id="model-info">{t("model_not_accurate")}</i>
          </div>
        </div>
      </div>
      <div id="inventory-side">
        <div onClick={() => selectSlot("helmet", null, helmetSlot, (result) => { Context.player.equipment.helmet = result; updateEquipSets(); })}>
          <Slot removable={true} backgroundIcon='/helmet.png' className={"slot-equipment slot-editable"} ref={helmetSlot} onRemove={() => removeItem("helmet")}
            content={Context.player.equipment.helmet} />
        </div>
        <div onClick={() => selectSlot("suit", null, suitSlot, (result) => { Context.player.equipment.suit = result; updateEquipSets(); })}>
          <Slot removable={true} backgroundIcon='/suit.png' className={"slot-equipment slot-editable"} ref={suitSlot} onRemove={() => removeItem("suit")}
            content={Context.player.equipment.suit} />
        </div>
        <div onClick={() => selectSlot("gauntlet", null, gauntletsSlot, (result) => { Context.player.equipment.gauntlets = result; updateEquipSets(); })}>
          <Slot removable={true} backgroundIcon='/gloves.png' className={"slot-equipment slot-editable"} ref={gauntletsSlot} onRemove={() => removeItem("gauntlets")}
            content={Context.player.equipment.gauntlets} />
        </div>
        <div onClick={() => selectSlot("boots", null, bootsSlot, (result) => { Context.player.equipment.boots = result; updateEquipSets(); })}>
          <Slot removable={true} backgroundIcon='/boots.png' className={"slot-equipment slot-editable"} ref={bootsSlot} onRemove={() => removeItem("boots")}
            content={Context.player.equipment.boots} />
        </div>
      </div>
    </div>
  )
}

export default Inventory;
