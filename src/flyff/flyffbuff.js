import { API } from '../data';

/**
 * An instance of an in-game buff.
 */
export default class Buff {
  skillProp = null;
  levelProp = null;
  level = 1;
  stacks = 1;

  constructor(skillProp, level, stacks = 1) {
    this.skillProp = skillProp;
    this.levelProp = (skillProp.levels ?? [])[level - 1];
    this.level = level;
    this.stacks = stacks;
  }

  /**
   * Add (or subtract) skill stacks from this buff.
   * @param {number} num The number of stacks to add.
   */
  addStacks(num) {
    if (!this.levelProp) {
      return;
    }

    stacks = Math.max(stacks + num, this.levelProp.maxSkillStacks ?? 1);
  }
}