import { IDrink, IParty, IPartySummary } from "../interface/drink";

export class Party implements IParty{
    id:                 number;
    time:               string;
    num:                number;
    sumAlcohol:         number;
    sumMl:              number;
    speed:              number;
    lastDrinkAlc:       IDrink;
    summary:            IPartySummary[];

    constructor( newId:number = -1, time:string = ''){
        this.id             = newId;
        this.time           = time;
        this.sumAlcohol     = 0;
        this.sumMl          = 0;
        this.num            = 0;
        this.speed          = 0;
        this.lastDrinkAlc   = new Drink();
        this.summary        = [];
    }
}
export class Drink implements IDrink{
    name:       string;
    glass:      string;
    ml:         number;
    coef:       number;
    alContent:  number;
    time:       string;
    id:         number;

    constructor( _name:string = '', _glass:string = '', _ml:number = 0, _alContent:number = 0,_coef:number = 0, _time:string = '',_drinkID:number = -1){
        this.name       = _name;
        this.glass      = _glass;
        this.ml         = _ml;
        this.coef       = _coef;
        this.alContent  = _alContent;
        this.time       = _time;
        this.id         = _drinkID;
    }
}
