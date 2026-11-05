import { readFile } from 'node:fs/promises';
import { before, after, beforeEach, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, set, get, remove, update } from 'firebase/database';
let env;
before(async () => { env = await initializeTestEnvironment({projectId:'demo-ibshcal',database:{rules:await readFile('database.rules.json','utf8')}}); });
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearDatabase(); });
for(const kind of ['notices','events']) {
 const payload = () => ({title:'School update',body:'Details',authorUid:'admin',createdAt:Date.now(),...(kind === 'events' ? {date:'2026-11-05'} : {})});
 test(`${kind}: public read; anonymous and ordinary users cannot write`, async () => {
  for(const context of [env.unauthenticatedContext(),env.authenticatedContext('reader')]) {
   const target = ref(context.database(),`${kind}/one`);
   await assertSucceeds(get(ref(context.database(),kind)));
   await assertFails(set(target,payload()));
   await assertFails(remove(target));
   await assertFails(update(target,{title:"Unauthorized"}));
  }
 });
 test(`${kind}: admin create, update and delete`,async () => {
  const target = ref(env.authenticatedContext('admin',{admin:true}).database(),`${kind}/one`);
  await assertSucceeds(set(target,payload()));
  await assertSucceeds(update(target,{title:'Updated'}));
  await assertSucceeds(remove(target));
 });
 test(`${kind}: schema and authorship enforced`,async () => {
  const target = ref(env.authenticatedContext('admin',{admin:true}).database(),`${kind}/one`);
  for(const patch of [{title:''},{title:'a'.repeat(121)},{body:42},{body:'a'.repeat(5001)},{authorUid:'other'},{createdAt:Date.now()+600000},{extra:true},...(kind==='events'?[{date:'invalid'}]:[])]) await assertFails(set(target,{...payload(),...patch}));
  const missing = payload(); delete missing.body; await assertFails(set(target,missing));
 });
}
test('private paths and self-assigned privileges are denied',async () => {
 for(const context of [env.unauthenticatedContext(),env.authenticatedContext('reader'),env.authenticatedContext('admin',{admin:true})]) {
  await assertFails(get(ref(context.database(),'/')));
  await assertFails(set(ref(context.database(),'admins/reader'),true));
 }
});
