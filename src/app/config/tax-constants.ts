//税金関連の固定値。原則、アプリ非依存
export interface TaxSetting {
  index: number;
  str: string;
  strTip: string;
  tax: number;
}

export const TAX_PERSONAL_SETTINGS: readonly TaxSetting[] = [
    //所得税率　https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm
    {index:0, str:"個人:〜195万円",  strTip:"所得税: 5%,住民税:10%", tax:0.15},
    {index:1, str:"個人:〜330万円",  strTip:"所得税:10%+住民税:10%", tax:0.2 },
    {index:2, str:"個人:〜695万円",  strTip:"所得税:20%+住民税:10%", tax:0.3 },
    {index:3, str:"個人:〜900万円",  strTip:"所得税:23%+住民税:10%", tax:0.33},
    {index:4, str:"個人:〜1800万円", strTip:"所得税:33%+住民税:10%", tax:0.43},
    {index:5, str:"個人:〜4000万円", strTip:"所得税:40%+住民税:10%", tax:0.50},
    {index:6, str:"個人:4000万円超", strTip:"所得税:45%+住民税:10%", tax:0.55},
] as const;

export const TAX_COMPANY_SETTINGS: readonly TaxSetting[] = [
    // 法人税率参考: https://www.nta.go.jp/taxes/shiraberu/taxanswer/hojin/5759.htm
    { index: 0, str: "法人:〜400万円", strTip: "法人税:15%+事業税:3.4%",    tax: 0.183 },
    { index: 1, str: "法人:〜800万円", strTip: "法人税:15%+事業税:5.1%",    tax: 0.201 },
    { index: 2, str: "法人:800万円〜", strTip: "法人税:23.2%+事業税:6.7%",  tax: 0.299 }
] as const;