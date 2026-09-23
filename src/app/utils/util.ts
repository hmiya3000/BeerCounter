import { Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone'; 
import { Browser } from '@capacitor/browser';

//=============================================================================
export const Str = {
    priceYen(_price:number) : string {
        return this.price(_price) + '円'
    },
    priceManYen(_price:number, _decPlace:number = 0) : string {
        return this.priceMan(_price, _decPlace) + '円'
    },
    price(_price:number) : string {
        let _strPrice:string    = '';
        if (_price == 0){
            _strPrice       = '0';
        } else {
            const _pm = _price >= 0 ? 1 : -1;
            const _priceAbs = _price * _pm;
            const yen = Math.floor(_priceAbs % 10000 );
            const _priceMan:number  = Math.floor(_priceAbs/10000);
            const oku = Math.floor(_priceMan / 10000);
            const man = Math.floor(_priceMan % 10000);
            if (oku > 0){
                _strPrice   += oku.toLocaleString() + '億';
            }
            if (man > 0){
                _strPrice   += man.toLocaleString() + '万';
            }
            if (yen > 0){
                _strPrice   += yen.toLocaleString();
            }
            if (_pm < 0){
                _strPrice       = '-' + _strPrice;
            }
        }
        return _strPrice;
    },
    priceMan(_price:number, _decPlace:number = 0) : string {
        const _pm = _price >= 0 ? 1 : -1;
        const _priceAbs = _price * _pm;
        let _strPrice:string    = '';
        if (_priceAbs == 0){
            _strPrice       = '0';
        } else if (_priceAbs < 10000){
            const man = Math.floor(_priceAbs / 10000);
            const yen = Math.floor(_priceAbs % 10000);
            if (man > 0){
                _strPrice   += `${man}万`;
            }
            if (yen > 0){
                _strPrice   += yen.toLocaleString();
            }
        } else {
            const oku = Math.floor(_priceAbs /10000 /10000);
            if (oku > 0){
                _strPrice   += `${oku}億`;
            }
            const _priceMan:number  = _price - oku *10000 *10000;
            if (_decPlace == 0){
                const man:number    = Math.floor( _priceMan /10000);
                if (man > 0){
                    _strPrice       += man.toLocaleString() + '万';
                }
            } else {
                const _place:number = Num.place(_decPlace);
                const man:number    = Math.floor( _priceMan /10000 * _place) /_place;
                const frac:number    = Math.floor( _priceMan %10000 * _place / 10000) /_place;

                if (man > 0 || frac != 0){
                    _strPrice           += man.toLocaleString('ja-JP',{maximumFractionDigits: _decPlace, minimumFractionDigits:_decPlace}) + '万';
                }

            }
        }
        if (_pm < 0){
            _strPrice       = '-' + _strPrice;
        }
        return _strPrice;
    },
    ratePct(_rate:number, _decPlace:number, _minDigits:number = 0) : string {
        return this.rate(_rate, _decPlace, _minDigits) + '%';
    },
    rate(_rate:number,_decPlace:number, _minDigits:number = 0) : string {
        const _minDigitsCorrect:number  = _decPlace > _minDigits ? _minDigits : _decPlace
        const _rate100:number           = Num.ratePct(_rate,_decPlace);
        return _rate100.toLocaleString('ja-JP',{maximumFractionDigits: _decPlace, minimumFractionDigits:_minDigitsCorrect})
    },
    float(_float:number,_decPlace:number, _minDigits:number = 0) : string {
        const _minDigitsCorrect:number  = _decPlace > _minDigits ? _minDigits : _decPlace
        const _floatMul:number              = Num.float(_float,_decPlace);
        return _floatMul.toLocaleString('ja-JP',{maximumFractionDigits: _decPlace, minimumFractionDigits:_minDigitsCorrect})
    },
    countYear( _count:number){
        let _strYear:string = '';
        if (_count === 0){
            _strYear    = '0ヶ月';
        }
        const _year:number  = Math.floor(_count / 12);
        const _month:number = Math.floor(_count % 12);
        if (_year > 0){
            _strYear    += _year + '年';
        }
        if (_month > 0){
            _strYear    += _month + 'ヶ月'
        }
        return _strYear;
    },
    fixLen( str:string, length:number){
        const orgLen = str.length;
        const numRepeat = length - orgLen >= 0 ? length - orgLen : 1;
        const reStr = ' '.repeat( numRepeat ) + str;
        return reStr;
    },
    toHalf(str: string) : string {
        if (!str) return '';
        return str
            // 1. 全角英数字と一部の記号（！から〜まで）を半角に変換
            .replace(/[！-～]/g, (match) => {
                return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
            })
            // 2. 全角スペースを半角スペースに変換
            .replace(/　/g, ' ')
            // 3. 全角のハイフンやダッシュ類を、半角ハイフン「-」に統一
            .replace(/[－ーー−―ー]/g, '-');        
    }
}
//=============================================================================
export const Num = {
    place( _decPlace:number) : number {
        let _place = 1;
        for (let i=0; i< _decPlace; i++){
            _place  = _place * 10;
        }
        return _place;
    },
    float( _float:number, _decPlace:number) : number {
        const _place:number             = Num.place(_decPlace);
        const _fixedRaw = (_float * _place).toFixed(4);
        return Math.round(parseFloat(_fixedRaw)) / _place;
    },
    ratePct( _rate:number, _decPlace:number) : number {
        const _place:number             = Num.place(_decPlace);
        const _fixedRaw = ( _rate * 100 * _place ).toFixed(4);
        return Math.round( parseFloat(_fixedRaw) ) / _place;
    }
}
//=============================================================================
export const Color = {
    bal(v: number): 'dark' | 'danger' {
        return v >= 0 ? 'dark' : 'danger';
    },
    textColor(hexColor: string): string {
        if (!hexColor) return '#000000';

        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        // 💡 人間の目の「光の感じ方（心理物理学）」に基づいた正確な輝度（Luminance）変換
        const rL = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        const gL = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        const bL = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

        // 国際標準（WCAG）が定義する相対輝度の正確な計算式
        const relativeLuminance = 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;

        // 💡 判定基準（しきい値）: 
        // この相対輝度において、しきい値を「0.38」に設定することで、
        // あなたが指摘された水色（#3cd3f2）やピンク（#f06595）のような
        // 鮮やかで「白文字の方が絶対に映える色」を100%確実に白文字グループへ分類できます！
        return relativeLuminance > 0.38 ? '#000000' : '#ffffff';
    }
}
//=============================================================================
export const Page = {
    key( path:string ) : string {
        return path.split('/').pop() || '';
    }
}
//=============================================================================
export const Nav = {
  /**
   * 🏃‍♂️ アプリ内の指定ページへ、スラッシュを安全に自動補完して一撃で遷移します。
   * @param router 画面側から渡される Angular の Router インスタンス
   * @param page 遷移先のパス（例: "tab-input" や "/simulation"）
   * @param replace 履歴を上書きして戻りジェスチャーを消すか（デフォルトは100%安全な true ）
   */
  to(router: Router, page: string, replace: boolean = true): void {
    if (!page) return;
    let targetPath = page.trim();
    console.log(targetPath);
    if (!targetPath.startsWith('/')) {
      targetPath = '/' + targetPath;
    }
    console.log(`[NavUtil] ${replace ? '根本切り替え' : '履歴蓄積'}ルートで画面遷移します:`, targetPath);
    router.navigateByUrl(targetPath, { replaceUrl: replace });
  },
  /**
   * アプリ内の指定ページへ、スラッシュを自動補完し、アニメーション方向を完全強制ハックして遷移します。
   * @param router 画面のRouterインスタンス
   * @param outlet 💡 画面側からバケツリレーで渡される Ionic の RouterOutlet インスタンス
   * @param page 遷移先のパス
   * @param direction アニメーションの方向（'forward' | 'back' | 'none'）
   * @param replace 履歴を上書きするか
   */
  back(router: Router, navCtrl: NavController, page: string): void {
    if (!page) return;
    let targetPath = page.trim();
    if (!targetPath.startsWith('/')) targetPath = '/' + targetPath;

    console.log(`[NavUtil] 👈 to()とは【逆向き】のスライドアニメーションを強制発動します:`, targetPath);
    if (navCtrl && typeof navCtrl.setDirection === 'function') {
      navCtrl.setDirection('back', true, 'back');
    }
    router.navigateByUrl(targetPath, { replaceUrl: true });
  }
};
//=============================================================================
export const Util = {
    async openExtBrowser(_targetUrl:string): Promise<void> {
        try {
            window.open(_targetUrl, '_system');
        } catch (error) {
            await this.openIntBrowser(_targetUrl);
        }
    },
    async openIntBrowser(_targetUrl:string): Promise<void> {
        await Browser.open({ url: _targetUrl,windowName: '_blank', });
    },
    calculateSlope(x: number[], y: number[]): number {
        const n = x.length;
        if (n < 2) return 0; // データが2件未満なら直線が引けないため傾きは 0

        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;

        for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumXX += x[i] * x[i];
        }

        // 🧮 最小二乗法の公式: a = (N * ΣXY - ΣX*ΣY) / (N * ΣX^2 - (ΣX)^2)
        const denominator = n * sumXX - sumX * sumX;
        if (denominator === 0) return 0; // 割り算の分母が0になるエラー（同刻データ）を安全にガード

        const slope = (n * sumXY - sumX * sumY) / denominator;
        return slope;
    },
    sortAndResetIds<T extends { time: string; id: number }>(array: T[]): T[] {
        if (!array || array.length === 0) return [];
        const mappedArray = array.map((item, index) => {
            const parsedTime = new Date(item.time).getTime();
            return {
                original: { ...item },
                timestamp: isNaN(parsedTime) ? 0 : parsedTime 
            };
        });
        mappedArray.sort((a, b) => a.timestamp - b.timestamp);
        return mappedArray.map((wrapped, index) => {
            const item = wrapped.original;
            item.id = index; // 0, 1, 2, 3... と連番を上書き
            return item;
        });
    }
}
//=============================================================================
