import Big from 'big.js';

import { calcWaitTime } from './_util.mjs';

export class ScaleCheck  {
  constructor() {
    this.name = "";
    this.attack = new Big(0);
    this.crit = new Big(0);
    this.skill1 = new Big(0);
    this.skill2 = new Big(0);
    this.mergedTimeline = [];
  }

  build(scale, json) {
    this.name = new Big(scale).mul(100).toFixed(0) + "%";
    this.attack = calcWaitTime(json.atkskill.freezeTime, json.atkskill.waitShowTime, scale);
    this.crit = calcWaitTime(json.atkskill.freezeTime, json.atkskill.crit_waitShowTime, scale);
    this.skill1 = calcWaitTime(json.skill1.freezeTime, json.skill1.waitShowTime, scale);
    this.skill2 = calcWaitTime(json.skill2.freezeTime, json.skill2.waitShowTime, scale);

    const first_result = this.makeTimeline(json.first_skill_order);
    const first_timeline = first_result.timeline;
    const loop_result = this.makeTimeline(json.loop_skill_order, first_result.totalTime);
    const loop_timeline = loop_result.timeline;

    const firstLastTime = new Big(first_timeline[first_timeline.length - 1]);
    const loopFirstTime = new Big(loop_timeline[0]);
    const connectionDiff = loopFirstTime.minus(firstLastTime).toFixed(1, Big.roundHalfEven);
    this.mergedTimeline = [
      ...first_timeline.map(item => {
        if (!item.endsWith('s')) { return item + 's'; }
        return item;
      }), 
      `+${connectionDiff}s`, 
      ...loop_timeline.map(item => {
        if (!item.endsWith('s')) { return item + 's'; }
        return item;
      })
    ];

    this.attack = this.getAttackText();
    this.crit = this.getCritText();
    this.skill1 = this.getSkill1Text();
    this.skill2 = this.getSkill2Text();
  }

  getAttackText() {
    return this.attack.toFixed(2, Big.roundUp);
  }

  getCritText() {
    return this.crit.toFixed(2, Big.roundUp);
  }

  getSkill1Text() {
    return this.skill1.toFixed(2, Big.roundUp);
  }

  getSkill2Text() {
    return this.skill2.toFixed(2, Big.roundUp);
  }

  makeTimeline(order, totalTime) {
    const timeline = [];
    if (totalTime === undefined) {
      totalTime = new Big(0);
    }
    order.split("").forEach((v, i) => {
      if (v.trim() === "1") {
        timeline.push(totalTime.toFixed(1, Big.roundHalfEven));
        totalTime = totalTime.plus(this.skill1);
      } else if (v.trim() === "2") {
        timeline.push(totalTime.toFixed(1, Big.roundHalfEven));
        totalTime = totalTime.plus(this.skill2);
      } else if (v.trim() === "0") {
        timeline.push(totalTime.toFixed(1, Big.roundHalfEven));
        totalTime = totalTime.plus(this.attack);
      } else {
        if (i > 0) {
          const diff = totalTime.minus(new Big(timeline[timeline.length - 1])).toFixed(1, Big.roundHalfEven);
          timeline.push(`+${diff}s`);
        } else {
          timeline.push("----");
        }
      }
    });
    return {timeline: timeline, totalTime: totalTime};
  }
}