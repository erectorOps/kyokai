import Big from 'big.js';
const calcBuff = (params, buff) => {
  if (buff["@_get_counter"]) {
    return;
  }
  const type = buff['@_effect_type'];
  const val1 = buff['@_effect_val1'] ? new Big(buff['@_effect_val1']).round(2, Big.roundHalfEven) :new Big(0);
  const val1_100 = val1.mul(100);
  const val2 = buff['@_effect_val2'] ? new Big(buff['@_effect_val2']).round(2, Big.roundHalfEven) :new Big(0);
  const val3 = buff['@_effect_val3'] ? new Big(buff['@_effect_val3']).round(2, Big.roundHalfEven) :new Big(0);
  const val4 = buff['@_effect_val4'] ? new Big(buff['@_effect_val4']).round(2, Big.roundHalfEven) :new Big(0);
  const val5 = buff['@_effect_val5'] ? new Big(buff['@_effect_val5']).round(2, Big.roundHalfEven) :new Big(0);
  const cval2 = buff['_counter_effect_val2'] ? new Big(buff['_counter_effect_val2']).round(2, Big.roundHalfEven) :new Big(0);

  switch(type)
  {
      case 'HP上限上升或下降':
        params.hp = params.hp.plus(val2).plus(cval2);
          break;

      case 'ATK上升或下降':
        params.atk = params.atk.plus(val2).plus(cval2);
          break;

      case 'MATK上升或下降':
        params.matk = params.matk.plus(val2).plus(cval2);
          break;

      case 'DEF上升或下降':
        params.def = params.def.plus(val2).plus(cval2);
          break;

      case 'MDEF上升或下降':
        params.mdef = params.mdef.plus(val2).plus(cval2);
          break;

      case '命中上升或下降':
        params.hit = params.hit.plus(val2).plus(cval2);
          break;

      case '迴避上升或下降':
        params.block = params.block.plus(val2).plus(cval2);
          break;

      case 'ATK爆擊上升或下降':
        params.atk_crit = params.atk_crit.plus(val2).plus(cval2);
          break;

      case 'MATK爆擊上升或下降':
        params.matk_crit = params.matk_crit.plus(val2).plus(cval2);
          break;

      case '治療量上升或下降':
        params.healing_power = params.healing_power.plus(val2).plus(cval2);
          break;

      case '吸血量上升或下降':
        params.dmg_suck_hp = params.dmg_suck_hp.plus(val2).plus(cval2);
          break;

      default:
          break;
  } 
}

export const calcPassive = (sid, params, kf) => {
  const s = kf.SkillSetting.find(item => item['@_id'] === sid);  
  for (const postFix of [
    ['A', "{5}", "{6}"],  //  バフ属性名の末尾, バフ効果量挿入文字列, バフ効果時間挿入文字列
    ['B', "{7}", "{8}"], 
    ['C', "{12}", "{13}"],
    ['D', "{27}", "{28}"]]) {
    const buffId = s['@_buff_id'+postFix[0]];
    const buffDur = s['@_buff_dur'+postFix[0]];
    //const buffIf = s['@_buff_if'+postFix[0]];
    //const buffTarget = s['@_buff_target'+postFix[0]]
    if (buffId) {
      const buff = kf.BuffSetting.find(item => item['@_id'] === buffId);
      if (buff !== undefined) {
        calcBuff(params, buff);
      }
    }
  }
}