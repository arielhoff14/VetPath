import { parse } from 'csv-parse/sync';
import { z } from 'zod';
const MAX_BYTES=10*1024*1024, MAX_ROWS=10000;
const clean=z.string().trim().max(500);
const url=z.union([z.url().refine(v=>{try{return ['http:','https:'].includes(new URL(v).protocol)}catch{return false}}),z.literal('')]).optional();
const money=z.string().regex(/^(?:|\d{1,6}(?:\.\d{1,2})?)$/).optional();
export const rowSchema=z.object({externalId:clean.min(1).max(120),name:clean.min(1),address:clean.min(1),latitude:z.coerce.number().min(-90).max(90),longitude:z.coerce.number().min(-180).max(180),careType:z.enum(['emergency','urgent','specialty','general']),phone:clean.refine(v=>!v||/^[+0-9(). -]{7,40}$/.test(v),{message:'Invalid phone number.'}).optional(),species:clean.optional(),services:clean.optional(),sourceUrl:url,website:url,city:clean.optional(),state:clean.optional(),postalCode:clean.optional(),hours:clean.optional(),examFeeMinUsd:money,examFeeMaxUsd:money,examFeeScope:clean.optional(),paymentOptions:clean.optional(),sourceVerifiedAt:z.union([z.iso.date(),z.literal('')]).optional()});
export type DirectoryRow=z.infer<typeof rowSchema>;
export type Mapping=Partial<Record<keyof DirectoryRow,string|undefined>>;
export interface Preview { rows:DirectoryRow[]; errors:{row:number;field:string;message:string}[]; headers:string[]; }
const required=['externalId','name','address','latitude','longitude','careType'] as const;
/** Parse a snapshot only. It never interprets formulas, imports clinical data, or grants access. */
export function previewCsv(text:string,mapping:Mapping):Preview {
 if(Buffer.byteLength(text,'utf8')>MAX_BYTES)throw Error('File exceeds the 10 MB limit.');
 const records: string[][]=parse(text,{bom:true,skip_empty_lines:true,relax_column_count:false,trim:true,max_record_size:10000});
 if(!records.length)throw Error('The file has no header row.');
 if(records.length-1>MAX_ROWS)throw Error('File exceeds the 10,000 row limit.');
 const headers=records[0]; if(new Set(headers).size!==headers.length)throw Error('Headers must be unique.');
 for(const field of required)if(!mapping[field]||!headers.includes(mapping[field]!))throw Error(`Map the ${field} column to an existing header.`);
 for(const col of Object.values(mapping))if(col&&!headers.includes(col))throw Error(`Mapped column ${col} is missing.`);
 const rows:DirectoryRow[]=[];const errors:Preview['errors']=[];const seen=new Set<string>();
 records.slice(1).forEach((record,index)=>{
  const input:Record<string,string>={};for(const [field,col] of Object.entries(mapping))if(col) input[field]=record[headers.indexOf(col)]??'';
  if(!input.latitude||!input.longitude){errors.push({row:index+2,field:'coordinates',message:'Latitude and longitude are required.'});return;}
  const parsed=rowSchema.safeParse(input);if(!parsed.success){for(const issue of parsed.error.issues)errors.push({row:index+2,field:issue.path.join('.'),message:issue.message});return;}
  if(parsed.data.examFeeMinUsd&&parsed.data.examFeeMaxUsd&&Number(parsed.data.examFeeMinUsd)>Number(parsed.data.examFeeMaxUsd)){errors.push({row:index+2,field:'examFeeMinUsd',message:'Minimum fee cannot exceed maximum fee.'});return;}
  if(seen.has(parsed.data.externalId)){errors.push({row:index+2,field:'externalId',message:'Duplicate identifier in this file.'});return;}seen.add(parsed.data.externalId);rows.push(parsed.data);
 });return {rows,errors,headers};
}
