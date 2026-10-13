import test from 'node:test';
import assert from 'node:assert/strict';
import {createController,inspectSnapshot} from '../application/controller.js';
import {createStorage} from '../application/storage.js';
import {createComposition} from '../application/composition.js';
import {createCase} from '../domain/case.js';
import {themes,applyTheme} from '../presentation/themes.js';
import {decodeRing,project,mapRecords} from '../geography/project.js';
import {mapLayer} from '../geography/map.js';
import {coordinateLayer} from '../geography/coordinate-list.js';
const date='2026-10-13T10:00:00Z';
function memory(){const m=new Map();return{get length(){return m.size;},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}}
const result={provider:'usgs',status:'empty',query:{startDate:'2023-02-06',endDate:'2023-02-06',latitude:null,longitude:null,radiusKm:300},retrievedAt:date,evidence:[],error:null,truncated:false};
const text='On 2023-02-06, a magnitude 7.8 earthquake was reported. Casualties remain unknown.';
test('complete command journey correction, retrieval, save, export, revisit without retrieval',async()=>{
 const store=createStorage(memory());let calls=0;const controller=createController({api:{retrieve:async()=>{calls++;return result;}},storage:store,now:()=>date});
 controller.submit({text,title:'Test account'});const original=controller.getState().current.source.text;
 controller.correct({place:'Ambiguous place'},'Retain two possible places');await controller.retrieve(result.query);
 const id=controller.save(), exported=controller.export();assert.equal(calls,1);controller.clear();controller.load(id);
 assert.equal(controller.getState().current.source.text,original);assert.equal(controller.getState().current.claims[0].revisions.length,1);assert.equal(controller.getState().current.retrievals[0].status,'empty');assert.equal(controller.export(),exported);assert.equal(calls,1);
 controller.import(JSON.parse(exported));assert.equal(inspectSnapshot(controller.getState().current,controller.getState().selected).snapshots.length,1);assert.equal(mapRecords(controller.getState()).length,0);
});
test('late retrieval cannot modify replaced account and disposal aborts acquisition',async()=>{
 let resolve,signal;const api={retrieve:(_query,options)=>{signal=options.signal;return new Promise(r=>resolve=r);}};
 const controller=createController({api,storage:createStorage(memory()),now:()=>date});controller.submit({text});
 const pending=controller.retrieve(result.query);controller.submit({text:'A replacement report.'});assert.equal(signal.aborted,true);resolve(result);await assert.rejects(pending);assert.equal(controller.getState().current.retrievals.length,0);
 const second=controller.retrieve(result.query);controller.dispose();assert.equal(signal.aborted,true);resolve(result);await assert.rejects(second);assert.equal(controller.getState().current,null);
});
test('local storage corruption and quota failures remain explicit, unsafe imports never replace current account',()=>{
 const m=memory();m.setItem('news-evidence-view:case:bad','not json');const storage=createStorage(m);assert.match(storage.list()[0].title,/Unreadable/);assert.throws(()=>storage.load('bad'));
 const controller=createController({api:{},storage:createStorage({setItem(){throw new Error('Quota exceeded')}}),now:()=>date});controller.submit({text});assert.throws(()=>controller.save(),/Quota/);const old=controller.getState().current;
 assert.throws(()=>controller.import({...old,source:{...old.source,url:'javascript:alert(1)'}}));assert.equal(controller.getState().current,old);
});
test('two interface themes do not alter domain or provider behavior',()=>{
 const account=createCase({text},date), before=JSON.stringify(account), root={dataset:{}};
 assert.deepEqual(themes.night.tokens,themes.paper.tokens);applyTheme('night',root);assert.equal(root.dataset.theme,'night');applyTheme('paper',root);assert.equal(root.dataset.theme,'paper');assert.equal(JSON.stringify(account),before);assert.throws(()=>applyTheme('evil',root));
});
test('declared composition supports real substitution, reduced configuration and reverse lifecycle cleanup',()=>{
 const events=[];const descriptor=id=>({id,requires:['host'],create(){return{enable(){events.push(id+':enable')},disable(){events.push(id+':disable')},update(){events.push(id+':update')},dispose(){events.push(id+':dispose')}}}});
 const reduced=createComposition();assert.equal(reduced.count,0);reduced.update({});reduced.dispose();assert.equal(events.length,0);
 const first=createComposition({layers:[descriptor('map'),descriptor('annotations')],services:{host:{}}});first.update({});first.disable();first.enable();first.dispose();first.dispose();assert.deepEqual(events.slice(-2),['annotations:dispose','map:dispose']);const length=events.length;first.update({});assert.equal(events.length,length);
 const substitute=createComposition({layers:[descriptor('coordinate-list')],services:{host:{}}});assert.equal(substitute.count,1);substitute.dispose();assert.throws(()=>createComposition({layers:[descriptor('map')]}),/Missing extension service/);
});
class Element{
 constructor(){this.children=[];this.attributes={};this.listeners=new Map();this.hidden=false;this.textContent='';}
 setAttribute(k,v){this.attributes[k]=String(v)}getAttribute(k){return this.attributes[k]??null}append(...children){this.children.push(...children)}replaceChildren(...children){this.children=children}addEventListener(name,handler){this.listeners.set(name,handler)}removeEventListener(name){this.listeners.delete(name)}
}
test('working map and coordinate extensions own resources; disable aborts and dispose suppresses late boundary update',async()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>new Element(),createElementNS:()=>new Element()};
 try{
  const host=new Element();let signal,resolve,calls=0;const boundaries=options=>{calls++;signal=options.signal;return new Promise(r=>resolve=r)};
  const layer=mapLayer.create({mapHost:host,boundaries,onSelectEvidence:()=>{}});assert.equal(calls,0);layer.enable();assert.equal(calls,1);layer.update({current:createCase({text},date),selected:'claim-1'});layer.disable();assert.equal(signal.aborted,true);layer.enable();assert.equal(calls,2);layer.dispose();assert.equal(signal.aborted,true);resolve({features:[]});await new Promise(r=>setImmediate(r));assert.equal(host.children.length,0);
  const coords=coordinateLayer.create({mapHost:host});coords.enable();coords.update({current:createCase({text},date),selected:'claim-1'});assert.equal(calls,2);assert.ok(host.children.length);coords.dispose();assert.equal(host.children.length,0);
 }finally{globalThis.document=previous;}
});
test('map projection includes zero and date-line coordinates and decodes inherited boundary data',()=>{
 assert.deepEqual(project(0,0),[360,180]);assert.deepEqual(project(-180,90),[0,0]);assert.deepEqual(project(180,-90),[720,360]);assert.deepEqual(decodeRing([1000,2000,300,-100]),[[1,2],[1.3,1.9]]);
});
