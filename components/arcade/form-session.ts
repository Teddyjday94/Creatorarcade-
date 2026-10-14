export type FormState={draft:Record<string,string|boolean>;busy:boolean;version:number|undefined};
export type DraftEvent={type:'edit';name:string;value:string|boolean}|{type:'busy';busy:boolean}|{type:'server';version:number|undefined}|{type:'reset'};
export function formReducer(state:FormState,event:DraftEvent):FormState{if(event.type==='edit')return state.busy?state:{...state,draft:{...state.draft,[event.name]:event.value}};if(event.type==='busy')return {...state,busy:event.busy};if(event.type==='reset')return {...state,draft:{}};return {...state,version:event.version};}
