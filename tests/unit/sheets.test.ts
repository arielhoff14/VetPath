import {describe,it,expect} from 'vitest';
import {sheetValuesToCsv,validateSheetConfig} from '../../src/server/integrations/sheets';
import {previewCsv,type Mapping} from '../../src/server/imports/csv';
const mapping:Mapping={externalId:'id',name:'name',address:'address',latitude:'lat',longitude:'lon',careType:'type',phone:'phone',species:undefined,services:undefined,sourceUrl:undefined};
describe('Google Sheets adapter',()=>{
 it('pads omitted trailing cells and preserves literal values for mapping',()=>{const csv=sheetValuesToCsv([['id','name','address','lat','lon','type','phone'],['1','Demo, Inc','1 Test Way',37,-122,'urgent']]);const p=previewCsv(csv,mapping);expect(p.errors).toEqual([]);expect(p.rows[0].name).toBe('Demo, Inc');});
 it('rejects non-ID URLs and rows wider than the header',()=>{expect(validateSheetConfig('https://evil.test/abc','Sheet1!A:Z')).toBe(false);expect(()=>sheetValuesToCsv([['a'],['x','y']])).toThrow();});
});
