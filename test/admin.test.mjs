import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adminShell,adminDashboard} from '../public/admin.js';

const user={username:'admin.preview',roles:['ADMIN']};
const page=(data,total=data.length)=>({data,meta:{pagination:{total}}});

test('overview uses API totals rather than the number of preview rows',()=>{
  const data={students:page([],125),teachers:page([],8),classes:page([],12),exams:page([{id:'exam',status:'PUBLISHED',publishedVersion:{title:'Reading A1',versionNumber:2}}],31)};
  const html=adminDashboard(user,data);
  for(const total of [125,8,12,31])assert.ok(html.includes('<strong>'+total+'</strong>'));
  assert.match(html,/Reading A1/);
  assert.match(html,/Phiên bản 2/);
  assert.doesNotMatch(html,/doanh thu|tăng trưởng|thông báo mới/i);
});

test('empty center offers real next actions and escapes data from the backend',()=>{
  const data={students:page([{username:'<img onerror="x">',displayName:'<script>bad</script>',status:'ACTIVE'}]),teachers:page([]),classes:page([]),exams:page([])};
  const html=adminDashboard(user,data);
  assert.match(html,/Khởi tạo thư viện đề thi/);
  assert.match(html,/Chưa có giáo viên/);
  assert.match(html,/&lt;script&gt;/);
  assert.doesNotMatch(html,/<script>|<img onerror/);
});

test('admin navigation identifies the current screen and labels the actual role',()=>{
  const html=adminShell(user,'students');
  assert.match(html,/href="#\/students" class="admin-nav-link active" aria-current="page"/);
  assert.match(html,/aria-controls="admin-sidebar" aria-expanded="false"/);
  assert.match(html,/Quản trị viên/);
  const teacher=adminShell({username:'teacher.preview',roles:['TEACHER']},'exams');
  assert.match(teacher,/KHÔNG GIAN GIẢNG DẠY/);
  assert.doesNotMatch(teacher,/Quản trị viên/);
});
