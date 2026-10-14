import type {Context} from '../domain/types.ts';
import {getChallenge} from './challenges.ts';
import {requireOwner} from './access.ts';
function cell(value:unknown){let s=String(value??'');if(/^[\s]*[=+\-@]|^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
const columns=['Contributor','Description','Clip link','Decision','Permission confirmed (UTC)','Submitted (UTC)'];
export async function* entryCsvChunks(ctx:Context,challengeId:string){
 const c=await getChallenge(ctx,challengeId);yield '\uFEFF'+columns.map(cell).join(',')+'\r\n';let cursor='';
 while(true){await requireOwner(ctx,c.workspaceId);const rows=await ctx.db.all('SELECT id,displayName,description,clipUrl,state,consentAt,createdAt FROM entries WHERE challengeId=? AND id>? ORDER BY id LIMIT 250',[challengeId,cursor]);if(!rows.length)break;yield rows.map(r=>[r.displayName,r.description,r.clipUrl,r.state,r.consentAt,r.createdAt].map(cell).join(',')+'\r\n').join('');cursor=rows[rows.length-1].id;if(rows.length<250)break;}
}
export async function exportEntriesCsv(ctx:Context,challengeId:string){let csv='';for await(const chunk of entryCsvChunks(ctx,challengeId))csv+=chunk;return csv;}
