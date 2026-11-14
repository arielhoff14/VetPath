import {GoogleAuth} from 'google-auth-library';
import {z} from 'zod';
const credentialsSchema=z.object({client_email:z.email(),private_key:z.string().min(1)}).passthrough();
const sheetIdSchema=z.string().regex(/^[A-Za-z0-9_-]{20,128}$/);
export function validateSheetConfig(sheetId:string,range:string){return sheetIdSchema.safeParse(sheetId).success&&range.length>0&&range.length<=150&&!/[\u0000-\u001f]/.test(range);}
export type SheetReader=(sheetId:string,range:string)=>Promise<unknown[][]>;
export async function readGoogleSheet(sheetId:string,range:string):Promise<unknown[][]>{
 if(!validateSheetConfig(sheetId,range))throw Error('Invalid spreadsheet configuration.');
 if(!process.env.GOOGLE_SERVICE_ACCOUNT_JSON)throw Error('Google Sheets credentials are not configured.');
 let credentials;try{credentials=credentialsSchema.parse(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON))}catch{throw Error('Google Sheets credentials are invalid.');}
 const auth=new GoogleAuth({credentials,scopes:['https://www.googleapis.com/auth/spreadsheets.readonly']});const client=await auth.getClient();
 const url=`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`;
 const result=await client.request<{values?:unknown[][]}>({url,timeout:15000});return result.data.values??[];
}
export function sheetValuesToCsv(values:unknown[][]):string {
 if(values.length>10001)throw Error('Sheet exceeds the 10,000 row limit.');
 const width=values[0]?.length??0;if(!width||values.some(row=>row.length>width))throw Error('Sheet headers are missing or rows exceed header width.');
 const csv=values.map(row=>Array.from({length:width},(_,i)=>row[i]).map(cell=>{if(cell!==null&&cell!==undefined&&!['string','number','boolean'].includes(typeof cell))throw Error('Unsupported sheet cell.');const value=String(cell??'');if(value.length>1000)throw Error('Sheet cell is too long.');return `"${value.replaceAll('"','""')}"`;}).join(',')).join('\n');
 if(Buffer.byteLength(csv,'utf8')>10*1024*1024)throw Error('Sheet exceeds the 10 MB limit.');return csv;
}
