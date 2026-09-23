export type GenderType            = 'male' | 'female' | 'other';
export type AlcToleranceLevel     = 'veryStrong' | 'strong' | 'normal' | 'weak' | 'veryWeak';

export interface IBody {
    id:                 number;
    time:               string;
    height:             number;
    weight:             number;
    fatRate:            number;
}
export interface IBlood {
    id:                 number;
    time:               string;
    ggtp:               number;
    astgot:             number;
    altgpt:             number;
}

export interface IAlcToleranceListItem extends IAlcToleranceInfo {
  readonly level: AlcToleranceLevel;
}
export interface IAlcToleranceInfo {
  readonly  name:   string;
  readonly  factor: number;
  readonly  tips:   string;
}
export interface IBodyFactor {
    gender:             GenderType;

    // かなり強い           1.509.0g 分解   （通常比 1.5倍速）毎日飲んでおり、全く酔い潰れない人
    // 強い                 1.257.5g 分解   翌朝に残りにくい、お酒に強い人
    // 普通（デフォルト）   1.006.0g 分解   平均的な体質の人
    // 弱い                 0.503.0g 分解   カクテル1〜2杯で顔が赤くなる人
    // 極めて弱い           0.251.5g 分解   （通常比 0.25倍速）奈良漬けやアルコールチョコでも赤くなる人
    alcToleranceLevel:  AlcToleranceLevel;

}

