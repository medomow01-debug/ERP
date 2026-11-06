// ===== المكتبة المشتركة لكل الصفحات =====
const U='https://kmoqrhqtokxlfiynzpou.supabase.co',K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb3FyaHF0b2t4bGZpeW56cG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MDk5NTQsImV4cCI6MjEwOTM4NTk1NH0.o-xpXehAR8tRbgObb1OfM5giYxpLt2kXsO2LYzSZfh8';
let S=JSON.parse(localStorage.erp||'null'),ST={},CUR=null,PT=[],PERS=[];
const hd=()=>({apikey:K,Authorization:'Bearer '+K,'x-token':S?.token||'','Content-Type':'application/json',Prefer:'return=representation'});
async function api(p,m='GET',b){const r=await fetch(U+'/rest/v1/'+p,{method:m,headers:hd(),body:b===undefined?undefined:JSON.stringify(b)});
 const j=await r.json().catch(()=>null);if(!r.ok)throw new Error(j?.message||r.status);return j}
const post=(t,b)=>api(t,'POST',b),patch=(t,f,b)=>api(t+'?'+f,'PATCH',b),del=(t,f)=>api(t+'?'+f,'DELETE'),rpc=(f,a={})=>api('rpc/'+f,'POST',a);
async function all(p){let o=[],i=0;for(;;){const r=await api(p+(p.includes('?')?'&':'?')+'limit=1000&offset='+i);o=o.concat(r);if(r.length<1000)return o;i+=1000}}
const $=s=>document.querySelector(s),v=s=>$(s).value.trim(),n=s=>+$(s).value||0,td=()=>new Date().toISOString().slice(0,10);
const sum=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0),fm=x=>(+x||0).toLocaleString('en',{maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ISADM=()=>S?.role=='admin',out=()=>{localStorage.removeItem('erp');location='login.html'};
function toast(t){let m=$('#m');if(!m){m=document.createElement('div');m.id='m';document.body.append(m)}m.className='msg'+(String(t).startsWith('خطأ')?' err':'');m.textContent=t;m.hidden=false;clearTimeout(m.t);m.t=setTimeout(()=>m.hidden=true,4200)}
addEventListener('unhandledrejection',e=>{if(e.reason!==0)toast('خطأ: '+(e.reason?.message||e.reason))});
async function go(f){const bs=[...document.querySelectorAll('main button')];bs.forEach(b=>b.disabled=true);
 try{const r=await f();await load();render();if(r!==false)toast('تم بنجاح')}catch(e){toast('خطأ: '+(e.message||e))}finally{bs.forEach(b=>b.disabled=false)}}

// ---- التنقل والتهيئة
const NAV=[['index','الرئيسية','<path d="M3 11l9-8 9 8v10H3z"/>'],['warehouses','المخازن','<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>'],
['purchases','المشتريات','<path d="M6 2h12v20l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/>'],['treasury','الخزينة والتحويلات','<path d="M3 7h18v12H3zM3 7l3-4h12l3 4M16 13h3"/>'],
['partners','الشركاء والأرباح','<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M17 11a3 3 0 100-6M21 20c0-3-2-5-4-5.5"/>'],
['sales','المبيعات','<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'],['settings','الإعدادات','<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>']];
async function boot(key){
 if(!S)return out();
 const me=await rpc('app_me').catch(()=>null);if(!me)return out();
 if(me.must_change){location='login.html?change=1';throw 0}
 S={...S,...me};
 if(!(S.role=='admin'||key=='index'||S.perms.includes(key))){document.body.innerHTML='<p style="padding:30px">ليس لديك صلاحية لهذه الصفحة</p>';throw 0}
 const [s,p,pt]=await Promise.all([api('settings?id=eq.1'),api('periods?order=id'),api('partners?active=eq.true&order=id')]);
 ST=s[0]||{};PERS=p;CUR=p.find(x=>x.status=='open');PT=pt;document.documentElement.style.setProperty('--c',ST.theme||'#0f766e');
 const cur=NAV.find(x=>x[0]==key),w=document.createElement('div');w.className='wrap';$('#app').before(w);
 w.innerHTML=`<div id="top"><div><h1>${cur[1]}</h1><small>${new Date().toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</small></div><div class="who">${esc(S.name)}</div></div>`;w.append($('#app'));
 const d=await api('installments?paid=eq.false&due_date=lte.'+td()+'&select=id');
 $('#nav').innerHTML=`<div class="brand"><i>◆</i><span>${esc(ST.company||'ERP')}</span></div>`+NAV.filter(([k])=>S.role=='admin'||k=='index'||S.perms.includes(k)).map(([k,t,ic])=>`<a href="${k}.html" class="${k==key?'on':''}"><svg viewBox="0 0 24 24">${ic}</svg>${t}</a>`).join('')
  +(d.length?`<a class="alert" href="purchases.html#due">⚠ ${d.length} دفعة/قسط مستحق — دفع أو ترحيل</a>`:'')+`<div class="nsp"></div><div class="user">${esc(S.name)}</div><a href="#" onclick="rpc('app_logout').finally(out);return false">تسجيل الخروج</a>`;
 new MutationObserver(tabify).observe($('#app'),{childList:true});
}
function tabify(){const m=$('#app');if(m.querySelector(':scope>.tabs'))return;const ss=[...m.children].filter(e=>e.dataset&&e.dataset.t);if(ss.length<2)return;
 const key='tab'+location.pathname,h=location.hash.slice(1).split(':')[0],hi=ss.findIndex(s=>s.id&&s.id==h);let a=hi>=0?hi:+(sessionStorage[key]||0);if(a>=ss.length)a=0;
 const bar=document.createElement('div');bar.className='tabs np';
 const show=i=>{ss.forEach((s,j)=>s.hidden=j!=i);[...bar.children].forEach((b,j)=>b.classList.toggle('on',j==i));sessionStorage[key]=i};
 ss.forEach((s,i)=>{const [l,hint]=s.dataset.t.split(/ \((.*)\)$/),b=document.createElement('button');b.textContent=l;b.onclick=()=>show(i);bar.append(b);
  const h3=s.querySelector(':scope>h3');if(hint)h3.outerHTML=`<p class="hint">${hint}</p>`;else h3.remove()});
 ss[0].before(bar);show(a)}

// ---- عناصر الواجهة
const F=(id,l,t='text',x='')=>`<label>${l}<input id="${id}" type="${t}" ${x}></label>`;
const OP=(rows,k='name')=>rows.map(r=>`<option value="${r.id}">${esc(r[k])}</option>`).join('');
const SL=(id,l,rows,k='name',x='')=>`<label>${l}<select id="${id}" ${x}>${OP(rows,k)}</select></label>`;
const FG=h=>`<div class="fg">${h}</div>`,ACT=h=>`<div class="act np">${h}</div>`,HR=t=>`\u0001${t}\u0002`;
const SEC=(t,b,i='')=>{const ps=String(b).split('\u0001'),cs=[];if(ps[0].trim())cs.push(`<div class="card"><div class="card-b">${ps[0]}</div></div>`);
 ps.slice(1).forEach(p=>{const [h,...r]=p.split('\u0002');cs.push(`<div class="card"><div class="card-h">${h}</div><div class="card-b">${r.join('\u0002')}</div></div>`)});
 return `<section data-t="${t}" ${i?`id="${i}"`:''}><h3>${t}</h3>${cs.join('')}</section>`};
const BD=(t,c='info')=>`<span class="bd ${c}">${t}</span>`;
const EMPTY=t=>`<div class="empty">${t}</div>`;
const RAW=/^\s*<(span|b|i|button|small|a)\b/,cell=(r,k,c)=>{if(Array.isArray(c))return c[1](r);const x=r[k]??'';return RAW.test(String(x))?x:esc(x)},lab=c=>Array.isArray(c)?c[0]:c;
const TB=(rows,cols,cls)=>rows.length?`<div class="sc"><table><thead><tr>${Object.values(cols).map(c=>`<th>${lab(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr class="${cls?cls(r):''}">${Object.entries(cols).map(([k,c])=>`<td>${cell(r,k,c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:EMPTY('لا توجد بيانات');
function MODAL(html){let m=$('#modal');if(!m){m=document.createElement('div');m.id='modal';document.body.append(m)}m.className='modal';m.hidden=false;m.onclick=closeModal;
 m.innerHTML=`<div class="sheet" onclick="event.stopPropagation()"><button class="x g np" onclick="closeModal()">✕</button>${html}</div>`}
const closeModal=()=>{const m=$('#modal');if(m)m.hidden=true};
const PRT=el=>{document.querySelectorAll('.pr').forEach(x=>x.classList.remove('pr'));el.classList.add('pr');document.body.classList.add('printing');print();document.body.classList.remove('printing')};
const DOC=(title,meta,body)=>MODAL(`<div class="dh"><b>${esc(ST.company||'')}</b><br><small>${esc(ST.phone||'')} ${esc(ST.address||'')}</small></div><h2>${title}</h2>${meta}${body}${ACT(`<button onclick="PRT(this.closest('.sheet'))">طباعة / PDF</button><button class="g" onclick="closeModal()">إغلاق</button>`)}`);
const PRINTDOC=(title,meta,rows,total)=>DOC(title,`<p>${meta}</p>`,TB(rows,{name:'الصنف',qty:'الكمية',price:'السعر',tot:'الإجمالي'})+`<h3 class="tot">الإجمالي: ${fm(total)}</h3>`);
async function showVoucher(id){const [x]=await api('vouchers?select=*,partners(name)&id=eq.'+id);
 DOC('سند صرف رقم '+x.id,`<p>التاريخ: ${x.date}</p>`,TB([{a:x.partners?.name||'—',b:x.kind,c:fm(x.amount),d:(x.from_at?x.from_at.slice(0,10):'—')+' → '+(x.to_at?x.to_at.slice(0,10):'—'),e:x.details||''}],{a:'المستلم',b:'النوع',c:'المبلغ',d:'الفترة',e:'البيان'}))}

// ---- التقارير: بحث + فلتر لكل عمود + إجماليات + اختيار الأعمدة + Excel + PDF
const R={},txt=x=>String(x??'').replace(/<[^>]+>/g,'').trim(),rtxt=(r,k,c)=>txt(Array.isArray(c)?c[1](r):r[k]);
function rrows(id){const {rows,cols,flt,q}=R[id];return rows.filter(r=>{
 for(const [k,c] of Object.entries(cols)){const f=flt[k];if(!f)continue;const t=rtxt(r,k,c),m=f.match(/^([<>]=?)\s*(-?[\d.]+)$/);
  if(m){const a=parseFloat(t.replace(/,/g,'')),b=+m[2];if(!(m[1]=='>'?a>b:m[1]=='>='?a>=b:m[1]=='<'?a<b:a<=b))return false}else if(!t.toLowerCase().includes(f.toLowerCase()))return false}
 return !q||Object.entries(cols).some(([k,c])=>rtxt(r,k,c).toLowerCase().includes(q))})}
function rbody(id){const o=R[id],rs=rrows(id),ks=Object.keys(o.cols).filter(k=>!o.hide.has(k)),num=o.o.num||o.o.tot||[],tot=o.o.tot||[];
 const body=rs.map(r=>`<tr class="${o.o.cls?o.o.cls(r):''}">${ks.map(k=>`<td class="${num.includes(k)?'n':['note','details','t','n','pn','party','src','sl'].includes(k)?'wr':''}">${cell(r,k,o.cols[k])}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${ks.length}" class="empty">لا توجد بيانات مطابقة</td></tr>`;
 const foot=tot.length?`<tr>${ks.map((k,i)=>`<td class="n">${tot.includes(k)?fm(sum(rs,r=>parseFloat(rtxt(r,k,o.cols[k]).replace(/,/g,''))||0)):i==0?'الإجمالي ('+rs.length+')':''}</td>`).join('')}</tr>`:`<tr><td colspan="${ks.length}" class="cnt">${rs.length} سجل</td></tr>`;
 return{body,foot}}
function rtab(id){const o=R[id],ks=Object.keys(o.cols).filter(k=>!o.hide.has(k)),b=rbody(id),wr=['note','details','t','n','pn','party','src','sl'];
 return `<div class="sc"><table class="rt"><thead><tr>${ks.map(k=>`<th>${lab(o.cols[k])}</th>`).join('')}</tr>${o.fl?`<tr class="fl np">${ks.map(k=>`<th><input placeholder="فلتر…" value="${esc(o.flt[k]||'')}" oninput="RF('${id}','${k}',this.value)"></th>`).join('')}</tr>`:''}</thead><tbody id="b-${id}">${b.body}</tbody><tfoot id="f-${id}">${b.foot}</tfoot></table></div>`}
function REP(id,title,rows,cols,o={}){R[id]={rows,cols,hide:new Set(),flt:{},q:'',o,title,fl:false};
 return `<div id="r-${id}" class="rep"><div class="dh"><b>${esc(ST.company||'')}</b><br><small>${esc(ST.phone||'')} ${esc(ST.address||'')}</small></div>
 <div class="rh"><div><h4>${title}</h4><small id="c-${id}">${rows.length} سجل</small></div><div class="tools np"><input class="q" placeholder="بحث في كل الحقول…" oninput="RQ('${id}',this.value)">
 <button class="g" onclick="FL('${id}')">فلاتر الأعمدة</button><details class="cols"><summary>الأعمدة</summary><div>${Object.entries(cols).map(([k,c])=>`<label class="ck"><input type="checkbox" checked onchange="tg('${id}','${k}',this.checked)">${lab(c)}</label>`).join('')}</div></details>
 <button class="g" onclick="xl('${id}')">Excel</button><button onclick="PRT($('#r-${id}'))">PDF / طباعة</button></div></div>${o.sub||''}<div id="t-${id}">${rtab(id)}</div></div>`}
const FL=id=>{R[id].fl=!R[id].fl;$('#t-'+id).innerHTML=rtab(id)};
const RF=(id,k,val)=>{R[id].flt[k]=val;const b=rbody(id);$('#b-'+id).innerHTML=b.body;$('#f-'+id).innerHTML=b.foot;$('#c-'+id).textContent=rrows(id).length+' سجل'};
const RQ=(id,val)=>{R[id].q=val.toLowerCase();const b=rbody(id);$('#b-'+id).innerHTML=b.body;$('#f-'+id).innerHTML=b.foot;$('#c-'+id).textContent=rrows(id).length+' سجل'};
const tg=(id,k,on)=>{on?R[id].hide.delete(k):R[id].hide.add(k);$('#t-'+id).innerHTML=rtab(id)};
const xl=id=>{const o=R[id],ks=Object.keys(o.cols).filter(k=>!o.hide.has(k));
 const data=rrows(id).map(r=>Object.fromEntries(ks.map(k=>[txt(lab(o.cols[k])),Array.isArray(o.cols[k])?txt(o.cols[k][1](r)):r[k]])));
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),'report');XLSX.writeFile(wb,o.title+'.xlsx')};
const SUMC=a=>`<div class="cards mini">${a.map(([l,x,c])=>`<div class="${c||''}">${l}<b>${typeof x=='number'?fm(x):x}</b></div>`).join('')}</div>`;

// ---- نطاق التاريخ والفترات المالية (افتراضياً الفترة الحالية فقط)
const periodSel=()=>`<label>الفترة المالية<select id="fp"><option value="cur">الفترة الحالية</option><option value="all">كل الفترات</option>${PERS.filter(p=>p.id!=CUR?.id).map(p=>`<option value="${p.id}">الفترة ${p.id} (${p.start_at.slice(0,10)} → ${(p.end_at||'').slice(0,10)})</option>`).join('')}</select></label>`;
const FBAR=(extra='',fn='showRep')=>`<div class="fg fbar">${periodSel()}${F('d1','من تاريخ','date')}${F('d2','إلى تاريخ','date')}${extra}${ACT(`<button onclick="${fn}()">عرض التقرير</button>`)}</div>`;
function FR(){const a=v('#d1'),b=v('#d2');if(a||b)return[new Date((a||'2000-01-01')+'T00:00:00'),new Date((b||'2999-01-01')+'T23:59:59')];
 const p=v('#fp');if(p=='all')return[new Date(0),new Date('2999-01-01')];const pr=p=='cur'?CUR:PERS.find(x=>x.id==p);return[new Date(pr.start_at),pr.end_at?new Date(pr.end_at):new Date('2999-01-01')]}
const inR=(x,fr,c='created_at')=>{const d=new Date(x[c]);return d>=fr[0]&&d<=fr[1]};
const withOpening=(rows,from)=>{let b=0;const old=rows.filter(r=>new Date(r.ts)<from),cur=rows.filter(r=>new Date(r.ts)>=from);const op=sum(old,r=>r.a);
 const res=(from.getTime()>0?[{d:'',t:'رصيد افتتاحي (ما قبل الفترة)',a:op}]:[]).concat(cur);res.forEach(r=>{b+=r.a;r.b=b;r.dr=r.a>0?r.a:'';r.cr=r.a<0?-r.a:''});return res};

// ---- مخزون ودفعات FIFO
const mv=(item_id,wh_id,qty,kind,ref,note)=>({item_id,wh_id,qty,kind,ref:ref??null,note:note??null});
const addBatch=(i,q,b,s,wh)=>post('purchase_lines',{item_id:i,wh_id:wh??null,qty:q,buy:b,sell:s,remaining:q});
async function take(i,q){const r=await rpc('fifo_take',{p_item:i,p_qty:q});return{cost:q?sum(r,x=>x.q*x.buy)/q:0,rows:r}}
async function ENS(t,name,extra={}){const r=await api(`${t}?name=eq.${encodeURIComponent(name)}`);return r[0]||(await post(t,{name,...extra}))[0]}
const ENP=(name,kind='external')=>ENS('payees',name,{kind});

// ---- الدفع: خزينة / تحويل خارجي / مساهمة مالية من الشركاء
const PML={cash:'من الخزينة',ext:'تحويل خارجي',contrib:'مساهمة مالية من الشركاء',inst:'أقساط / تاريخ استحقاق'},PMR={cash:'إلى الخزينة',ext:'تحويل وارد'};
const PM=(p,modes=['cash','ext','contrib'],l='طريقة الدفع',rec)=>`<label>${l}<select id="${p}_m" onchange="pmx('${p}')">${modes.map(m=>`<option value="${m}">${(rec?PMR:PML)[m]}</option>`).join('')}</select></label><div id="${p}_x" class="fg full"></div>`;
function pmx(p){const e=$('#'+p+'_m'),bx=$('#'+p+'_x');if(!e||!bx)return;const m=e.value;
 bx.innerHTML=m=='inst'?F(p+'_n','عدد الأقساط (1 = دفعة واحدة)','number','value=1 min=1')+F(p+'_u','تاريخ أول استحقاق','date')+F(p+'_g','الفاصل بين الأقساط (يوم)','number','value=30'):m=='ext'?F(p+'_r','كود التحويل / نوع تطبيق التحويل'):
 m=='contrib'?`<div class="hint full">حدد مبلغ مساهمة كل شريك — يجب أن يساوي المجموع إجمالي المبلغ، وتُسجَّل كإيداع في حساب كل شريك ثم كمصروف واحد.</div>`+(PT.map(x=>F(p+'_s'+x.id,'مساهمة '+esc(x.name),'number','min=0 step=any value=0')).join('')||'<div class="hint">لا يوجد شركاء</div>'):''}
const PMV=p=>{const g=id=>$('#'+p+'_'+id),via=g('m').value,ref=g('r')?g('r').value.trim():null;if(via=='ext'&&!ref)throw Error('اكتب كود التحويل أو نوع التطبيق');if(via=='inst'&&!(g('u')&&g('u').value))throw Error('حدد تاريخ الاستحقاق');
 return{via,ref,inst:g('n')?{n:Math.max(1,+g('n').value||1),u:g('u').value,g:+g('g').value||30}:null,shares:PT.map(x=>({id:x.id,amount:g('s'+x.id)?+g('s'+x.id).value||0:0}))}};
async function PAY(dir,via,amount,m={},shares=[]){amount=+(+amount).toFixed(2);if(!(amount>0))throw Error('المبلغ غير صحيح');
 if(via=='contrib'){const sh=shares.filter(s=>s.amount>0);if(!sh.length||Math.abs(sum(sh,s=>s.amount)-amount)>0.01)throw Error('مجموع مساهمات الشركاء يجب أن يساوي المبلغ ('+fm(amount)+')');
  for(const s of sh){const t=(await post('treasury_tx',{kind:'in',amount:s.amount,source:'partner',partner_id:s.id,note:'مساهمة لسداد: '+(m.note||'')}))[0];
   await post('partner_ledger',{partner_id:s.id,kind:'deposit',amount:s.amount,period_id:CUR?.id,note:'مساهمة لسداد: '+(m.note||''),tx_id:t.id})}via='cash'}
 if(via=='cash')return(await post('treasury_tx',{kind:dir,amount,...m}))[0];
 const {partner_id,payee_id,...mm}=m;return(await post('transfers',{dir,amount,...mm}))[0]}
async function treasuryBal(){const t=await all('treasury_tx?select=kind,amount&order=id');return sum(t,x=>x.kind=='in'?x.amount:-x.amount)}

// ---- الأرباح (تُحسب من بيانات المبيعات والمصروفات العامة)
async function PROFIT(f,t){f=encodeURIComponent(f);t=encodeURIComponent(t);const E=(b,c)=>`&${b?b+'.':''}${c}=gte.${f}&${b?b+'.':''}${c}=lte.${t}`;
 const [sl,rl,ex,xt]=await Promise.all([all('sales_lines?select=qty,price,cost,sales_invoices!inner(created_at)&order=id'+E('sales_invoices','created_at')),
  all('sales_return_lines?select=qty,price,cost,sales_returns!inner(created_at)&order=id'+E('sales_returns','created_at')),
  all('treasury_tx?kind=eq.out&source=in.(general,admin_pay)&order=id'+E('','created_at')),all('transfers?dir=eq.out&source=in.(general,admin_pay)&order=id'+E('','created_at'))]);
 const recs=[],A=(d,s,c,e)=>recs.push({d,sales:s,cost:c,exp:e});
 sl.forEach(x=>A(x.sales_invoices.created_at,x.qty*x.price,x.qty*x.cost,0));rl.forEach(x=>A(x.sales_returns.created_at,-x.qty*x.price,-x.qty*x.cost,0));ex.concat(xt).forEach(x=>A(x.created_at,0,0,x.amount));
 const s=sum(recs,r=>r.sales),c=sum(recs,r=>r.cost),e=sum(recs,r=>r.exp);return{recs,sales:s,cost:c,gross:s-c,exp:e,net:s-c-e}}
const grp=(recs,len)=>{const o={};recs.forEach(r=>{const t=o[r.d.slice(0,len)]??={d:r.d.slice(0,len),sales:0,cost:0,exp:0};t.sales+=r.sales;t.cost+=r.cost;t.exp+=r.exp});
 return Object.values(o).sort((a,b)=>a.d<b.d?-1:1).map(t=>({...t,gross:t.sales-t.cost,net:t.sales-t.cost-t.exp}))};
const PCOLS={d:'الفترة',sales:'المبيعات',cost:'التكلفة',gross:'إجمالي الربح',exp:'مصروفات عامة',net:'صافي الربح'};
// توزيع الربح على الشركاء: كل شريك يستحق فقط من تاريخ بدء نشاطه، والوزن = النسبة المحددة أو رأس المال
function SPLIT(recs,parts,cap){const base=p=>p.pct!=null?+p.pct:cap(p.id),o={};parts.forEach(p=>o[p.id]=0);
 recs.forEach(r=>{const net=r.sales-r.cost-r.exp,el=parts.filter(p=>!p.start_at||new Date(p.start_at)<=new Date(r.d)),w=sum(el,base);if(!w)return;el.forEach(p=>o[p.id]+=net*base(p)/w)});return o}
