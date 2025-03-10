import { Canvas } from '@react-three/fiber';
import { useTranslation } from "react-i18next";
import { useTooltip } from '../../tooltipcontext';
import { Suspense, useState, useRef } from "react";
import { createTooltip } from '../../flyff/flyfftooltip';

import PetTier from "./pettier";
import Loader from "../fallbackloader";
import PlayerModel from "../playermodel";
import items from "../../assets/Items.json";
import Context from "../../flyff/flyffcontext";
import Localizer from '../localizer';
import * as Utils from "./../../flyff/flyffutils";

function PetWindow({ raisedPetDefinition, petLevels, editable = false, onEditLevels = null }) {
    const { showTooltip, hideTooltip } = useTooltip();
    const [currentlyEditingTier, setEditingTier] = useState(null);
    const slotRef = useRef(null);
    const { i18n } = useTranslation();
    var shortLanguageCode = "en";
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0];
    }

    function toggleTooltip(enabled) {
        if (Context.player.equipment.pet == null) {
            return;
        }

        if (enabled) {
            const settings = {
                rect: slotRef.current.getBoundingClientRect(),
                text: createTooltip(Context.player.equipment.pet, i18n)
            };
            showTooltip(settings);
        }
        else {
            hideTooltip();
        }
    }

    function tierIsEditable(tier) {
        const tierIndex = Object.keys(petLevels).findIndex((key) => key === tier);
        if (tierIndex === 0) return false;

        const nextSmallerTier = Object.keys(petLevels)[tierIndex - 1];
        if (!petLevels[nextSmallerTier]) return false;

        return editable;
    }

    function setLevel(tier, level) {
        petLevels[tier] = level;

        if (editable) {
            setEditingTier(null)
            onEditLevels(petLevels)
        }
    }

    return (
        <div className="pet-edit">
            <div className="window-title">{items[raisedPetDefinition.petItemId].name[shortLanguageCode] ?? items[raisedPetDefinition.petItemId].name.en}</div>
            <div className="window-content">
                <div id="base-container">
                    <div id="image-container" ref={slotRef}
                        onMouseEnter={() => toggleTooltip(true)}
                        onMouseLeave={() => toggleTooltip(false)}>
                        <Canvas camera={{ fov: 20, position: Utils.getPetCameraPosition(raisedPetDefinition.petItemId) }}
                            onCreated={({ camera }) => {
                                const lookAt = Utils.getPetCameraLookAt(raisedPetDefinition.petItemId);
                                camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
                            }}
                        >
                            <Suspense fallback={<Loader />}>
                                <ambientLight intensity={Math.PI / 2} />
                                <PlayerModel modelPath={Utils.getPetModelPath(raisedPetDefinition.petItemId)} />
                            </Suspense>
                        </Canvas>
                    </div>


                    <div id="stats-container">
                        <div className="stat-group">
                            <span className='stat-title'>Tier</span>
                            <span className='stat-value'>{Utils.getPetTierByLevels(petLevels)} Tier</span>
                        </div>

                        <div className="stat-group">
                            <span className='stat-title'>Stat</span>
                            <span className='stat-value'>{`${<Localizer prefix="stat_" parameter={raisedPetDefinition.parameter}/>} +${Utils.getPetStatSum(raisedPetDefinition, petLevels)}${raisedPetDefinition.rate ? '%' : ''}`}</span>
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
                            isEditable={tierIsEditable(tier)}
                            onChange={(level) => setLevel(tier, level)}
                            onClick={() => tierIsEditable(tier) ? setEditingTier((prev) => prev === tier ? null : tier) : null}
                            canRemove={index === Object.values(petLevels).filter(n => n).length - 1 && tierIsEditable(tier)}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default PetWindow;