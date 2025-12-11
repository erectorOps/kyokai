import { Big } from 'big.js';

export const getAtkSpeed = (value) => {
    if (value <= 0.39) { return "早い"; }
    else if (value <= 0.79) { return "やや早い"; }
    else if (value <= 1.09) { return "普通"; }
    else if (value <= 1.29) { return "やや遅い"; }
    else { return "遅い"; }
}
  
export const getPositionJa = (value) => {
    if (value <= 250) { return "前列"; }
    else if (value <= 450) { return "中列"; }
    else { return "後列"; }
}

export const getPositionKey = (value) => {
    if (value <= 250) { return "position_front"; }
    else if (value <= 450) { return "position_middle"; }
    else { return "position_back"; }
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

export const calcStatisticValue = (base, growth, level) => {
  return parseFloat(base) + parseFloat(growth) * (level - 1);
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

export const statisticConvArray = [
  "無",
  "HP",
  "物理傷害",
  "魔法傷害",
  "物理防禦",
  "魔法防禦",
  "命中",
  "格檔",
  "物理爆擊",
  "魔法爆擊",
  "結束回復HP",
  "結束回復MP",
  "傷害吸取HP",
  "治癒力",
  "MP回復",
  "MP消耗降低",
  "胸圍",
  "技能傷害百分比",
  "技能傷害加成值",
  "奧義傷害百分比",
  "奧義傷害加成值",
  "普攻傷害百分比",
  "普攻傷害加成值"
]

export const statisticConvNameArray = [
  "なし",
  "HP",
  "物理攻撃", 
  "魔法攻撃", 
  "物理防御", 
  "魔法防御",
  "命中", 
  "ブロック", 
  "物理クリティカル", 
  "魔法クリティカル", "HP回復", "MP回復", "HP吸収", "治癒", 
  "MPチャージ", "MP消費減少",
  "バスト",
  "スキルダメージ割合",
  "スキルダメージ追加値",
  "奥義ダメージ割合",
  "奥義ダメージ追加値",
  "通常攻撃ダメージ割合",
  "通常攻撃ダメージ追加値"
]

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