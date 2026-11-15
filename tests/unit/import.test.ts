import { describe,it,expect } from 'vitest';
import { previewCsv,type Mapping } from '../../src/server/imports/csv';
const mapping:Mapping={externalId:'id',name:'name',address:'address',latitude:'lat',longitude:'lon',careType:'type',phone:'phone',species:undefined,services:undefined,sourceUrl:undefined};
const header='id,name,address,lat,lon,type,phone\n';
describe('directory CSV preview',()=>{
 it('maps quoted columns and treats cells as plain data',()=>{const p=previewCsv(header+'1,"Clinic, One",123 Main,37,-122,emergency,+15550000000',mapping);expect(p.errors).toEqual([]);expect(p.rows[0].name).toBe('Clinic, One');});
 it('reports duplicates and invalid locations without silently accepting them',()=>{const p=previewCsv(header+'a,First,123 Main,37,-122,urgent,\na,Second,123 Main,37,-122,urgent,\nb,Third,123 Main,,-122,urgent,',mapping);expect(p.rows).toHaveLength(1);expect(p.errors.map(e=>e.row)).toEqual([3,4]);});
 it('requires stable identifiers and mappings',()=>{expect(()=>previewCsv(header,{...mapping,externalId:undefined})).toThrow('externalId');});
});
