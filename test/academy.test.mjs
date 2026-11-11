import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hasAnswer,studentDashboard,studentAssignments,studentProfile,studentAttempt,publicPage,contact} from '../public/academy.js';
import {createServer} from '../server.mjs';

test('answer count recognizes false and ignores cleared answers',()=>{
  assert.equal(hasAnswer({value:false}),true);
  assert.equal(hasAnswer({selectedOptionIds:['a']}),true);
  for(const answer of [null,{}, {selectedOptionIds:[]},{text:'  '},{pairs:[]}])assert.equal(hasAnswer(answer),false);
});

test('student pages use backend totals, escape content, and handle an empty account',()=>{
  const user={username:'<img onerror="x">',status:'ACTIVE'};
  const empty={data:[],meta:{pagination:{total:0}}};
  assert.match(studentDashboard(user,empty),/Sẵn sàng cho bài học đầu tiên/);
  const filled=studentAssignments({data:[{examId:'abc',title:'<script>bad</script>',versionNumber:2,sections:[{type:'LISTENING'}]}],meta:{pagination:{total:17}}},'');
  assert.match(filled,/17 bài được giao/);
  assert.match(filled,/&lt;script&gt;/);
  assert.match(filled,/Nghe hiểu/);
  assert.doesNotMatch(studentProfile(user),/<img onerror/);
});

test('submitted answers are locked and pending grades are distinguished from final scores',()=>{
  const attempt={status:'SUBMITTED',gradingStatus:'NEEDS_MANUAL_GRADING',score:1,maxScore:2,exam:{title:'Practice',versionNumber:1,sections:[{id:'s',type:'READING',order:1,questions:[{id:'q',type:'TRUE_FALSE',prompt:'Q'}]}]},answers:[{questionId:'q',answer:{value:false}}]};
  const html=studentAttempt(attempt,()=>'<input>',()=> '');
  assert.match(html,/<fieldset disabled>/);
  assert.match(html,/chưa phải điểm cuối cùng/);
  assert.match(html,/id="answered-count">1</);
  assert.doesNotMatch(html,/id="save-answers"/);
});

test('public enrollment uses real consultation destinations and no fake order form',()=>{
  const html=publicPage('program','cambridge',null);
  assert.ok(html.includes(contact.tel));
  assert.ok(html.includes(contact.facebook));
  assert.match(html,/Liên hệ tư vấn/);
  assert.doesNotMatch(html,/<form|thanh toán thành công/i);
});

test('static assets remain restricted to public image/font paths',async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    for(const path of ['/academy.js','/academy.css','/admin.js','/admin.css','/assets/logo.jpg','/assets/be-vietnam-regular.ttf'])assert.equal((await fetch(base+path)).status,200,path);
    for(const path of ['/assets/.env','/assets/%2e%2e/server.mjs','/server.mjs','/assets/missing.jpg'])assert.equal((await fetch(base+path)).status,404,path);
  }finally{await new Promise(r=>server.close(r));}
});
