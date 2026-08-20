import { API } from '../data';

/**
 * An instance of an in-game skill.
 */
export default class Skill {
  skillProp = null;
  levelProp = null;
  level = 1;
  stacks = 1;

  constructor(skillProp, level, stacks = 1) {
    this.skillProp = skillProp;
    if (skillProp.levels) {
      this.levelProp = skillProp.levels[level - 1];
      this.level = level;
    }

    if (!this.levelProp) {
      console.error(`No levelprop found for skill ${skillProp.name.en} with level ${level}`);
    }

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

    this.stacks = Math.max(1, Math.min(this.stacks + num, this.levelProp.maxSkillStacks ?? 1));
  }

  toJSON() {
    return { id: this.skillProp.id, level: this.level, stacks: this.stacks };
  }
}