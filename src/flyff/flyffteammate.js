export default class Teammate {
    level = 1;
    name = "";
    master = false;
    cheered = false;
    healer = false;
    tanker = false;
    contribution = 0;

    /**
     * The total amount of damage this teammate did to the monster as a percentage of their HP.
     */
    totalDamageFactor = 0;

    constructor(lvl) {
        this.level = lvl;
    }
}