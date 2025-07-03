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
          // text += "最大HP";
          // text += parseUpDown();
          break;

      case 'ATK上升或下降':
        params.atk = params.atk.plus(val2).plus(cval2);
        // text += "物理攻撃";
        // text += parseUpDown();
          break;

      case 'MATK上升或下降':
        params.matk = params.matk.plus(val2).plus(cval2);
        // text += "魔法攻撃";
        // text += parseUpDown();      
          break;

      case 'DEF上升或下降':
        params.def = params.def.plus(val2).plus(cval2);
      //   text += "物理防御";
      //   text += parseUpDown();
          break;

      case 'MDEF上升或下降':
        params.mdef = params.mdef.plus(val2).plus(cval2);
        // text += "魔法防御";
        // text += parseUpDown();
          break;

      case '命中上升或下降':
        params.hit = params.hit.plus(val2).plus(cval2);
        // text += "命中";
        // text += parseUpDown();
          break;

      case '迴避上升或下降':
        params.block = params.block.plus(val2).plus(cval2);
        // text += "ブロック";
        // text += parseUpDown();
          break;

      case 'ATK爆擊上升或下降':
        params.atk_crit = params.atk_crit.plus(val2).plus(cval2);
        // text += "物理クリティカル";
        // text +=  parseCrit();
          break;

      case 'MATK爆擊上升或下降':
        params.matk_crit = params.matk_crit.plus(val2).plus(cval2);
        // text += "魔法クリティカル";
        // text += parseCrit();
          break;

      case '速度上升或下降':

        // text += "行動速度";
        // if (val1.gt(0)) {
        //   text += `${val1.toString()}%UP`;
        // } else if (val1.lt(0)) {
        //   text += `${val1.abs().toString()}%DOWN`;
        // }
          break;

      case 'HP回復':
        // text += "毎秒HP";
        // text += parseAddSub();
          break;

      case 'MP回復':
        // text += "毎秒MP";
        // text += parseAddSub();
          break;

      case '中毒':
          // if (buff['@_group_stack'] === 'true') {
          //   text += `猛毒(毎秒HP${parseAddSub()}、加算可能)`;
          // } else {
          //   text += `中毒(毎秒HP${parseAddSub()})`;
          // }
          break;

      case '中毒抗性':
          // text += `中毒耐性${parseUpDown(val1_100)}`;
          break;

      case '燒傷':
        // if (buff['@_group_stack'] === 'true') {
        //   text += `火傷(毎秒HP${parseAddSub()}、加算可能)`;
        // } else {
        //   text += `火傷(毎秒HP${parseAddSub()})`;
        // }
          break;

      case '燒傷抗性':
        // text += `火傷耐性${parseUpDown(val1_100)}`;
          break;

      case '凍結':
          // text += `凍結(行動不可、毎秒HP${parseAddSub()})`;
          break;

      case '凍結抗性':
        // text += `凍結耐性${parseUpDown(val1_100)}`;
          break;

      case '石化':
        // text += "石化(行動不可、ブロック不可)";
          break;

      case '石化抗性':
        // text += `石化耐性${parseUpDown(val1_100)}`;
          break;

      case '沉睡':
    //    text += "睡眠(行動不可、被ダメが必クリ＆起きる)"
          break;

      case '沉睡抗性':
        // text += `睡眠耐性${parseUpDown(val1_100)}`;
          break;

      case '沉默':
        // text += "沈黙(スキル、奥義不可)";
          break;

      case '沉默抗性':
        // text += `沈黙耐性${parseUpDown(val1_100)}`;
          break;

      case '暈眩':
        // text += "眩暈(行動不可)";
          break;

      case '暈眩抗性':
        // text += `眩暈耐性${parseUpDown(val1_100)}`;
          break;

      case '麻痺':
        // text += "麻痺(行動速度＆攻撃力半減)"
          break;

      case '麻痺抗性':
        // text += `麻痺耐性${parseUpDown(val1_100)}`;
          break;

      case '混亂':
        // text += "混乱(奥義不可、敵味方ランダムに攻撃)"
          break;

      case '混亂抗性':
        // text += `混乱耐性${parseUpDown(val1_100)}`;
          break;

      case '魅惑':
        // text += "魅了(奥義不可、敵にバフスキルを使ったり、味方を攻撃)";
          break;

      case '魅惑抗性':
        // text += `魅了耐性${parseUpDown(val1_100)}`;
          break;

      case '詛咒':
        // text += "呪い(HP、MP回復不可、行動速度半減、クリティカル不可)"
          break;

      case '詛咒抗性':
        // text += `呪い耐性${parseUpDown(val1_100)}`;
          break;

      case '目盲':
        // text += "盲目(ブロック不可)"
          break;

      case '目盲抗性':
        // text += `盲目耐性${parseUpDown(val1_100)}`;
          break;

      case '負面狀態抗性':
        // text += `デバフ耐性${parseUpDown(val1_100)}`;
          break;

      case '定值傷害吸收':
        // if (val3.gt(0)) { 
        //   text += `回復バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd}、削れたバリアの${span}${val3.toString()}%${spanEnd}HP回復)`;
        // } else {
        //   text += `バリア(${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""})`;
        // }
          break;

      case '物理定值傷害吸收':
        // if (val3.gt(0)) { 
        //   text += `物理回復バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd}、削れたバリアの${span}${val3.toString()}%${spanEnd}HP回復)`;
        // } else {
        //   text += `物理バリア(${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""})`;
        // }
          break;

      case '魔法定值傷害吸收':
        // if (val3.gt(0)) { 
        //   text += `魔法回復バリア(${span}${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""}${spanEnd}、削れたバリアの${span}${val3.toString()}%${spanEnd}HP回復)`;
        // } else {
        //   text += `魔法バリア(${val1.toString()}%${val3.gt(0) ? "+" + (val2.mul(lv).toString()) : ""})`;
        // }
          break;

      case '次數傷害吸收':
        // text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "回復" : ""}バリア(${val1.toString()}%`;
        // if (val4.plus(val5.mul(lv)).gt(0)) {
        //   text += `+${val4.plus(val5.mul(lv)).toString()}`;
        // }
        // if (val3.gt(0)) {
        //   text += `、削れたバリアの${val3.toString()}%回復`;
        // }

        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
        
          break;

      case '物理次數傷害吸收':
        // text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "物理回復" : "物理"}バリア(${val1.toString()}%`;
        // if (val4.plus(val5.mul(lv)).gt(0)) {
        //   text += `+${val4.plus(val5.mul(lv)).toString()}`;
        // }
        // if (val3.gt(0)) {
        //   text += `、削れたバリアの${val3.toString()}%回復`;
        // }

        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '魔法次數傷害吸收':
        // text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "魔法回復" : "魔法"}バリア(${val1.toString()}%`;
        // if (val4.plus(val5.mul(lv)).gt(0)) {
        //   text += `+${val4.plus(val5.mul(lv)).toString()}`;
        // }
        // if (val3.gt(0)) {
        //   text += `、削れたバリアの${val3.toString()}%回復`;
        // }

        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '次數傷害反彈':
        // text += `反射バリア(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '物理次數傷害反彈':
        // text += `物理反射バリア(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '魔法次數傷害反彈':
        // text += `魔法反射バリア(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '無敵':
        // text += "無敵(ダメージ無効)";
          break;

      case '物理無敵':
        // text += "物理無敵(物理ダメージ無効)";
          break;

      case '魔法無敵':
        // text += "魔法無敵(魔法ダメージ無効)";
          break;

      case '嘲諷':
        // text += `挑発${val1.lt(100) ? "(弱)" : ""}`;
          break;

      case '嘲諷抗性':
        // text += `挑発耐性${parseUpDown(val1_100)}`;
          break;

      case '次數傷害加成':
        // text += `回数付ダメージUP(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '物理次數傷害加成':
        // text += `回数付物理ダメージUP(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '魔法次數傷害加成':
        // text += `回数付魔法ダメージUP(${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}`;
        // if (val2.lt(999)) {
        //   text += `、${val2.toString()}回`;
        // }
        // text += ")";
          break;

      case '治療量上升或下降':
        params.healing_power = params.healing_power.plus(val2).plus(cval2);
        //text += "治癒量";
        //text += parseUpDown();
          break;

      case '吸血量上升或下降':
        params.dmg_suck_hp = params.dmg_suck_hp.plus(val2).plus(cval2);
        //text += "HP吸収";
        //text += parseUpDown();
          break;

      case '被治療量上升或下降':
        // text += "被治癒量";
        // text += parseUpDown();
          break;

      case '恐懼':
        // text += `恐怖(毎秒MP${parseAddSub()}、ブロック無効)`;
          break;

      case '恐懼抗性':
        // text += `恐怖耐性${parseUpDown(val1_100)}`;
          break;

      case '驅散':
        // text += `解消(バフ消去)`;
          break;

      case '驅散抗性':
        // text += `解消耐性${parseUpDown(val1_100)}`;
          break;

      // case '戰鬥後角色經驗值增加':
      //     break;

      // case '戰鬥後遊戲幣獲得增加':
      //     break;

      case '風屬性攻擊上升或下降':
        // text += `風属性攻撃`;
        // text += parseUpDown();
          break;

      case '水屬性攻擊上升或下降':
        // text += `水属性攻撃`;
        // text += parseUpDown();
          break;

      case '火屬性攻擊上升或下降':
        // text += `火属性攻撃`;
        // text += parseUpDown();
          break;

      case '聖屬性攻擊上升或下降':
        // text += `聖属性攻撃`;
        // text += parseUpDown();
          break;

      case '魔屬性攻擊上升或下降':
        // text += `魔属性攻撃`;
        // text += parseUpDown();
          break;

      case '想屬性攻擊上升或下降':
        // text += `想属性攻撃`;
        // text += parseUpDown();
          break;

      case '風屬性防禦上升或下降':
        // text += "風属性防御";
        // text += parseUpDown();
          break;

      case '水屬性防禦上升或下降':
        // text += "水属性防御";
        // text += parseUpDown();
          break;

      case '火屬性防禦上升或下降':
        // text += "火属性防御";
        // text += parseUpDown();
          break;

      case '聖屬性防禦上升或下降':
        // text += "聖属性防御";
        // text += parseUpDown();
          break;

      case '魔屬性防禦上升或下降':
        // text += "魔属性防御";
        // text += parseUpDown();
          break;

      case '想屬性防禦上升或下降':
      //  text += "想属性防御";
      //  text += parseUpDown();
          break;

      case '技能傷害上升或下降':
      //  text += "スキルダメージ";
      //  text += parseUpDown();
          break;

      case '奧義傷害上升或下降':
    //    text += "奥義ダメージ";
     //   text += parseUpDown();
          break;

      case '受到傷害上限降低':
    //    text += `${val2.toString()}以上のダメージ(1撃)を受けると、超過分のダメージが${100-val1}%軽減される`;
          break;

      case '風屬性角色技能強化消耗金幣減少':
    //    text += `風属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '水屬性角色技能強化消耗金幣減少':
    //    text += `水属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '火屬性角色技能強化消耗金幣減少':
    //    text += `火属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '聖屬性角色技能強化消耗金幣減少':
     //   text += `聖属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '魔屬性角色技能強化消耗金幣減少':
     //   text += `魔属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '想屬性角色技能強化消耗金幣減少':
      //  text += `想属性聖騎士のスキルLv強化時の消費レゴル-${val1.toString()}%`;
          break;

      case '受到風屬性傷害上升或下降':
        //  text += `風属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到水屬性傷害上升或下降':
      //    text += `水属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到火屬性傷害上升或下降':
         // text += `火属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到聖屬性傷害上升或下降':
          //text += `聖属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到魔屬性傷害上升或下降':
          //text += `魔属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到想屬性傷害上升或下降':
          //text += `想属性の敵からの被ダメージ${val1.abs().toString()}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '技能傷害加成無效':
          //text += "スキルダメージUP効果無効＆バフ消去";
          break;

      case '奧義傷害加成無效':
          //text += "奥義ダメージUP効果無効＆バフ消去";
          break;

      case '受到普攻傷害上升或下降':
          //text += `敵からの通常攻撃の被ダメージ${parseUpDown()}`;
          break;

      case '受到技能傷害上升或下降':
        //text += `敵からのスキルの被ダメージ${parseUpDown()}`;
          break;

      case '受到奧義傷害上升或下降':
        //text += `敵からの奥義の被ダメージ${parseUpDown()}`;
          break;

      case '普攻傷害上升或下降':
        //text += `通常攻撃ダメージ`;
        //text += parseUpDown();
          break;

      case '普攻傷害加成無效':
        //text += "通常攻撃ダメージUP効果無効＆バフ消去";
          break;

      case '流血':
        //text += `出血(行動後にHP${parseAddSub()}、消去不可)`;
          break;

      case '流血抗性':
        //text += `出血耐性${parseUpDown(val1_100)}`;
          break;

      // case '反擊':
      //     break;

      case '物理防禦值護盾':
        // text += `物理防御力バリア(${span}${val1.toString()}%`;
        // if (val2.plus(val3.mul(lv)).gt(0)) {
        //   text += `+${val2.plus(val3.mul(lv)).toString()}`;
        // }
        // text += `${spanEnd}`;
        // text += ")";
        break;
      case '魔法防禦值護盾':
        // text += `魔法防御力バリア(${span}${val1.toString()}%`;
        // if (val2.plus(val3.mul(lv)).gt(0)) {
        //   text += `+${val2.plus(val3.mul(lv)).toString()}`;
        // }
        // text += `${spanEnd}`;
        // text += ")";
        break;
      case '綜合防禦值護盾':
        //         text += `防御力バリア(${span}${val1.toString()}%`;
        // if (val2.plus(val3.mul(lv)).gt(0)) {
        //   text += `+${val2.plus(val3.mul(lv)).toString()}`;
        // }
        // text += `${spanEnd}`;
        // text += ")";
        break;
      case '物理防禦值反射':
        // text += `物理防御力反射バリア(${span}${val1.toString()}%`;
        // if (val2.plus(val3.mul(lv)).gt(0)) {
        //   text += `+${val2.plus(val3.mul(lv)).toString()}`;
        // }
        // text += `${spanEnd}`;
        // text += ")";
        break;
      case '魔法防禦值反射':
        // text += `魔法防御力反射バリア(${span}${val1.toString()}%`;
        // if (val2.plus(val3.mul(lv)).gt(0)) {
        //   text += `+${val2.plus(val3.mul(lv)).toString()}`;
        // }
        // text += `${spanEnd}`;
        // text += ")";
        break;
      case '綜合防禦值反射':
        // text += `防御力反射バリア(${span}${val1.toString()}%`;
        // if (val2.plus(val3.mul(lv)).gt(0)) {
        //   text += `+${val2.plus(val3.mul(lv)).toString()}`;
        // }
        // text += `${spanEnd}`;
        // text += ")";
        break;

      default:
          console.log("Unknown buff effect type = "+type);
          break;
  } 
}

export const calcPassive = (sid, params, kf) => {
  const s = kf.skill_hero_1.root.skill_hero_1.find(item => item['@_id'] === sid);  
  for (const postFix of [
    ['A', "{5}", "{6}"],  //  バフ属性名の末尾, バフ効果量挿入文字列, バフ効果時間挿入文字列
    ['B', "{7}", "{8}"], 
    ['C', "{12}", "{13}"]]) {
    const buffId = s['@_buff_id'+postFix[0]];
    const buffDur = s['@_buff_dur'+postFix[0]];
    //const buffIf = s['@_buff_if'+postFix[0]];
    //const buffTarget = s['@_buff_target'+postFix[0]]
    if (buffId) {
      const buff = kf.buff_1.root.buff_1.find(item => item['@_id'] === buffId);
      if (buff !== undefined) {
        calcBuff(params, buff);
      }
    }
  }
}