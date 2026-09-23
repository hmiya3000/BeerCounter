import { IDiary } from "../interface/diary";

export class Diary implements IDiary{
    id:                 number;
    time:               string;
    content:            string;
    constructor( newId:number = -1, time:string = ''){
        this.id             = newId;
        this.time           = time;
        this.content        = '';
    }
}
