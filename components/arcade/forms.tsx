'use client';
import { useState, useReducer, useEffect, useTransition, createContext, useContext, type ReactNode, type Dispatch } from 'react';
import {formReducer,type FormState,type DraftEvent} from './form-session';
const DraftContext=createContext<{state:FormState;dispatch:Dispatch<DraftEvent>}|null>(null);
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Copy, Check, LoaderCircle, Plus } from 'lucide-react';
export async function request(path: string, method: string, data: any) { const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const b: any = await r.json(); if (!r.ok)
    throw new Error(b.error?.message ?? 'Something went wrong. Please try again.'); return b.data; }
export function ActionForm({path,method='POST',values={},children,label='Save',successRoute,className='',successMessage='Saved.',variant='primary',confirmText,hardNavigate=false}:{path:string;method?:string;values?:any;children?:ReactNode;label?:string;successRoute?:string;className?:string;successMessage?:string;variant?:'primary'|'secondary'|'danger';confirmText?:string;hardNavigate?:boolean}){
 const router=useRouter();const [state,dispatch]=useReducer(formReducer,{draft:{},busy:false,version:values.version});const [error,setError]=useState(''),[done,setDone]=useState('');const [refreshPending,startRefresh]=useTransition();
 useEffect(()=>{dispatch({type:'server',version:values.version});},[values.version]);
 return <DraftContext.Provider value={{state,dispatch}}><form className={'action-form '+className} onChange={e=>{const el=e.target as unknown as HTMLInputElement|HTMLSelectElement;if(el.name&&(el.tagName==='SELECT'||el.type==='checkbox'))dispatch({type:'edit',name:el.name,value:el.type==='checkbox'?(el as HTMLInputElement).checked:el.value});}} onSubmit={async e=>{
  e.preventDefault();if(state.busy||refreshPending)return;if(confirmText&&!window.confirm(confirmText))return;dispatch({type:'busy',busy:true});setError('');setDone('');const form=e.currentTarget,data:any={...values,...Object.fromEntries(new FormData(form).entries())};if(values.version!==undefined)data.version=state.version;
  for(const name of ['version','offsetMinutes'])if(data[name]!==undefined&&data[name]!=='')data[name]=Number(data[name]);for(const name of ['consent','brokenLink'])if(form.elements.namedItem(name))data[name]=(form.elements.namedItem(name) as HTMLInputElement).checked;
  try{const saved=await request(path,method,data);setDone(successMessage);dispatch({type:'reset'});if(successRoute){const url=successRoute.replace(/\{(\w+)\}/g,(_,key)=>encodeURIComponent(saved?.[key]??''));if(hardNavigate){location.assign(url);return;}router.push(url);}else router.refresh();}catch(e){setError((e as Error).message);}finally{dispatch({type:'busy',busy:false});}
 }}><fieldset disabled={state.busy||refreshPending}>{children}<div className="form-actions"><button className={'button '+variant} type="submit">{state.busy?<LoaderCircle size={16} className="spin"/>:<ArrowUpRight size={16}/>} {state.busy?'Saving…':label}</button>{done&&<span className="success" role="status"><Check size={15}/>{done}</span>}</div></fieldset>{error&&<p className="error" role="alert">{error} {error.toLowerCase().includes('reload')&&<button type="button" className="text-button" disabled={refreshPending} onClick={()=>{setDone('Refreshing the server version. Your draft is kept; review it before saving again.');startRefresh(()=>router.refresh());}}>Refresh version and keep draft</button>}</p>}</form></DraftContext.Provider>;
}
export function Field({ label, name, value = '', type = 'text', required = true, maxLength, help }: {
    label: string;
    name: string;
    value?: string;
    type?: string;
    required?: boolean;
    maxLength?: number;
    help?: string;
}) { const draft=useContext(DraftContext);return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={draft?undefined:value} value={draft?String(draft.state.draft[name]??value):undefined} onChange={draft?e=>draft.dispatch({type:'edit',name,value:e.target.value}):undefined} required={required} maxLength={maxLength}/>{help && <small>{help}</small>}</label>; }
export function Area({ label, name, value = '', required = true, maxLength = 5000 }: {
    label: string;
    name: string;
    value?: string;
    required?: boolean;
    maxLength?: number;
}) { const draft=useContext(DraftContext);return <label className="field"><span>{label}</span><textarea name={name} defaultValue={draft?undefined:value} value={draft?String(draft.state.draft[name]??value):undefined} onChange={draft?e=>draft.dispatch({type:'edit',name,value:e.target.value}):undefined} required={required} maxLength={maxLength} rows={3}/></label>; }
export function CopyLink({ value, label = 'Copy link' }: {
    value: string;
    label?: string;
}) { const [copied, setCopied] = useState(false), [error, setError] = useState(''); return <><button className="button secondary small" type="button" onClick={async () => { try {
    await navigator.clipboard.writeText(value.startsWith('/') ? location.origin + value : value);
    setCopied(true);
}
catch {
    setError('Select and copy the link below.');
} }}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : label}</button>{error && <input aria-label="Link to copy" readOnly value={value.startsWith('/') ? (typeof location !== 'undefined' ? location.origin : '') + value : value}/>}</>; }
export function InviteCreator({ workspaceId }: {
    workspaceId: string;
}) { const [link, setLink] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false); return <div><button type="button" className="button primary" disabled={busy} onClick={async () => { setBusy(true); setError(''); try {
    const i = await request('/api/invitations', 'POST', { workspaceId });
    setLink(location.origin + '/invite/' + i.token);
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} }}><Plus size={16}/> Create editor invitation</button>{link && <div className="invite-link"><p>Copy this single-use link. It expires in seven days.</p><input aria-label="Editor invitation link" value={link} readOnly/><CopyLink value={link}/><small>They sign in with Google, Discord, or Twitch, then accept.</small></div>}{error && <p className="error" role="alert">{error}</p>}</div>; }
