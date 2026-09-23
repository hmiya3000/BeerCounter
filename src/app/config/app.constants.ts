//アプリの挙動の定義。アプリ依存だがほぼ共通で使い回す
export const APP_CONFIG = {
    ADREWARD_DURATION_MIN:  15,                                         //広告をを見た報酬の有効期間(分)
    STR_LEN_MIN:            12,                                         //返済表の最低文字幅
    //---
    TESTFLIGHT:             true,
    //---
    DEC_PLACE_M:            4,                                          //万単位の表示なので小数点以下第4位まで
    PRICE_M_MAX:            100 * 10000,                                //100億
    EXPENSE_M_MAX:          1000,                                       //1000万 経費全版
    IMPROVE_M_MAX:          10000,                                      //大規模修繕
    //---
    PERIOD_Y_MAX:           100,                                        //100年 借入期間の最大値
    //---
    DEC_PLACE_P:            3,                                          //利回り(%)の小数点以下の桁
    RATE_P_MAX:             100.000,                                    //利回り(%)金利(%)の最大値
    RATEMNG_P_MAX:          30,                                         //30% 管理委託料率の最大値
    RATEDECLINE_P_MAX:      5,                                          //5% 家賃下落率の最大値
    RATEEMPTY_P_MAX:        50,                                         //50% 空室率の最大値
    //---
    DEC_PLACE_AREA:         2,                                          //土地建物の最大値
    AREA_MAX:               20000,                                      //土地建物の最大値
    //---
    DEC_PLACE_DEF:          1,                                          //ユーザー設定などデフォルトの小数点以下表示
    DEC_PLACE_IDX:          2,                                          //計算などから算出される指標・指数などの小数点以下表示
    ROOM_MAX:               100,                                        //戸数の最大値
    BOOT_MONTH_MAX:         6,
    RATEEQUIP_MAX:          0.5,
    //---
    M_MAP_CIRCLE:           100,                                         //マップの円の半径[m]
    NAME_LENGTH_MAX:        20,
    TITLE_LENGTH_MAX:       30,
    MEMO_LENGTH_MAX:        50,
    //---
    WEIGHT_MAX:             250,
    FATRATE_MAX:            0.4,
    BLOODPRML_MAX:          10000,
    PARTY_INTERVAL:         12,
    SYSTEM_MAX_DATE:        '9999-12-31T23:59:59',
    ALCOHOL_MAX:            400,
    COMPENSTION_THICK14:    0.35,
    COMPENSTION_THICK16:    0.45,
    COMPENSTION_THIN9:      0.223,
    COMPENSTION_THIN14_5:   0.221,


} as const;