const mpChargedWeapons = [
  { id: "4361", mp_recovery: 29, mp_charge_time: 3, mp_charge_value: 300, chara_id: 2162, equip_type: "專武" }, // ハワイアンバーガーセット
  { id: "4362", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, chara_id: 2168, equip_type: "專武" }, // にじげんファン
//  { id: "4363", mp_recovery: 0, mp_charge_time: 0, mp_charge_value: 0, chara_id: 2169, equip_type: "專武" }, // にじげんサクション
  { id: "4364", mp_recovery: 29, mp_charge_time: 3, mp_charge_value: 250, chara_id: 2170, equip_type: "專武" }, // にじげんチョーク
  { id: "4365", mp_recovery: 29, mp_charge_time: 20, mp_charge_value: 50, chara_id: 2214, equip_type: "專武" }, // 脱力の実
//  { id: "4366", mp_recovery: 0, mp_charge_time: 0, mp_charge_value: 0, chara_id: 2215, equip_type: "專武" }, // イルミナ・ソード
  { id: "4367", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, chara_id: 2216, equip_type: "專武" }, // 首領のカトラス
//  { id: "4368", mp_recovery: 0, mp_charge_time: 0, mp_charge_value: 0, chara_id: 2217, equip_type: "專武" }, // 呪殺のタライ
  { id: "4369", mp_recovery: 29, mp_charge_time: 3, mp_charge_value: 250, chara_id: 2218, equip_type: "專武" }, // 仙蜜草の袋
//  { id: "4370", mp_recovery: 0, mp_charge_time: 0, mp_charge_value: 0, chara_id: 2239, equip_type: "專武" }, // 平天＆渾鉄棍
//  { id: "4371", mp_recovery: 29, mp_charge_time: 0, mp_charge_value: 0, chara_id: 2251, equip_type: "專武" }, // カジノボーイ・バニーズ

  { id: "4219", mp_recovery: 0, mp_charge_time: 10, mp_charge_value: 25, equip_type: "投", atk_attr: "魔法", chara_id: 2201, name: "ｺｽﾞﾐｯｸｸﾘｽﾀﾙ"}, // コズミッククリスタル ニーナの場合は殲滅がパッシブと重複するので性能の低いこちらを優先

  // ここから殲滅シリーズ
  { id: "4311", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "斬", atk_attr: "物理" }, // 殲滅の剣
  { id: "4312", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "斬", atk_attr: "魔法" }, // 殲滅のチャクラム
  { id: "4313", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "突", atk_attr: "物理" }, // 殲滅の槍
  { id: "4314", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "突", atk_attr: "魔法" }, // 殲滅のワンド
  { id: "4315", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "打", atk_attr: "物理" }, // 殲滅の篭手
  { id: "4316", mp_recovery: 29, mp_charge_time: 3, mp_charge_value: 200, equip_type: "打", atk_attr: "魔法" }, // 殲滅のロッド
  { id: "4317", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "射", atk_attr: "物理" }, // 殲滅のクロスボウ
  { id: "4318", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "射", atk_attr: "魔法" }, // 殲滅の弾丸
  { id: "4319", mp_recovery: 0, mp_charge_time: 3, mp_charge_value: 200, equip_type: "投", atk_attr: "物理" }, // 殲滅の斧
  { id: "4320", mp_recovery: 20, mp_charge_time: 3, mp_charge_value: 200, equip_type: "投", atk_attr: "魔法" }, // 殲滅の魔榴弾

  //{ id: "4211", mp_recovery: 0, mp_charge_time: 10, mp_charge_value: 25, equip_type: "打", atk_attr: "魔法" }, // 討滅の剣
  //{ id: "4219", mp_recovery: 0, mp_charge_time: 10, mp_charge_value: 25, equip_type: "投", atk_attr: "魔法" }, // コズミッククリスタル
  
  //{ id: "4123", mp_recovery: 0, mp_charge_time: 5, mp_charge_value: 100, equip_type: "突", atk_attr: "物理" }, // 討滅の槍
  //{ id: "4126", mp_recovery: 0, mp_charge_time: 5, mp_charge_value: 100, equip_type: "打", atk_attr: "魔法" }, // 討滅のロッド

]

class MpAddEvent {
    constructor(time, mpCharge, comment) {
        this.time = time;
        this.mpCharge = mpCharge;
        this.comment = comment;
    }
}

export class MpGantt {

    static _json;
    static _skillOrder;
    static _weapon;
    static _finalMpRecovery;

    static generateTimelines(json) {
        this._json = json;
        this._skillOrder = json.first_skill_order.split("/");
        this._weapon = this._getWeaponMPRecovery();
        this._finalMpRecovery = parseInt(json.mp_recovery) + this._weapon.mp_recovery;

        const allTimelines = [];
        const baseEvents = this._generateBaseEvents();
        
        this._json.scalecheck.forEach(scale => {
            const timeline = this._calculateTimelineForScale(scale, baseEvents);
            allTimelines.push({
                name: scale.name,
                timeline: timeline
            });
        });

        this._json = null;
        this._skillOrder = null;
        this._weapon = null;
        this._finalMpRecovery = null;

        return allTimelines;
    }


    static _getWeaponMPRecovery() {
        const null_value = { mp_recovery: 0, mp_charge_time: 0, mp_charge_value: 0 };
        for (const w of mpChargedWeapons) {
            if (w.chara_id === this._json.id) {
                return { ...w };
            }
            if (w.equip_type === this._json.equip_type && w.atk_attr === this._json.atk_attr) {
                return { ...w };
            }
        }
        return null_value;
    }

    static _addSkillEvents(skill, name, baseTime, events) {
        skill.mp_charge_array.forEach(chargeEvent => {
            if (chargeEvent.mp_charge_if === "擊倒敵人") return;
            const chargeValue = chargeEvent.mp_charge_value;
            if (chargeEvent.mp_charge_time === 0 || chargeEvent.mp_charge_time === 1) {
                events.push(new MpAddEvent(baseTime + 1, chargeValue, `${name}のMP回復`));
            } else {
                for (let i = 1; i <= chargeEvent.mp_charge_time; i++) {
                    events.push(new MpAddEvent(baseTime + i, chargeValue, `${name}のMP継続回復`));
                }
            }
        });
    }

    static _generateBaseEvents() {
        const events = [];

        // MP継続回復(殲滅など武器の効果)
        for (let i = 0; i <= this._weapon.mp_charge_time; i++) {
            events.push(new MpAddEvent(
                i,
                this._weapon.mp_charge_value,
                `${(this._weapon.equip_type === "專武" ? "専用" : this._weapon.name !== undefined ? this._weapon.name : "殲滅")}武器のMP継続回復`
            ));
        }
        // バニティアのMP回復
        if (this._json.id !== "2119") {
            events.push(new MpAddEvent(1, 210, 'バニティアの味方全体MP回復'));
        }

        // パッシブスキルによるイベントを生成
        const passives = [this._json.passive1, this._json.passive2, this._json.passive3];
        passives.forEach((passive, i) => {
            if (passive) {
                const passiveName = `パッシブ${i + 1}`;
                passive.mp_charge_array.forEach(chargeEvent => {
                    const { mp_charge_time: time, mp_charge_value: value, mp_charge_if: condition } = chargeEvent;
                    if (condition === "戰鬥開場" || condition === "第一擊觸發") {
                        for (let j = 0; j <= time; j++) {
                            events.push(new MpAddEvent(j, value, `${passiveName}によるMP回復（${j}秒目）`));
                        }
                    }
                });
            }
        });

        return events;
    }

    static _calculateTimelineForScale(scale, baseEvents) {
        let currentTime = 0;
        const currentEvents = structuredClone(baseEvents);
        const attackEvents = [];
        const skillEvents = [];
        const skill_order = this._skillOrder;

        // パッシブスキルによる攻撃/スキル後のイベント生成関数
        const passives = [this._json.passive1, this._json.passive2, this._json.passive3];
        passives.forEach((passive, i) => {
            if (passive) {
                const passiveName = `パッシブ${i + 1}`;
                passive.mp_charge_array.forEach(chargeEvent => {
                    const { mp_charge_time: time, mp_charge_value: value, mp_charge_if: condition } = chargeEvent;
                    if (condition.indexOf("自身施放技能") !== -1) {
                        for (let i = 0; i < time + 1; i++) {
                            skillEvents.push((t) => new MpAddEvent(i + t, value, `${passiveName}による自身のスキル使用後MP回復`));
                        }
                    } else if (condition.indexOf("我方施放技能") !== -1) {
                        for (let i = 0; i < time + 1; i++) {
                            skillEvents.push((t) => new MpAddEvent(i + t, value * 6, `${passiveName}による味方のスキル使用時MP回復(6人使用想定)`));
                        }
                    } else if (condition.indexOf("自身施放普通攻擊") !== -1) {
                        for (let i = 0; i < time + 1; i++) {
                            attackEvents.push((t) => new MpAddEvent(i + t, value, `${passiveName}による自身の通常攻撃時MP回復`));
                        }
                    }
                });
            }
        });

        // スキル回しに従ってタイムラインを構築
        skill_order.forEach(actIndex => {
            if (actIndex === "0") {
                currentEvents.push(new MpAddEvent(currentTime, this._finalMpRecovery, "攻撃によるMPチャージ"));
                attackEvents.forEach(func => currentEvents.push(func(currentTime)));
                currentTime += parseFloat(scale.attack);
            } else if (actIndex === "1") {
                currentEvents.push(new MpAddEvent(currentTime, this._finalMpRecovery, "スキル1によるMPチャージ"));
                skillEvents.forEach(func => currentEvents.push(func(currentTime)));
                this._addSkillEvents(this._json.awake_skill1 ?? this._json.skill1, "スキル1", currentTime, currentEvents);
                currentTime += parseFloat(scale.skill1);
            } else if (actIndex === "2") {
                currentEvents.push(new MpAddEvent(currentTime, this._finalMpRecovery, "スキル2によるMPチャージ"));
                skillEvents.forEach(func => currentEvents.push(func(currentTime)));
                this._addSkillEvents(this._json.awake_skill2 ?? this._json.skill2, "スキル2", currentTime, currentEvents);
                currentTime += parseFloat(scale.skill2);
            }
        });

        currentEvents.sort((a, b) => a.time - b.time);

        let currentMp = 0;
        const finalTimeline = [];
        const maxMp = 1000;

        for (const event of currentEvents) {
            if (currentMp >= maxMp) break;
            const startMp = currentMp;
            currentMp += event.mpCharge;
            finalTimeline.push({
                time: parseFloat(event.time.toFixed(1)),
                comment: event.comment,
                start: startMp,
                duration: event.mpCharge,
                label: `MP+${event.mpCharge}`
            });
        }
        return finalTimeline;
    }
}
 