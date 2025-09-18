import { Big } from 'big.js';

export const getAtkSpeed = (value) => {
    if (value <= 0.39) { return "早い"; }
    else if (value <= 0.79) { return "やや早い"; }
    else if (value <= 1.09) { return "普通"; }
    else if (value <= 1.29) { return "やや遅い"; }
    else { return "遅い"; }
}
  
export const getPosition = (value) => {
    if (value <= 250) { return "前列"; }
    else if (value <= 450) { return "中列"; }
    else { return "後列"; }
}

export const parseIntOnlyString = (value) => {
    if (typeof value === 'string' || typeof value === 'number') {
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        return num;
      }
    }
    return NaN;
}

export const toBig = (value) => {
  if (value instanceof Big) {
    return value;
  }

  if (typeof value === 'string' || typeof value == 'number') {
    return new Big(value);
  }

  throw new Error('Invalid value type for Big conversion');
}

export const calcWaitTime = (freeze_time, wait_show_time, atk_speed) => {
  try {
  const c = 0.81
  const ft = toBig(freeze_time);
  const wst = toBig(wait_show_time);
  return ft.plus("0.125").plus(wst).div(new Big(1).plus(toBig(atk_speed ?? 0).mul(new Big(c))));
  } catch (e) {
    console.error(e);
  }
  //return (freeze_time + 0.125 + wait_show_time) / (1 + atk_speed + c)
}

export const abiNameConvTable = {
  hp: "HP",
  atk: "物理攻擊",
  def: "物理防禦",
  atk_crit: "物理爆擊",
  hit: "命中",
  block: "格擋",
  matk: "魔法攻擊",
  mdef: "魔法防禦",
  matk_crit: "魔法爆擊",
  mp_recovery: "MP回復"
}

export const statisticConvTable = {
  // 無,
  hp: "HP",
  atk: "物理傷害",
  matk: "魔法傷害",
  def: "物理防禦",
  mdef: "魔法防禦",
  hit: "命中",
  block: "格檔",
  atk_crit: "物理爆擊",
  matk_crit: "魔法爆擊",
  end_hp_recovery: "結束回復HP",
  end_mp_recovery: "結束回復MP",
  dmg_suck_hp: "傷害吸取HP",
  healing_power: "治癒力",
  mp_recovery: "MP回復",
  mp_cost_down: "MP消耗降低",

  // 胸圍,
  // 技能傷害百分比,
  // 技能傷害加成值,
  // 奧義傷害百分比,
  // 奧義傷害加成值,
  // 普攻傷害百分比,
  // 普攻傷害加成值
}

export const timeErrorMsg = (freeze_time, wait_show_time) => {
  if (freeze_time == null || freeze_time == "0") {
    return "硬直時間を取得できません(おそらくバグ)";
  }
  if (wait_show_time == null || wait_show_time == "0") {
    return "エフェクトが無いため短い硬直のスキルです(おそらくバグ)"
  }
  return "";
}