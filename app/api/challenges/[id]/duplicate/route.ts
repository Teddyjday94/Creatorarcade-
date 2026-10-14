import {write} from '@/lib/server/routes';
import {duplicateChallenge} from '@/lib/server/challenges';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){return write(req,async(ctx,b)=>duplicateChallenge(ctx,(await params).id,b.version));}
