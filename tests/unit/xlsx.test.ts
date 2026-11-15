import {describe,it,expect} from 'vitest';
import ExcelJS from 'exceljs';
import {workbookToCsv} from '../../src/server/imports/xlsx';
describe('XLSX snapshot parser',()=>{
 it('reads the chosen worksheet and cached formulas without executing them',async()=>{const book=new ExcelJS.Workbook();book.addWorksheet('First').addRow(['unused']);const sheet=book.addWorksheet('Directory');sheet.addRow(['id','name']);sheet.addRow(['a',{formula:'1+1',result:2}]);const bytes=await book.xlsx.writeBuffer();const result=await workbookToCsv(Buffer.from(bytes),'Directory');expect(result.sheetNames).toEqual(['First','Directory']);expect(result.csv).toContain('"a","2"');});
 it('rejects invalid archives and formulas with no cached value',async()=>{await expect(workbookToCsv(Buffer.from('not a workbook'))).rejects.toThrow();const book=new ExcelJS.Workbook();const sheet=book.addWorksheet('Directory');sheet.addRow(['name']);sheet.addRow([{formula:'1+1'}]);await expect(workbookToCsv(Buffer.from(await book.xlsx.writeBuffer()))).rejects.toThrow('cached value');});
});
