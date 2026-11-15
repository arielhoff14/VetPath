import {describe,it,expect} from 'vitest';import {extractIntent} from '../../src/server/domain/intent';
describe('non-clinical intent',()=>{it('extracts species but never assigns clinical urgency',()=>{expect(extractIntent('My puppy is breathing strangely')).toEqual({species:'dog'});expect(extractIntent('A dogwood tree')).toEqual({species:undefined});});});
