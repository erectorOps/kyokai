import Big from 'big.js';

import { timeErrorMsg } from './_util.mjs';

const parseBuff = (buff, lv, info) => {
  if (buff["@_get_counter"] && buff["@_get_counter"] != "0") {
    //console.log("Error: get_counterのあるバフをパースしようとしてる [buff id="+buff["@_id"] + "]");
    return "Error: get_counterのあるバフをパースしようとしてる [buff id="+buff["@_id"] + "]";
  }

  const debuff = buff['@_debuff'] === "true";
  const span = `<span class=\"value ${debuff ? "down" : "up"}\">`;
  const spanHeal = "<span class=\"value heal\">";
  const spanN = "<span class=\"value\">";
  const spanEnd = "</span>";

  const type = buff['@_effect_type'];
  const val1 = buff['@_effect_val1'] ? new Big(buff['@_effect_val1']).round(2, Big.roundHalfEven) : new Big(0);
  const val1_100 = val1.mul(100);
  const val2 = buff['@_effect_val2'] ? new Big(buff['@_effect_val2']).round(2, Big.roundHalfEven) :new Big(0);
  const val3 = buff['@_effect_val3'] ? new Big(buff['@_effect_val3']).round(2, Big.roundHalfEven) :new Big(0);
  const val4 = buff['@_effect_val4'] ? new Big(buff['@_effect_val4']).round(2, Big.roundHalfEven) :new Big(0);
  const val5 = buff['@_effect_val5'] ? new Big(buff['@_effect_val5']).round(2, Big.roundHalfEven) :new Big(0);
  let text = "";

  const parseUpDown = (v1) => {
    let t = "";
    if (v1 === undefined) { v1 = val1; }
    if (v1.gt(0)) {
      t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
      t += `${v1.toString()}%`;
      const v = val2.plus(val3.mul(lv));
      if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }
      t += "</span>";
      t += "UP";
    } else if (v1.lt(0)) {
      t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
      t += `${v1.abs().toString()}%`;
      const v = val2.plus(val3.mul(lv));
      if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }
      t += "</span>";
      t += "DOWN";
    } else {
      t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
      const v = val2.plus(val3.mul(lv));
      t += ((v > 0) ? "+" : "") + `${v.toString()}`;
      t += "</span>";
      //if (v > 0) { t += "UP"; } else if (v < 0) { t += "DOWN"; }
    }
    return t;
  };

  const parseAddSub = (heal) => {
    let t = "";
    if (val1.gt(0)) {
      t += `<span class=\"value ${debuff ? "down" : heal ? "heal" : "up"}\">`;
      t += `${val1.toString()}%`;
      const v = val2.plus(val3.mul(lv));
      if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }

      t += "</span>";
    } else if (val1.lt(0)) {
      t += `<span class=\"value ${debuff ? "down" : heal ? "heal" : "up"}\">`;
      t += `-${val1.abs().toString()}%`;
      const v = val2.plus(val3.mul(lv));
      if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }
      t += "</span>";
    } else {
      t += `<span class=\"value ${debuff ? "down" : heal ? "heal" : "up"}\">`;
      const v = val2.plus(val3.mul(lv));
      t += `${v.toString()}`;
      t += "</span>";
    }
    return t;
  };

  const parseCrit = () => {
    let t = "";
    if (val1.cmp(0) !== 0) {
      if (val1.gt(0)) {
        t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
        t += `${val1.toString()}%`;
        const v = val2.plus(val3.mul(lv));
        if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }
        t += "</span>";
        t += "UP";
      } else {
        t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
        t += `${val1.abs().toString()}%`;
        const v = val2.plus(val3.mul(lv));
        if (v.gt(0)) { t += `+${v.abs().toString()}`; } else if (v.lt(0)) { t += `-${v.abs().toString()}`; }
        t += "</span>";
        t += "DOWN";
      }
    } else {
      t += `<span class=\"value ${debuff ? "down" : "up"}\">`;
      const v = val2.plus(val3.mul(lv));
      t += (v.mul("0.05").gt(0) ? "+" : "") + `${v.mul("0.05").round(2, Big.roundHalfEven).toString()}%`;
      t += "</span>";
    }
    return t;
  }

  switch(type)
  {
      case 'HP上限上升或下降':
          text += "最大HP";
          text += parseUpDown();
          break;

      case 'ATK上升或下降':
        text += "物理攻撃";
        text += parseUpDown();
          break;

      case 'MATK上升或下降':
        text += "魔法攻撃";
        text += parseUpDown();      
          break;

      case 'DEF上升或下降':
        text += "物理防御";
        text += parseUpDown();
          break;

      case 'MDEF上升或下降':
        text += "魔法防御";
        text += parseUpDown();
          break;

      case '命中上升或下降':
        text += "命中";
        text += parseUpDown();
          break;

      case '迴避上升或下降':
        text += "ブロック";
        text += parseUpDown();
          break;

      case 'ATK爆擊上升或下降':
        text += "物理クリティカル";
        text +=  parseCrit();
          break;

      case 'MATK爆擊上升或下降':
        text += "魔法クリティカル";
        text += parseCrit();
          break;

      case '速度上升或下降':
        text += "行動速度";
        if (val1.gt(0)) {
          text += `${span}${val1.toString()}%${spanEnd}UP`;
        } else if (val1.lt(0)) {
          text += `${span}${val1.abs().toString()}%${spanEnd}DOWN`;
        }
          break;

      case 'HP回復':
        text += "毎秒HP";
        text += parseAddSub(true);
          break;

      case 'MP回復':
        if (info.duration && info.duration !== "0") {
          text += "毎秒MP";
        } else {
          text += "MP";
        }
        text += parseAddSub(true);
          break;

      case '中毒':
          if (buff['@_group_stack'] === 'true') {
            text += `猛毒(毎秒HP${parseAddSub()}、加算可能)`;
          } else {
            text += `中毒(毎秒HP${parseAddSub()})`;
          }
          break;

      case '中毒抗性':
          text += `中毒耐性${parseUpDown(val1_100)}`;
          break;

      case '燒傷':
        if (buff['@_group_stack'] === 'true') {
          text += `火傷(毎秒HP${parseAddSub()}、加算可能)`;
        } else {
          text += `火傷(毎秒HP${parseAddSub()})`;
        }
          break;

      case '燒傷抗性':
        text += `火傷耐性${parseUpDown(val1_100)}`;
          break;

      case '凍結':
          text += `凍結(行動不可、毎秒HP${parseAddSub()})`;
          break;

      case '凍結抗性':
        text += `凍結耐性${parseUpDown(val1_100)}`;
          break;

      case '石化':
        text += "石化(行動不可、ブロック不可)";
          break;

      case '石化抗性':
        text += `石化耐性${parseUpDown(val1_100)}`;
          break;

      case '沉睡':
        text += "睡眠(行動不可、被ダメが必クリ＆起きる)"
          break;

      case '沉睡抗性':
        text += `睡眠耐性${parseUpDown(val1_100)}`;
          break;

      case '沉默':
        text += "沈黙(スキル、奥義不可)";
          break;

      case '沉默抗性':
        text += `沈黙耐性${parseUpDown(val1_100)}`;
          break;

      case '暈眩':
        text += "眩暈(行動不可)";
          break;

      case '暈眩抗性':
        text += `眩暈耐性${parseUpDown(val1_100)}`;
          break;

      case '麻痺':
        text += "麻痺(行動速度＆攻撃力半減)"
          break;

      case '麻痺抗性':
        text += `麻痺耐性${parseUpDown(val1_100)}`;
          break;

      case '混亂':
        text += "混乱(奥義不可、敵味方ランダムに攻撃)"
          break;

      case '混亂抗性':
        text += `混乱耐性${parseUpDown(val1_100)}`;
          break;

      case '魅惑':
        text += "魅了(奥義不可、敵にバフスキルを使ったり、味方を攻撃)";
          break;

      case '魅惑抗性':
        text += `魅了耐性${parseUpDown(val1_100)}`;
          break;

      case '詛咒':
        text += "呪い(HP、MP回復不可、行動速度半減、クリティカル不可)"
          break;

      case '詛咒抗性':
        text += `呪い耐性${parseUpDown(val1_100)}`;
          break;

      case '目盲':
        text += "盲目(ブロック不可)"
          break;

      case '目盲抗性':
        text += `盲目耐性${parseUpDown(val1_100)}`;
          break;

      case '負面狀態抗性':
        text += `デバフ耐性${parseUpDown(val1_100)}`;
          break;

      case '定值傷害吸收':
        if (val3.gt(0)) { 

          text += `回復バリア(${span}${val1.add(val2.mul(lv)).toString()}${spanEnd}、削れたバリアの${spanHeal}${val3.toString()}%${spanEnd}HP回復)`;
        } else {
          text += `バリア(${span}${val1.add(val2.mul(lv)).toString()}${spanEnd})`;
        }
          break;

      case '物理定值傷害吸收':
        if (val3.gt(0)) { 
          text += `物理回復バリア(${span}${val1.add(val2.mul(lv)).toString()}${spanEnd}、削れたバリアの${spanHeal}${val3.toString()}%${spanEnd}HP回復)`;
        } else {
          text += `物理バリア(${span}${val1.add(val2.mul(lv)).toString()}${spanEnd})`;
        }
          break;

      case '魔法定值傷害吸收':
        if (val3.gt(0)) { 
          text += `魔法回復バリア(${span}${val1.add(val2.mul(lv)).toString()}${spanEnd}、削れたバリアの${spanHeal}${val3.toString()}%${spanEnd}HP回復)`;
        } else {
          text += `魔法バリア(${span}${val1.add(val2.mul(lv)).toString()}${spanEnd})`;
        }
          break;

      case '次數傷害吸收':
        text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "回復" : ""}バリア(${span}${val1.toString()}%`;
        if (val4.plus(val5.mul(lv)).gt(0)) {
          text += `+${val4.plus(val5.mul(lv)).toString()}`;
        }
        text += `${spanEnd}`;
        if (val3.gt(0)) {
          text += `、削れたバリアの${spanHeal}${val3.toString()}%${spanEnd}回復`;
        }

        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
        
          break;

      case '物理次數傷害吸收':
        text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "物理回復" : "物理"}バリア(${span}${val1.toString()}%`;
        if (val4.plus(val5.mul(lv)).gt(0)) {
          text += `+${val4.plus(val5.mul(lv)).toString()}`;
        }
        text += `${spanEnd}`;
        if (val3.gt(0)) {
          text += `、削れたバリアの${span}${val3.toString()}%${spanEnd}回復`;
        }

        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '魔法次數傷害吸收':
        text += `${val2.lt(999) ? "回数付" : ""}${val3.gt(0) ? "魔法回復" : "魔法"}バリア(${span}${val1.toString()}%`;
        if (val4.plus(val5.mul(lv)).gt(0)) {
          text += `+${val4.plus(val5.mul(lv)).toString()}`;
        }
        text += `${spanEnd}`;
        if (val3.gt(0)) {
          text += `、削れたバリアの${span}${val3.toString()}%${spanEnd}回復`;
        }

        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '次數傷害反彈':
        text += `反射バリア(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '物理次數傷害反彈':
        text += `物理反射バリア(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '魔法次數傷害反彈':
        text += `魔法反射バリア(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '無敵':
        text += "無敵(ダメージ無効)";
          break;

      case '物理無敵':
        text += "物理無敵(物理ダメージ無効)";
          break;

      case '魔法無敵':
        text += "魔法無敵(魔法ダメージ無効)";
          break;

      case '嘲諷':
        text += `挑発${val1.lt(100) ? "(弱)" : ""}`;
          break;

      case '嘲諷抗性':
        text += `挑発耐性${parseUpDown(val1_100)}`;
          break;

      case '次數傷害加成':
        text += val2.lt(999) ? "回数付" : "";
        text += `ダメージUP(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '物理次數傷害加成':
        text += val2.lt(999) ? "回数付" : "";
        text += `物理ダメージUP(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '魔法次數傷害加成':
        text += val2.lt(999) ? "回数付" : "";
        text += `魔法ダメージUP(${span}${val1.toString()}%${val3.plus(val4.mul(lv)).gt(0) ? "+" + val3.plus(val4.mul(lv)).toString() : ""}${spanEnd}`;
        if (val2.lt(999)) {
          text += `、${spanN}${val2.toString()}${spanEnd}回`;
        }
        text += ")";
          break;

      case '治療量上升或下降':
        text += "治癒量";
        text += parseUpDown();
          break;

      case '吸血量上升或下降':
        text += "HP吸収";
        text += parseUpDown();
          break;

      case '被治療量上升或下降':
        text += "被治癒量";
        text += parseUpDown();
          break;

      case '恐懼':
        text += `恐怖(毎秒MP${parseAddSub()}、ブロック無効)`;
          break;

      case '恐懼抗性':
        text += `恐怖耐性${parseUpDown(val1_100)}`;
          break;

      case '驅散':
        text += `解消(バフ消去)`;
          break;

      case '驅散抗性':
        text += `解消耐性${parseUpDown(val1_100)}`;
          break;

      // case '戰鬥後角色經驗值增加':
      //     break;

      // case '戰鬥後遊戲幣獲得增加':
      //     break;

      case '風屬性攻擊上升或下降':
        text += `風属性攻撃`;
        text += parseUpDown();
          break;

      case '水屬性攻擊上升或下降':
        text += `水属性攻撃`;
        text += parseUpDown();
          break;

      case '火屬性攻擊上升或下降':
        text += `火属性攻撃`;
        text += parseUpDown();
          break;

      case '聖屬性攻擊上升或下降':
        text += `聖属性攻撃`;
        text += parseUpDown();
          break;

      case '魔屬性攻擊上升或下降':
        text += `魔属性攻撃`;
        text += parseUpDown();
          break;

      case '想屬性攻擊上升或下降':
        text += `想属性攻撃`;
        text += parseUpDown();
          break;

      case '風屬性防禦上升或下降':
        text += "風属性防御";
        text += parseUpDown();
          break;

      case '水屬性防禦上升或下降':
        text += "水属性防御";
        text += parseUpDown();
          break;

      case '火屬性防禦上升或下降':
        text += "火属性防御";
        text += parseUpDown();
          break;

      case '聖屬性防禦上升或下降':
        text += "聖属性防御";
        text += parseUpDown();
          break;

      case '魔屬性防禦上升或下降':
        text += "魔属性防御";
        text += parseUpDown();
          break;

      case '想屬性防禦上升或下降':
        text += "想属性防御";
        text += parseUpDown();
          break;

      case '技能傷害上升或下降':
        text += "スキルダメージ";
        text += parseUpDown();
          break;

      case '奧義傷害上升或下降':
        text += "奥義ダメージ";
        text += parseUpDown();
          break;

      case '受到傷害上限降低':
        text += `${spanN}${val2.toString()}${spanEnd}以上のダメージ(1撃)を受けると、超過分のダメージが${span}${(new Big("100")).minus(val1).toString()}%${spanEnd}軽減される`;
          break;

      case '風屬性角色技能強化消耗金幣減少':
        text += `風属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '水屬性角色技能強化消耗金幣減少':
        text += `水属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '火屬性角色技能強化消耗金幣減少':
        text += `火属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '聖屬性角色技能強化消耗金幣減少':
        text += `聖属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '魔屬性角色技能強化消耗金幣減少':
        text += `魔属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '想屬性角色技能強化消耗金幣減少':
        text += `想属性聖騎士のスキルLv強化時の消費レゴル${span}-${val1.toString()}%${spanEnd}`;
          break;

      case '受到風屬性傷害上升或下降':
          text += `風属性の敵からの被ダメージ${span}${val1.abs().toString()}%${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到水屬性傷害上升或下降':
          text += `水属性の敵からの被ダメージ${span}${val1.abs().toString()}%${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到火屬性傷害上升或下降':
          text += `火属性の敵からの被ダメージ${span}${val1.abs().toString()}%${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到聖屬性傷害上升或下降':
          text += `聖属性の敵からの被ダメージ${span}${val1.abs().toString()}%${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到魔屬性傷害上升或下降':
          text += `魔属性の敵からの被ダメージ${span}${val1.abs().toString()}%${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '受到想屬性傷害上升或下降':
          text += `想属性の敵からの被ダメージ${span}${val1.abs().toString()}%${spanEnd}${val1.gt(0) ? "UP" : "DOWN"}`;
          break;

      case '技能傷害加成無效':
          text += "スキルダメージUP効果無効＆バフ消去";
          break;

      case '奧義傷害加成無效':
          text += "奥義ダメージUP効果無効＆バフ消去";
          break;

      case '受到普攻傷害上升或下降':
          text += `敵からの通常攻撃の被ダメージ${parseUpDown()}`;
          break;

      case '受到技能傷害上升或下降':
        text += `敵からのスキルの被ダメージ${parseUpDown()}`;
          break;

      case '受到奧義傷害上升或下降':
        text += `敵からの奥義の被ダメージ${parseUpDown()}`;
          break;

      case '普攻傷害上升或下降':
        text += `通常攻撃ダメージ`;
        text += parseUpDown();
          break;

      case '普攻傷害加成無效':
        text += "通常攻撃ダメージUP効果無効＆バフ消去";
          break;

      case '流血':
        text += `出血(行動後にHP${parseAddSub()}、消去不可)`;
          break;

      case '流血抗性':
        text += `出血耐性${parseUpDown(val1_100)}`;
          break;

      // case '反擊':
      //     break;

      case '受到傷害上升或下降':
          text += `受けるダメージが${span}${val1.abs().toString()}%${spanEnd}軽減される`;
          break;
      case '造成傷害上升或下降':
          text += `与えるダメージが${parseUpDown()}`;
          break;
      // case '狀態效果時間上升或下降':
      //     break;
      // case 'Buff效果時間上升或下降':
      //     break;
      // case 'Debuff效果時間上升或下降':
      //     break;
      // case '狀態持續時間延長或縮短':
      //     break;
      // case 'Buff持續時間延長或縮短':
      //     break;
      // case 'Debuff持續時間延長或縮短':
      //     break;
      case '物理防禦值護盾':
        text += `物理防御力バリア(${span}${val1.toString()}%`;
        if (val2.plus(val3.mul(lv)).gt(0)) {
          text += `+${val2.plus(val3.mul(lv)).toString()}`;
        }
        text += `${spanEnd}`;
        text += ")";
        break;
      case '魔法防禦值護盾':
        text += `魔法防御力バリア(${span}${val1.toString()}%`;
        if (val2.plus(val3.mul(lv)).gt(0)) {
          text += `+${val2.plus(val3.mul(lv)).toString()}`;
        }
        text += `${spanEnd}`;
        text += ")";
        break;
      case '綜合防禦值護盾':
                text += `防御力バリア(${span}${val1.toString()}%`;
        if (val2.plus(val3.mul(lv)).gt(0)) {
          text += `+${val2.plus(val3.mul(lv)).toString()}`;
        }
        text += `${spanEnd}`;
        text += ")";
        break;
      case '物理防禦值反射':
        text += `物理防御力反射バリア(${span}${val1.toString()}%`;
        if (val2.plus(val3.mul(lv)).gt(0)) {
          text += `+${val2.plus(val3.mul(lv)).toString()}`;
        }
        text += `${spanEnd}`;
        text += ")";
        break;
      case '魔法防禦值反射':
        text += `魔法防御力反射バリア(${span}${val1.toString()}%`;
        if (val2.plus(val3.mul(lv)).gt(0)) {
          text += `+${val2.plus(val3.mul(lv)).toString()}`;
        }
        text += `${spanEnd}`;
        text += ")";
        break;
      case '綜合防禦值反射':
        text += `防御力反射バリア(${span}${val1.toString()}%`;
        if (val2.plus(val3.mul(lv)).gt(0)) {
          text += `+${val2.plus(val3.mul(lv)).toString()}`;
        }
        text += `${spanEnd}`;
        text += ")";
        break;
      
      default:
          console.log("Unknown buff effect type = "+type);
          break;
  }
  if (buff['@_cant_remove'] === 'true') {
    text += "(消去不可)";
  }
  return text;
}

function parseFixed(text, s) {

  switch (s['@_name']) {
    case "忍法・十面埋伏キリキリ舞":
      text = text.replace(/物理ダメージUP\(LV\d\)/, "物理{C7}") + " ※【分身】{7}";
      break;
    case "Rabit Rave Recital":
      text = text.replace(/水属性攻撃UP\(LV\d\)/, "{C12}");
      break;
    case "夜這イ星・金神七殺ノ祟リ":
      text = text.replace(/行動速度UP\(LV\d\)/, "{C12}");
      break;
    case "マシェリ・シュ・シュ":
      text = text.replace(/5秒間の恐怖\(LV\d\)/, "<color=#BB3D00>5</color>秒間の{C12}");
      break;
    case "ヴェルン神聖槍術　ファントムアクセル":
      text = text.replace(/ダメージUP\(LV\d\)/, "{C12}");
      break;
    case "ソウルサクションショット":
      text = text.replace(/魔属性被ダメージ増加\(LV\d\)/, "{C12}");
      break;
  }

  text = text.replace(/{(\d+)}<\/color>秒間?の(?:恐怖|凍結)\(LV\d\)/, (match, p1) => {
    const repIndex = parseInt(p1) - 1;
    return "{"+p1+"}</color>秒の{"+repIndex+"}";
  });
  return text;
}

export const parseSkill = (sid, lv, kf) => {
  const s = kf.skill_hero_1.root.skill_hero_1.find(item => item['@_id'] === sid);
  const is_heal = s['@_target_hp_effect'] && s['@_target_hp_effect'] === "回復";

  let text = parseFixed(s['@_effect_text'], s);
  text = text.replace(/<color=(#[A-F0-9]+?)>\{9\}/i, `<span class="value${is_heal ? " heal" : ""}">{9}`)
    .replace(/<color=(#[A-F0-9]+?)>/ig, `<span class="value">`).replace(/<\/color>/ig, "</span>");

  let waitShowTime = "0";
  if (s['@_effect_id'] && kf.skill_effect.root.skill_effect.find(item => item['@_Id'] === s['@_effect_id'])) {
    waitShowTime = kf.skill_effect.root.skill_effect.find(item => item['@_Id'] === s['@_effect_id'])['@_WaitShowTime'];
  }

  const hpScale = s['@_target_hp_scale'] ? new Big(s['@_target_hp_scale']) :new Big(0);
  const hpAdd = s['@_target_hp_add'] ? new Big(s['@_target_hp_add']) :new Big(0);
  const hpGrow = s['@_target_hp_add_grow'] ? new Big(s['@_target_hp_add_grow']) :new Big(0);

  if (text.indexOf('{3:P0}') !== -1) {
    const suck = s['@_dmg_suck_hp_scale'] ? new Big(s['@_dmg_suck_hp_scale']) :new Big(0);
    if (suck.cmp(0) !== 0) {
      text = text.replace('{3:P0}', suck.mul(100).round(0, Big.roundDown).toString() + "%");
    }
  }

  const targetHpEffect = s['@_target_hp_effect'] ? s['@_target_hp_effect'].replace("魔法傷害", "魔法ダメージ").replace("物理傷害", "物理ダメージ") : "";

  if (text.indexOf('{9}') !== -1) {
    const damage = `${hpScale.mul(100).round(0, Big.roundDown).toString()}%+${hpGrow.mul(lv).plus(hpAdd).toString()}`;
    text = text.replace('{9}', damage)
  }

  let speed_value = 0;

  for (const postFix of [
    ['A', "{5}", "{6}"],  //  バフ属性名の末尾, バフ効果量挿入文字列, バフ効果時間挿入文字列
    ['B', "{7}", "{8}"], 
    ['C', "{12}", "{13}"]]) {
    const buffId = s['@_buff_id'+postFix[0]];
    const buffDur = s['@_buff_dur'+postFix[0]];
    const buffIf = s['@_buff_if'+postFix[0]];
    const buffTarget = s['@_buff_target'+postFix[0]];
    if (buffId) {
      text = text.replace(postFix[2], buffDur);
      const buff = kf.buff_1.root.buff_1.find(item => item['@_id'] === buffId);
      if (buff !== undefined) {
        text = text.replace(postFix[1], parseBuff(buff, lv, {id: buffId, duration: buffDur, if: buffIf, target: buffTarget}));
        if (buff['@_effect_type'] === '速度上升或下降') {
          speed_value += (buff["@_effect_val1"] !== undefined ? parseFloat(buff["@_effect_val1"]) : 0) 
            + (buff["@_counter_effect_val1"] !== undefined ? parseFloat(buff["@_counter_effect_val1"]) : 0);
        }
      }
    }
  }

  // パースが難しい部分を独自仕様"{C5}"で補完
  if (s['@_change_skill_id'] && s['@_change_skill_id'] !== "0") {
    const c = kf.skill_hero_1.root.skill_hero_1.find(item => item['@_id'] === s['@_change_skill_id']);
    if (c) {
      for (const postFix of [
        ['A', "{C5}", "{C6}"],
        ['B', "{C7}", "{C8}"],
        ['C', "{C12}", "{C13}"]]) {
          const buffId = c['@_buff_id'+postFix[0]];
          const buffDur = c['@_buff_dur'+postFix[0]];
          const buffIf = c['@_buff_if'+postFix[0]];
          const buffTarget = c['@_buff_target'+postFix[0]];
          if (buffId) {
            text = text.replace(postFix[2], buffDur);
            const buff = kf.buff_1.root.buff_1.find(item => item['@_id'] === buffId);
            if (buff !== undefined) {
              text = text.replace(postFix[1], parseBuff(buff, lv, {id: buffId, duration: buffDur, if: buffIf, target: buffTarget}));
            }
          }
      }
    }
  }

  // ◯◯か◯◯のスキル
  if (s['@_group']) {
    const groups = kf.skill_hero_1.root.skill_hero_1.filter(item => item['@_group'] === s['@_group']); 
    if (groups[0]['@_id'] === s['@_id']) {
      for (let i = 1; i < groups.length; i++) {
        if (groups[i]['@_effect_text']) {
          text = text.replace("{"+(20+i)+"}", parseSkill(groups[i]['@_id'], lv, kf).text);
        }
      }
    }
  }

  const result = {
    speed_buff: speed_value,
    time: "",
    time2: "",
    icon: s['@_icon'],
    text: text.replace(/&#xD;/ig, "").replace(/&#xA;/ig, "<br>"),
    name: s[`@_name`].replace(/&#x[AD];/ig, "").replace(/<ruby=(.+?)>(.+?)<\/ruby>/ig, "<ruby>$2<rt>$1</rt></ruby>")
  };

  if (s['@_freeze_time']) {
    const time = new Big(s['@_freeze_time']).plus("0.125").plus(new Big(waitShowTime));
    result.time = time.toFixed(3, Big.roundHalfEven);
    result.time2 = time.round(2, Big.roundDown).toFixed(1, Big.roundUp);
    result.freezeTime = new Big(s['@_freeze_time']);
    result.waitShowTime = new Big(waitShowTime);
  }
  
  result.time_error_msg = timeErrorMsg(s['@_freeze_time'], waitShowTime);
  return result;
}