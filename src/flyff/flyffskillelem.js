/**
 * An instance of an in-game skill.
 */
export default class SkillElem {
    skillProp = null; // Static game skill property from the API
    isFromBuffer = false;

    constructor(skillProp, isFromBuffer = false) {
        this.skillProp = skillProp;
        this.isFromBuffer = isFromBuffer;
    }
}
