import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.match(/<script id="calendar-core">([\s\S]*?)<\/script>/)[1];
const scope={window:{},Date};vm.runInNewContext(source,scope);const core=scope.window.CalendarCore;
test('date-only records stay on their calendar date and reject impossible dates',()=>{
 assert.equal(core.dateKey(core.parseDate('2028-02-29')),'2028-02-29');
 for(const value of ['2026-02-29','2026-11-31','2026-13-01','2026-1-2','0000-01-01',''])assert.equal(core.parseDate(value),null);
});
test('events keep chronological order for original demo times and live 24-hour times',()=>{
 assert(core.timeMinutes('9:30 AM')<core.timeMinutes('1:00 PM'));
 assert.equal(core.timeMinutes('12:00 AM'),0);
 assert.equal(core.timeMinutes('12:00 PM'),720);
 assert.equal(core.timeMinutes('13:00'),780);
});
test('older saved records normalize without data migrations',()=>{
 const stamp=new Date(2026,10,6,12).getTime();
 const notice=core.normalizeRecord('notices','old',{title:'Legacy',body:'Kept',authorUid:'alice',createdAt:stamp});
 assert.equal(core.dateKey(notice.date),'2026-11-06');assert.equal(notice.grade,'all');assert.equal(notice.type,'School news');
 const event=core.normalizeRecord('events','old',{title:'Legacy event',body:'Kept',date:'2026-11-06',createdAt:stamp});
 assert.equal(event.time,'');assert.equal(event.body,'Kept');assert.equal(event.place,'');
 assert.equal(core.normalizeRecord('events','bad',{title:'Bad',date:'not-a-date'}),null);
});
test('form validation and permissions match the membership design',()=>{
 const values={title:' Update ',body:' Details ',date:'2026-11-06',grade:'K',time:'09:30',place:'Library'};
 const payload=core.payloadFrom(values,'events','alice',123);
 assert.equal(payload.title,'Update');assert.equal(payload.authorUid,'alice');assert.equal(payload.time,'09:30');
 assert.throws(()=>core.payloadFrom({...values,date:'2026-02-30'},'events','alice',123));
 assert.throws(()=>core.payloadFrom({...values,time:'25:00'},'events','alice',123));
 assert.throws(()=>core.payloadFrom({...values,grade:'other'},'events','alice',123));
 assert.equal(core.canEdit('contributor','alice',{authorUid:'alice'}),true);
 assert.equal(core.canEdit('contributor','bob',{authorUid:'alice'}),false);
 assert.equal(core.canEdit(null,'alice',{authorUid:'alice'}),false);
 assert.equal(core.canEdit('admin','admin',{authorUid:'alice'}),true);
});
