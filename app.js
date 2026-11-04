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
function toast(t){let m=$('#m');if(!m){m=document.createElement('div');m.id='m';m.className='msg';document.body.append(m)}m.textContent=t;m.hidden=false;clearTimeout(m.t);m.t=setTimeout(()=>m.hidden=true,3500)}
async function go(f){try{await f();await load();render();toast('تم بنجاح')}catch(e){toast('خطأ: '+(e.message||e))}}

const NAV=[['index','الرئيسية'],['warehouses','المخازن'],['purchases','المشتريات'],['treasury','الخزينة والتحويلات'],['partners','الشركاء والأرباح'],['sales','المبيعات'],['settings','الإعدادات']];
async function boot(key){
 if(!S)return out();
 const me=await rpc('app_me').catch(()=>null);if(!me)return out();
 if(me.must_change){location='login.html?change=1';throw 0}
 S={...S,...me};
 if(!(S.role=='admin'||key=='index'||S.perms.includes(key))){document.body.innerHTML='<p style="padding:30px">ليس لديك صلاحية لهذه الصفحة</p>';throw 0}
 const [s,p,pt]=await Promise.all([api('settings?id=eq.1'),api('periods?status=eq.open&limit=1'),api('partners?active=eq.true&order=id')]);
 ST=s[0]||{};CUR=p[0];PT=pt;document.documentElement.style.setProperty('--c',ST.theme||'#0f766e');
 $('#nav').innerHTML=`<b>${ST.company||'ERP'}</b>`+NAV.filter(([k])=>S.role=='admin'||k=='index'||S.perms.includes(k)).map(([k,t])=>`<a href="${k}.html" class="${k==key?'on':''}">${t}</a>`).join('')+`<span style="margin-inline-start:auto">${S.name}</span><a href="#" onclick="rpc('app_logout').finally(out)">خروج</a>`;
 const d=await api('installments?paid=eq.false&due_date=lte.'+td()+'&select=id');
 if(d.length)$('#nav').insertAdjacentHTML('afterend',`<a class="alert" href="purchases.html#due">⚠ يوجد ${d.length} دفعة/قسط مستحق الدفع — اضغط للمعالجة (دفع أو ترحيل)</a>`);
}

// ---- عناصر واجهة
const F=(id,l,t='text',x='')=>`<label>${l}<input id="${id}" type="${t}" ${x}></label>`;
const OP=(rows,k='name')=>rows.map(r=>`<option value="${r.id}">${r[k]}</option>`).join('');
const SL=(id,l,rows,k='name',x='')=>`<label>${l}<select id="${id}" ${x}>${OP(rows,k)}</select></label>`;
const SEC=(t,b,i='')=>`<section ${i?`id="${i}"`:''}><h3>${t}</h3>${b}</section>`;
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
const pr=id=>{document.querySelectorAll('section').forEach(s=>s.classList.remove('pr'));$('#r-'+id).classList.add('pr');print()};
function PRINTDOC(title,meta,rows,total){let d=$('#pv');if(!d){d=document.createElement('div');d.id='pv';$('#app').after(d)}
 d.innerHTML=`<section><div class="ph" style="text-align:center"><b>${ST.company||''}</b><br>${ST.phone||''} ${ST.address||''}</div><h3>${title}</h3><p>${meta}</p>${TB(rows,{name:'الصنف',qty:'الكمية',price:'السعر',tot:'الإجمالي'})}<h3>الإجمالي: ${fm(total)}</h3><button class="np" onclick="this.parentNode.classList.add('pr');print()">طباعة الفاتورة</button></section>`;
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
async function PROFIT(f,t){const E=(b,c)=>`&${b?b+'.':''}${c}=gte.${f}&${b?b+'.':''}${c}=lte.${t}`;
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
