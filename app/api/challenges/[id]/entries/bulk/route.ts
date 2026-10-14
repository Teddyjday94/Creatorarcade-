import {write} from '@/lib/server/routes';
import {bulkReviewEntries} from '@/lib/server/entries';
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){return write(req,async(ctx,b)=>bulkReviewEntries(ctx,(await params).id,b.selected,b.state));}
