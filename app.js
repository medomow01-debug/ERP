// ===== المكتبة المشتركة لكل الصفحات =====
const U='https://kmoqrhqtokxlfiynzpou.supabase.co',K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb3FyaHF0b2t4bGZpeW56cG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MDk5NTQsImV4cCI6MjEwOTM4NTk1NH0.o-xpXehAR8tRbgObb1OfM5giYxpLt2kXsO2LYzSZfh8';
let S=JSON.parse(localStorage.erp||'null'),ST={},CUR=null,PT=[];
const hd=()=>({apikey:K,Authorization:'Bearer '+K,'x-token':S?.token||'','Content-Type':'application/json',Prefer:'return=representation'});
async function api(p,m='GET',b){const r=await fetch(U+'/rest/v1/'+p,{method:m,headers:hd(),body:b===undefined?undefined:JSON.stringify(b)});
 const j=await r.json().catch(()=>null);if(!r.ok)throw new Error(j?.message||r.status);return j}
const post=(t,b)=>api(t,'POST',b),patch=(t,f,b)=>api(t+'?'+f,'PATCH',b),rpc=(f,a={})=>api('rpc/'+f,'POST',a);
async function all(p){let o=[],i=0;for(;;){const r=await api(p+(p.includes('?')?'&':'?')+'limit=1000&offset='+i);o=o.concat(r);if(r.length<1000)return o;i+=1000}}
const $=s=>document.querySelector(s),v=s=>$(s).value.trim(),n=s=>+$(s).value||0,td=()=>new Date().toISOString().slice(0,10);
const sum=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0),fm=x=>(+x||0).toLocaleString('en',{maximumFractionDigits:2});
const out=()=>{localStorage.removeItem('erp');location='login.html'};
function toast(t){let m=$('#m');if(!m){m=document.createElement('div');m.id='m';document.body.append(m)}m.className='msg'+(String(t).startsWith('خطأ')?' err':'');m.textContent=t;m.hidden=false;clearTimeout(m.t);m.t=setTimeout(()=>m.hidden=true,4000)}
addEventListener('unhandledrejection',e=>{if(e.reason!==0)toast('خطأ: '+(e.reason?.message||e.reason))});
async function go(f){try{await f();await load();render();toast('تم بنجاح')}catch(e){toast('خطأ: '+(e.message||e))}}

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
 const [s,p,pt]=await Promise.all([api('settings?id=eq.1'),api('periods?status=eq.open&limit=1'),api('partners?active=eq.true&order=id')]);
 ST=s[0]||{};CUR=p[0];PT=pt;document.documentElement.style.setProperty('--c',ST.theme||'#0f766e');
 const cur=NAV.find(x=>x[0]==key),w=document.createElement('div');w.className='wrap';$('#app').before(w);
 w.innerHTML=`<div id="top"><div><h1>${cur[1]}</h1><small>${new Date().toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</small></div><div class="who">${S.name}</div></div>`;w.append($('#app'));
 const d=await api('installments?paid=eq.false&due_date=lte.'+td()+'&select=id');
 $('#nav').innerHTML=`<div class="brand"><i>◆</i><span>${ST.company||'ERP'}</span></div>`+NAV.filter(([k])=>S.role=='admin'||k=='index'||S.perms.includes(k)).map(([k,t,ic])=>`<a href="${k}.html" class="${k==key?'on':''}"><svg viewBox="0 0 24 24">${ic}</svg>${t}</a>`).join('')
  +(d.length?`<a class="alert" href="purchases.html#due">⚠ ${d.length} دفعة/قسط مستحق — دفع أو ترحيل</a>`:'')+`<div class="nsp"></div><div class="user">${S.name}</div><a href="#" onclick="rpc('app_logout').finally(out);return false">تسجيل الخروج</a>`;
 new MutationObserver(tabify).observe($('#app'),{childList:true});
}
// أقسام الصفحة تظهر كتبويبات: يظهر قسم واحد فقط في كل مرة
function tabify(){const m=$('#app');if(m.querySelector(':scope>.tabs'))return;const ss=[...m.children].filter(e=>e.dataset&&e.dataset.t);if(ss.length<2)return;
 const key='tab'+location.pathname,hi=ss.findIndex(s=>s.id&&s.id==location.hash.slice(1));let a=hi>=0?hi:+(sessionStorage[key]||0);if(a>=ss.length)a=0;
 const bar=document.createElement('div');bar.className='tabs np';
 const show=i=>{ss.forEach((s,j)=>s.hidden=j!=i);[...bar.children].forEach((b,j)=>b.classList.toggle('on',j==i));sessionStorage[key]=i};
 ss.forEach((s,i)=>{const [l,hint]=s.dataset.t.split(/ \((.*)\)$/),b=document.createElement('button');b.textContent=l;b.onclick=()=>show(i);bar.append(b);
  const h=s.querySelector(':scope>h3');if(hint)h.outerHTML=`<p class="hint">${hint}</p>`;else h.remove()});
 ss[0].before(bar);show(a)}

// ---- عناصر واجهة
const F=(id,l,t='text',x='')=>`<label>${l}<input id="${id}" type="${t}" ${x}></label>`;
const OP=(rows,k='name')=>rows.map(r=>`<option value="${r.id}">${r[k]}</option>`).join('');
const SL=(id,l,rows,k='name',x='')=>`<label>${l}<select id="${id}" ${x}>${OP(rows,k)}</select></label>`;
const SEC=(t,b,i='')=>`<section data-t="${t}" ${i?`id="${i}"`:''}><h3>${t}</h3>${b}</section>`;
const lab=c=>Array.isArray(c)?c[0]:c,cell=(r,k,c)=>Array.isArray(c)?c[1](r):(r[k]??'');
const TB=(rows,cols,cls)=>`<div class="sc"><table><tr>${Object.values(cols).map(c=>`<th>${lab(c)}</th>`).join('')}</tr>${rows.map(r=>`<tr class="${cls?cls(r):''}">${Object.entries(cols).map(([k,c])=>`<td>${cell(r,k,c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
const DR=id=>F(id+'1','من تاريخ','date')+F(id+'2','إلى تاريخ','date');
const RG=(c,id)=>(v('#'+id+'1')?`&${c}=gte.${v('#'+id+'1')}T00:00:00`:'')+(v('#'+id+'2')?`&${c}=lte.${v('#'+id+'2')}T23:59:59`:'');

// ---- التقارير: اختيار الحقول + Excel + PDF(طباعة)
const R={};
function rt(id){const {rows,cols,hide,cls}=R[id];return TB(rows,Object.fromEntries(Object.entries(cols).filter(([k])=>!hide.has(k))),cls)}
function REP(id,title,rows,cols,cls){R[id]={rows,cols,hide:new Set(),title,cls};
 return `<section id="r-${id}"><div class="ph" style="text-align:center"><b>${ST.company||''}</b><br>${ST.phone||''} ${ST.address||''}</div><h3>${title}</h3><div class="r np">${Object.entries(cols).map(([k,c])=>`<label class="ck"><input type="checkbox" checked onchange="tg('${id}','${k}',this.checked)">${lab(c)}</label>`).join('')}<button onclick="xl('${id}')">Excel</button><button onclick="pr('${id}')">PDF / طباعة</button></div><div id="t-${id}">${rt(id)}</div></section>`}
const tg=(id,k,on)=>{on?R[id].hide.delete(k):R[id].hide.add(k);$('#t-'+id).innerHTML=rt(id)};
const xl=id=>{const {rows,cols,hide,title}=R[id],ks=Object.keys(cols).filter(k=>!hide.has(k));
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.map(r=>Object.fromEntries(ks.map(k=>{const x=cell(r,k,cols[k]);return[lab(cols[k]),typeof x=='string'?x.replace(/<[^>]+>/g,''):x]})))),'report');XLSX.writeFile(wb,title+'.xlsx')};
const PRT=el=>{document.querySelectorAll('.pr').forEach(x=>x.classList.remove('pr'));el.classList.add('pr');document.body.classList.add('printing');print();document.body.classList.remove('printing')};
const pr=id=>PRT($('#r-'+id));
function PRINTDOC(title,meta,rows,total){let d=$('#pv');if(!d){d=document.createElement('div');d.id='pv';$('#app').after(d)}
 d.innerHTML=`<section><div class="ph" style="text-align:center"><b>${ST.company||''}</b><br>${ST.phone||''} ${ST.address||''}</div><h3>${title}</h3><p>${meta}</p>${TB(rows,{name:'الصنف',qty:'الكمية',price:'السعر',tot:'الإجمالي'})}<h3>الإجمالي: ${fm(total)}</h3><button class="np" onclick="PRT(this.parentNode)">طباعة الفاتورة</button></section>`;
 d.scrollIntoView()}

// ---- المخزون والدفعات
const mv=(item_id,wh_id,qty,kind,ref,note)=>({item_id,wh_id,qty,kind,ref:ref??null,note:note??null});
const addBatch=(i,q,b,s,wh)=>post('purchase_lines',{item_id:i,wh_id:wh??null,qty:q,buy:b,sell:s,remaining:q});
async function take(i,q){const r=await rpc('fifo_take',{p_item:i,p_qty:q});return{cost:sum(r,x=>x.q*x.buy)/q}}
async function ENS(t,name,extra={}){const r=await api(`${t}?name=eq.${encodeURIComponent(name)}`);return r[0]||(await post(t,{name,...extra}))[0]}

// ---- الدفع: خزينة أو تحويل خارجي (مع توزيع على الشركاء)
const SHR=p=>PT.length?'<div class="r">'+PT.map(x=>F(p+x.id,'حصة '+x.name,'number','min=0 value=0')).join('')+'<small>(اختياري: يظهر في حساب الشريك، والباقي مصروف عام)</small></div>':'';
const GSH=p=>PT.map(x=>({id:x.id,amount:n('#'+p+x.id)}));
async function PAY(dir,via,amount,m={},shares=[]){amount=+(+amount).toFixed(2);
 if(via=='cash')return post('treasury_tx',{kind:dir,amount,...m});
 const {partner_id,...mm}=m;const t=(await post('transfers',{dir,amount,...mm}))[0],sh=shares.filter(s=>s.amount>0);
 if(sh.length){if(sum(sh,s=>s.amount)>amount+.01)throw Error('مجموع حصص الشركاء أكبر من المبلغ');
  await post('transfer_shares',sh.map(s=>({transfer_id:t.id,partner_id:s.id,amount:s.amount})));
  await post('partner_ledger',sh.map(s=>({partner_id:s.id,kind:'deposit',amount:s.amount,period_id:CUR?.id,note:'تحويل: '+(m.note||'')})))}
 return t}

// ---- الأرباح
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
const isoRange=(a,b)=>[a?a+'T00:00:00':'2000-01-01T00:00:00',b?b+'T23:59:59':'2999-01-01T00:00:00'];
