export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const isStaff=user=>user?.roles?.some(r=>['ADMIN','TEACHER'].includes(r));
export function questionPayload(type,prompt,choices,key){
 const lines=s=>s.split('\n').map(s=>s.trim()).filter(Boolean);
 const base={type,prompt,options:[],answerKey:{}};
 if(['MULTIPLE_CHOICE','CHOOSE_CORRECT'].includes(type)){base.options=lines(choices).map(content=>({content}));const indexes=key.split(',').map(x=>Number(x.trim())-1);if(!key.trim()||indexes.some(x=>!Number.isInteger(x)||x<0||x>=base.options.length)||new Set(indexes).size!==indexes.length||(type==='CHOOSE_CORRECT'&&indexes.length!==1))throw Error('Nhập số thứ tự đáp án đúng, bắt đầu từ 1.');base.answerKey={correctOptionIndexes:indexes};}
 else if(type==='TRUE_FALSE'){if(!['true','false'].includes(key.trim()))throw Error('Đáp án là true hoặc false.');base.answerKey={value:key.trim()==='true'};}
 else if(type==='SHORT_ANSWER'){base.answerKey={acceptedAnswers:lines(key)};if(!base.answerKey.acceptedAnswers.length)throw Error('Nhập ít nhất một đáp án.');}
 else {const pairs=lines(key).map(line=>{const i=line.indexOf('=');if(i<1||!line.slice(i+1).trim())throw Error('Mỗi cặp cần có dạng trái = phải.');return{left:line.slice(0,i).trim(),right:line.slice(i+1).trim()};});if(pairs.length<2)throw Error('Cần ít nhất hai cặp ghép.');base.answerKey={pairs};base.content={left:pairs.map(p=>p.left),right:[...pairs.map(p=>p.right)].sort()};}
 return base;
}
export function answerPayload(question,form){
 const values=form.getAll(question.id);
 if(['MULTIPLE_CHOICE','CHOOSE_CORRECT'].includes(question.type))return{selectedOptionIds:values};
 if(question.type==='TRUE_FALSE')return values.length?{value:values[0]==='true'}:null;
 if(question.type==='SHORT_ANSWER')return{text:values[0]||''};
 return{pairs:(question.content?.left||[]).flatMap((left,i)=>{const right=form.get(question.id+'_'+i);return right?[{left,right}]:[];})};
}
export function errorMessage(payload,status){const fields=payload?.error?.fields;return fields?.length?fields.map(x=>`${x.field}: ${x.message}`).join('\n'):({401:'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.',403:'Bạn không có quyền thực hiện thao tác này.',404:'Không tìm thấy dữ liệu hoặc bạn không có quyền truy cập.',429:'Bạn thao tác quá nhanh. Vui lòng thử lại sau.'}[status]||payload?.error?.message||'Không thể hoàn tất thao tác.');}
