import {context} from '@/lib/server/context';
import {respond} from '@/lib/server/http';
import {entryCsvChunks} from '@/lib/server/entry-export';
export const dynamic='force-dynamic';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const ctx=await context(),id=(await params).id,iterator=entryCsvChunks(ctx,id),first=await iterator.next(),encoder=new TextEncoder();
  const body=new ReadableStream<Uint8Array>({start(controller){if(first.done)controller.close();else controller.enqueue(encoder.encode(first.value));},async pull(controller){try{const next=await iterator.next();if(next.done)controller.close();else controller.enqueue(encoder.encode(next.value));}catch(error){controller.error(error);}},async cancel(){await iterator.return(undefined);}});
  return new Response(body,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="challenge-submissions.csv"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){return respond(async()=>{throw error;});}
}
