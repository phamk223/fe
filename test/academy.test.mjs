import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hasAnswer,studentShell,studentDashboard,studentAssignments,studentProfile,studentAttempt,assignmentCard,publicPage,contact} from '../public/academy.js';
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
  const legacy=assignmentCard({examId:'legacy',title:'Writing',versionNumber:1,sections:[{id:'section-without-type'}]});
  assert.match(legacy,/Bài luyện tập/);
  assert.doesNotMatch(legacy,/Read\.|Đọc hiểu/);
  const dashboard=studentDashboard(user,{data:[{examId:'abc',title:'One visible exam',versionNumber:1}],meta:{pagination:{total:17}}});
  assert.match(dashboard,/17 bài được giao/);
  assert.match(dashboard,/Xem tất cả 17 bài/);
  assert.match(dashboard,/data-action="start:abc"/);
  assert.doesNotMatch(dashboard,/<img onerror/);
});

test('learning desk keeps app integration targets and identifies the selected navigation',()=>{
  const html=studentShell({username:'<unsafe>'},'assignments');
  assert.equal((html.match(/id="content"/g)||[]).length,1);
  assert.equal((html.match(/id="logout"/g)||[]).length,1);
  assert.match(html,/<a href="#\/assignments" aria-current="page">/);
  assert.match(html,/tabindex="-1"/);
  assert.doesNotMatch(html,/<unsafe>/);
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
    const illustration=await fetch(base+'/assets/kids-adventure.png');
    assert.equal(illustration.status,200);
    assert.equal(illustration.headers.get('content-type'),'image/png');
    for(const path of ['/assets/.env','/assets/%2e%2e/server.mjs','/server.mjs','/assets/missing.jpg'])assert.equal((await fetch(base+path)).status,404,path);
  }finally{await new Promise(r=>server.close(r));}
});
