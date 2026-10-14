import {env} from 'cloudflare:workers';
import type {Database,Statement} from '../lib/domain/types';
export function getDatabase():Database {if(!env.DB)throw new Error('DB binding unavailable');const db=env.DB;return {first:async<T>(sql:string,args:any[]=[])=>db.prepare(sql).bind(...args).first<T>(),all:async<T>(sql:string,args:any[]=[])=>((await db.prepare(sql).bind(...args).all<T>()).results),batch:async(items:Statement[])=>{const result=await db.batch(items.map(s=>db.prepare(s.sql).bind(...(s.args??[]))));return result.map(r=>({changes:r.meta.changes}));}};}
