import {readFile} from 'node:fs/promises';
import {before,after,beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,set,get,update,remove} from 'firebase/database';
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ibshcal',database:{rules:await readFile('database.rules.json','utf8')}});});
after(async()=>{await env?.cleanup();});
beforeEach(async()=>{await env.clearDatabase();await env.withSecurityRulesDisabled(async c=>set(ref(c.database(),'members'),{admin:{role:'admin'},alice:{role:'contributor'},bob:{role:'contributor'}}));});
const db=uid=>uid?env.authenticatedContext(uid).database():env.unauthenticatedContext().database();
const record=(uid,kind)=>({title:'School update',body:'Details',date:'2026-11-06',grade:'all',authorUid:uid,createdAt:Date.now()-1000,...(kind==='notices'?{type:'School news'}:{time:'09:30',place:'Library'})});
for(const kind of ['notices','events']){
 test(`${kind}: public reads; guests, pending users and obsolete admin claims cannot write`,async()=>{
  for(const client of [db(),db('pending'),env.authenticatedContext('obsolete',{admin:true}).database()]){
   await assertSucceeds(get(ref(client,kind)));
   await assertFails(set(ref(client,`${kind}/new`),record('pending',kind)));
   await assertFails(remove(ref(client,`${kind}/new`)));
  }
 });
 test(`${kind}: contributors can create, edit and delete only their own records`,async()=>{
  const path=`${kind}/one`,alice=ref(db('alice'),path),bob=ref(db('bob'),path);
  await assertSucceeds(set(alice,record('alice',kind)));
  await assertFails(update(bob,{title:'Not mine'}));await assertFails(remove(bob));
  await assertSucceeds(update(alice,{title:'Updated'}));
  await assertFails(update(alice,{authorUid:'bob'}));
  await assertFails(update(alice,{createdAt:Date.now()-10000}));
  await assertSucceeds(remove(alice));
 });
 test(`${kind}: administrators manage others without changing ownership or creation time`,async()=>{
  const path=`${kind}/one`,alice=ref(db('alice'),path),admin=ref(db('admin'),path);
  await assertSucceeds(set(alice,record('alice',kind)));
  await assertSucceeds(update(admin,{title:'Admin correction'}));
  assert.equal((await get(admin)).val().authorUid,'alice');
  await assertFails(update(admin,{authorUid:'admin'}));
  await assertSucceeds(remove(admin));await assertSucceeds(set(admin,record('admin',kind)));
 });
 test(`${kind}: invalid fields and forged authorship are rejected`,async()=>{
  const target=ref(db('alice'),`${kind}/one`),valid=record('alice',kind);
  const patches=[{title:''},{title:'a'.repeat(121)},{body:42},{body:'a'.repeat(5001)},{authorUid:'bob'},{createdAt:Date.now()+600000},{grade:'admin'},{date:'invalid'},{extra:true},...(kind==='events'?[{time:'25:61'},{place:'a'.repeat(201)}]:[{type:''}])];
  for(const patch of patches)await assertFails(set(target,{...valid,...patch}));
  for(const field of ['title','body','authorUid','createdAt','date']){const value={...valid};delete value[field];await assertFails(set(target,value));}
 });
 test(`${kind}: revoking membership removes access even for an existing owner`,async()=>{
  const target=ref(db('alice'),`${kind}/one`);await assertSucceeds(set(target,record('alice',kind)));
  await env.withSecurityRulesDisabled(c=>remove(ref(c.database(),'members/alice')));
  await assertFails(update(target,{title:'Revoked'}));await assertFails(remove(target));
 });
}
test('members: users read their own status; no client can list or change memberships',async()=>{
 for(const uid of ['pending','alice','admin']){
  const client=db(uid);await assertSucceeds(get(ref(client,`members/${uid}`)));
  await assertFails(get(ref(client,'members')));await assertFails(get(ref(client,'members/bob')));
  await assertFails(set(ref(client,`members/${uid}/role`),'admin'));
  await assertFails(set(ref(client,'members/new'),{role:'contributor'}));
  await assertFails(remove(ref(client,`members/${uid}`)));
 }
 await assertFails(get(ref(db(),'members/alice')));await assertFails(get(ref(db('admin'),'/')));
});
test('legacy records remain readable and editable without rewriting the live database',async()=>{
 const oldNotice={title:'Legacy',body:'Original body',authorUid:'alice',createdAt:Date.now()-5000};
 const oldEvent={...oldNotice,date:'2026-11-06'};
 await env.withSecurityRulesDisabled(async c=>{await set(ref(c.database(),'notices/old'),oldNotice);await set(ref(c.database(),'events/old'),oldEvent);});
 await assertSucceeds(get(ref(db(),'notices/old')));await assertSucceeds(get(ref(db(),'events/old')));
 await assertSucceeds(update(ref(db('admin'),'notices/old'),{body:'Corrected'}));
 await assertSucceeds(update(ref(db('alice'),'events/old'),{title:'Corrected'}));
});
test('bulk replacement, privilege escalation and unrelated paths stay denied',async()=>{
 const client=db('alice');
 await assertFails(set(ref(client,'notices'),{one:record('alice','notices')}));
 await assertFails(update(ref(client,'/'),{'members/alice/role':'admin','events/one':record('alice','events')}));
 await assertFails(set(ref(client,'admins/alice'),true));
});
