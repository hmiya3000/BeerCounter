export interface IParty {
    id:                 number;
    time:               string;
    num:                number;
    sumAlcohol:         number;
    sumMl:              number;
    speed:              number;
    lastDrinkAlc:       IDrink;
    summary:            IPartySummary[];
};

export interface IDrink {
    id:                 number;
    name:               string;
    glass:              string;
    ml:                 number;
    alContent:          number;
    coef:               number;
    time:               string;
};

export interface IPartySummary {
    drink:              IDrink
    num:                number
};
export interface INameAlPair {
  name: string;
  alContent: number;
}
export interface IGlassMlPair {
  glass: string;
  ml: number;
}
export interface ITextValuePair {
  text: string;
  value: any;
}
export interface IGlassMlPair {
  text:string;
  value:number;
}
