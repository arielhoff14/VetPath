import ExcelJS from 'exceljs';
import yauzl from 'yauzl';
import {sheetValuesToCsv} from '../integrations/sheets';
const MAX_ARCHIVE=10*1024*1024,MAX_EXPANDED=50*1024*1024,MAX_ENTRY=16*1024*1024;
/** Check ZIP entry counts, names and actual expanded bytes before a workbook parser sees it. */
async function validateZip(buffer:Buffer){
 if(buffer.length>MAX_ARCHIVE||buffer.length<4||buffer.subarray(0,2).toString()!=='PK')throw Error('Invalid or oversized XLSX.');
 const zip=await new Promise<yauzl.ZipFile>((resolve,reject)=>yauzl.fromBuffer(buffer,{lazyEntries:true,validateEntrySizes:true,autoClose:false},(err,file)=>err||!file?reject(Error('Invalid XLSX archive.')):resolve(file)));
 try{await new Promise<void>((resolve,reject)=>{let total=0,count=0,settled=false;const fail=(err:unknown)=>{if(!settled){settled=true;reject(err instanceof Error?err:Error('Invalid XLSX archive.'));}};
 zip.on('error',fail);zip.on('end',()=>{if(!settled){settled=true;resolve();}});zip.on('entry',entry=>{
  if(++count>1000||entry.uncompressedSize>MAX_ENTRY||entry.fileName.includes('..')||/^\//.test(entry.fileName)||/vbaProject|externalLinks|embeddings/i.test(entry.fileName)){fail(Error('Unsupported or oversized workbook content.'));return;}
  if(/\/$/.test(entry.fileName)){zip.readEntry();return;}
  zip.openReadStream(entry,(err,stream)=>{if(err||!stream){fail(Error('Invalid workbook entry.'));return;}let bytes=0;stream.on('data',(chunk:Buffer)=>{bytes+=chunk.length;total+=chunk.length;if(bytes>MAX_ENTRY||total>MAX_EXPANDED){stream.destroy();fail(Error('Workbook expands beyond the allowed limit.'));}});stream.on('error',fail);stream.on('end',()=>{if(!settled)zip.readEntry();});});
 });zip.readEntry();});}finally{zip.close();}
}
export async function workbookToCsv(buffer:Buffer,sheetName?:string){
 await validateZip(buffer);const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
 const names=workbook.worksheets.map(s=>s.name);if(!names.length||names.length>100)throw Error('Workbook has no usable worksheets or too many worksheets.');
 const sheet=sheetName?workbook.getWorksheet(sheetName):workbook.worksheets[0];if(!sheet)throw Error('Worksheet was not found.');if(sheet.rowCount>10001||sheet.columnCount>256)throw Error('Worksheet exceeds row or column limits.');
 const values:unknown[][]=[];const width=sheet.getRow(1).cellCount;if(!width||width>256)throw Error('Worksheet needs a header row.');
 for(let n=1;n<=sheet.rowCount;n++){const row=sheet.getRow(n);const output:unknown[]=[];for(let col=1;col<=width;col++){const value=row.getCell(col).value;
  if(value===null||value===undefined)output.push('');else if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')output.push(value);else if(value instanceof Date)output.push(value.toISOString());else if('formula' in value||'sharedFormula' in value){if(!('result' in value)||value.result===undefined||value.result===null||typeof value.result==='object')throw Error(`Formula at row ${n} has no usable cached value.`);output.push(value.result);}else if('text' in value&&typeof value.text==='string')output.push(value.text);else if('richText' in value)output.push(value.richText.map(x=>x.text).join(''));else throw Error(`Unsupported cell at row ${n}.`);
 }values.push(output);}
 return {csv:sheetValuesToCsv(values),sheetNames:names,selectedSheet:sheet.name};
}
