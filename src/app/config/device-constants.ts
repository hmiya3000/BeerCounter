//デバイス関連の固定値。アプリ依存。
export const DEVICE_CONFIG = {
    //----
    _idfv_iPhone8plus:      'F24B3697-722B-455A-9104-EB7A63473314',     //端末リセットしたら再取得
    _idfv_iPhone16plus:     'E6749AE2-BA28-441C-81AA-C5876A96C427',     //端末リセットしたら再取得
    _idfv_iPadmini4:        '512944DE-7215-4A2B-8F53-EB04C04C13FA',     //端末リセットしたら再取得
    _idfv_SO05K:            '90816d66e6362f69',                         //アプリごとに書き換え
    _idfv_unknown:          'unknown IDFV',
    //----
    //https://developers.google.com/admob/ios/test-ads?hl=ja
    _idfa_iPhone8plus:      'E5CEEEBB-9D5A-452F-83F4-07C0C19E3F76',     //テストデバイス iPhone 8 Plus
    _idfa_iPhone16plus:     'E6749AE2-BA28-441C-81AA-C5876A96C427',     //テストデバイス iPhone 16 Plus
    _idfa_iPadmini4:        '114095AA-3183-4BD7-B11F-40FEAE019D0D',     //テストデバイス iPad mini 4
    _idfa_SO05K:            'df6e4257-958c-4c27-89df-c223a16a0e8e',     //テストデバイス SO-05K
    _idfa_unknown:          'unknown IDFA',
} as const;

export const AD_CONFIG = {
    _appIdProductiOS:       'ca-app-pub-9616784058267049~8208157454',   //アプリID
    _appIdProductAnd:       'ca-app-pub-9616784058267049~2031316243',   //アプリID
    //----
    _adIdBannerProductiOS:  'ca-app-pub-9616784058267049/5581994119',   //広告ユニットID(バナー) 製品版
    _adIdBannerProductAnd:  'ca-app-pub-9616784058267049/9718234573',   //広告ユニットID(バナー) 製品版
    //----
    _adIdRewardProductiOS:  'ca-app-pub-9616784058267049/2746320478',   //広告ユニットID(リワード) 製品版iOS
    _adIdRewardProductAnd:  'ca-app-pub-9616784058267049/9120157131',   //広告ユニットID(リワード) 製品版Android
    //----
} as const

export const GEO_CONFIG = {
    _googleApiKey:          'AIzaSyBaKXg9iNlfrdkKlsNERQUOWI2p7mWqPm0'   //
}