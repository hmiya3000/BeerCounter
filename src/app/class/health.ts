import { DEF } from "../config/default-constants";
import { AlcToleranceLevel, GenderType, IBlood, IBody, IBodyFactor } from "../interface/health";

export class Body implements IBody{
    id:                 number;
    time:               string;
    height:             number;
    weight:             number;
    fatRate:            number;
    constructor( newId:number = -1, time:string, height:number = DEF.HEIGHT, weight:number = DEF.WEIGHT, fatRate:number = DEF.FATRATE){
        this.id         = newId;
        this.time       = time;
        this.height     = height;
        this.weight     = weight;
        this.fatRate    = fatRate;        
    }
}
export class BodyFactor implements IBodyFactor{
    gender:             GenderType;
    alcToleranceLevel:  AlcToleranceLevel;
    constructor(gender:GenderType = "other", alcoholToleranceLevel:AlcToleranceLevel = "normal" ){
        this.gender             = gender;
        this.alcToleranceLevel  = alcoholToleranceLevel;
    }
}
export class Blood implements IBlood{
    id:                 number;
    time:               string;
    ggtp:               number;
    astgot:             number;
    altgpt:             number;
    constructor( newId:number = -1, time:string = '', ggtp:number = 50, astgot:number = 20, altgpt:number = 20){
        this.id         = newId;
        this.time       = time;
        this.ggtp       = ggtp;
        this.astgot     = astgot;
        this.altgpt     = altgpt;
    }
}