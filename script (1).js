'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const MU0=4e-7*Math.PI,RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEF={mode:'DC',on:false,N:500,L:1,R:100,Vdc:12,Vac:12,f:10,I0:0,A:20,len:10,mur:1,speed:1,solMode:false,showField:true,showGraph:true};
const S=Object.assign({running:true,t:0,t0:0,i0:0,hist:[]},DEF);
// [kunci, label, min, max, step, satuan, log?]
const SL=[['N','Jumlah lilitan N',10,1000,10,''],['L','Induktansi L (skala log)',1e-3,5,0,'H',1],['R','Resistansi R',1,1000,1,'Ω'],['Vdc','Tegangan sumber DC',0,24,.5,'V'],['Vac','Tegangan sumber AC (rms)',0,24,.5,'V'],['f','Frekuensi AC',1,100,1,'Hz'],['I0','Arus awal (diterapkan seketika)',0,1,.01,'A'],['A','Luas penampang A',1,100,1,'cm²'],['len','Panjang kumparan l',2,50,1,'cm'],['mur','Permeabilitas relatif μr (udara 1, besi ≈ 200)',1,1000,1,''],['speed','Kecepatan animasi',.1,3,.1,'×']];

function fmt(x,u=''){if(!isFinite(x))return'–';const a=Math.abs(x);if(a===0)return'0 '+u;const P=[[1e3,'k',1e-3],[1,'',1],[1e-3,'m',1e3],[1e-6,'µ',1e6],[1e-9,'n',1e9]];const k=P.find(p=>a>=p[0])||P[4];return (+(x*k[2]).toPrecision(3))+' '+k[1]+u}
let warn='';
function getL(){if(!S.solMode){warn='';return S.L}const L=MU0*S.mur*S.N*S.N*S.A*1e-4/(S.len*1e-2),c=Math.min(5,Math.max(1e-3,L));warn=c!==L?`L solenoida terhitung ${fmt(L,'H')}; dibatasi ke ${fmt(c,'H')} agar sesuai batas model (1 mH sampai 5 H).`:'';return c}
function par(){const L=getL(),R=S.R,w=2*Math.PI*S.f,Vm=S.Vac*Math.SQRT2,X=w*L,Z=Math.hypot(R,X);return{L,R,tau:L/R,w,Vm,X,Z,phi:Math.atan2(X,R),Im:Vm/Z}}
// Persamaan: L di/dt + R i = vs(t). Solusi eksak = partikular + homogen.
const vs=(t,p)=>!S.on?0:S.mode==='DC'?S.Vdc:p.Vm*Math.sin(p.w*t);
const ip=(t,p)=>!S.on?0:S.mode==='DC'?S.Vdc/p.R:p.Im*Math.sin(p.w*t-p.phi);
const cur=(t,p)=>ip(t,p)+(S.i0-ip(S.t0,p))*Math.exp(-(t-S.t0)/p.tau);
function anchor(){S.i0=cur(S.t,par());S.t0=S.t}   // panggil SEBELUM mengubah parameter
function st(){const p=par(),i=cur(S.t,p),v=vs(S.t,p),vR=p.R*i,vL=v-vR;return{p,i,v,vR,vL,d:vL/p.L}}
const winLen=p=>S.mode==='AC'?4/S.f:Math.max(6*p.tau,1e-6);
const sc=p=>Math.max(S.mode==='DC'?S.Vdc/p.R:p.Im,1e-9);
function sample(){const{p,i,v,vR,vL}=st();S.hist.push({t:S.t,i,vs:v,vR,vL,W:.5*p.L*i*i});if(S.hist.length>4000)S.hist.splice(0,1000)}
const say=m=>{$('#status').textContent=m};

/* ---------- SVG rangkaian ---------- */
let dp=0;
function buildSvg(){let coil='M200,250';for(let k=0;k<12;k++)coil+='a10,18 0 0 1 20,0';
$('#svg').innerHTML=`
<g id="fld" class="fl"><ellipse cx="320" cy="250" rx="150" ry="45"/><ellipse cx="320" cy="250" rx="190" ry="70"/><ellipse cx="320" cy="250" rx="225" ry="85"/></g>
<path class="w" d="M60,250V60H580V250H60"/><path id="flow" class="cur" d="M60,250V60H580V250H60"/>
<rect class="cv" x="40" y="115" width="40" height="70"/><circle class="m" cx="60" cy="150" r="22"/><text id="srcT" class="tb" x="60" y="155" text-anchor="middle">DC</text><text class="pm" x="72" y="118">+</text><text id="srcV" class="tx" x="88" y="154"></text>
<rect class="cv" x="115" y="40" width="70" height="40"/><circle class="m" cx="120" cy="60" r="4"/><circle class="m" cx="180" cy="60" r="4"/><line id="sw" class="w" x1="120" y1="60" x2="178" y2="60"/><text class="tx" x="150" y="90" text-anchor="middle">Sakelar</text>
<rect class="cv" x="300" y="40" width="80" height="40"/><path class="w" d="M300,60h10l5,-14l10,28l10,-28l10,28l10,-28l10,28l5,-14h10"/><text class="tx" x="340" y="90" text-anchor="middle">R</text>
<circle class="m" cx="480" cy="60" r="22"/><text class="tb" x="480" y="65" text-anchor="middle">A</text><text id="ammV" class="tx" x="480" y="100" text-anchor="middle"></text>
<rect class="cv" x="198" y="226" width="244" height="48"/><rect id="core" x="200" y="236" width="240" height="28" fill="#9ca3af" opacity=".6" display="none"/><path class="coil" d="${coil}"/>
<text id="pL" class="pm" x="176" y="244"></text><text id="pR" class="pm" x="448" y="244"></text>
<circle class="m" cx="110" cy="310" r="20"/><text class="tb" x="110" y="315" text-anchor="middle">V</text><text id="vmV" class="tx" x="138" y="307"></text><text class="tx" x="138" y="323">vL terminal</text>
<text id="emfT" class="tb" x="320" y="112" text-anchor="middle"></text><text id="lenzT" class="tx" x="320" y="134" text-anchor="middle"></text><text id="fluxT" class="tx" x="320" y="154" text-anchor="middle"></text>
<text id="bT" class="tx" x="320" y="214" text-anchor="middle"></text><text id="lT" class="tb" x="440" y="318" text-anchor="middle"></text>`}
function drawSvg(dt,s){const{p,i,v,vL,d}=s,k=sc(p),r=Math.min(1,Math.abs(i)/k);
if(!RM)dp-=(i/k)*dt*120;$('#flow').style.strokeDashoffset=dp;$('#flow').style.strokeOpacity=.2+.8*r;
$('#fld').style.opacity=S.showField?.15+.85*r:0;$('#fld').style.strokeWidth=1.5+3*r;
const sw=$('#sw');sw.setAttribute('x2',S.on?178:168);sw.setAttribute('y2',S.on?60:32);
$('#srcT').textContent=S.mode;$('#srcV').textContent=S.mode==='DC'?fmt(S.Vdc,'V'):fmt(S.Vac,'Vrms');
$('#ammV').textContent=fmt(i,'A');$('#vmV').textContent=fmt(vL,'V');$('#lT').textContent='L = '+fmt(p.L,'H');
const core=$('#core');core.setAttribute('display',S.solMode&&S.mur>1?'inline':'none');
const z=Math.abs(d)<1e-3*k/p.tau?0:Math.sign(d);
$('#pR').textContent=z>0?'+':z<0?'−':'';$('#pL').textContent=z>0?'−':z<0?'+':'';
$('#emfT').textContent='εL = −L·di/dt = '+fmt(-vL,'V');
$('#lenzT').textContent=z>0?'di/dt > 0, arus naik: εL negatif, menentang kenaikan':z<0?'di/dt < 0, arus turun: εL positif, menentang penurunan':'di/dt ≈ 0: arus hampir konstan, εL ≈ 0';
$('#fluxT').textContent='dΦB/dt = (L/N)·di/dt = '+fmt(p.L*d/S.N,'Wb/s');
$('#bT').textContent=S.showField?'B '+(i>=0?'→':'←')+' (skematis, '+(z>0?'menguat':z<0?'melemah':'tetap')+')':''}

/* ---------- Hasil ---------- */
const ROWS=[['L','Induktansi L'],['R','Resistansi R'],['v','Tegangan sumber sesaat'],['i','Arus sesaat i(t)'],['is','Arus tunak (DC: V/R; AC: amplitudo)'],['vL','Tegangan terminal vL = L·di/dt'],['vR','Tegangan resistor vR = R·i'],['e','GGL induksi diri εL = −L·di/dt'],['d','Laju di/dt'],['tau','Konstanta waktu τ = L/R'],['W','Energi magnetik W = ½Li²'],['phiB','Fluks per lilitan ΦB = L·i/N'],['XL','Reaktansi XL = 2πfL'],['Z','Impedansi Z (RL seri)'],['pf','Faktor daya cosφ'],['ph','Sudut fase φ']];
function updRes(s){const{p,i,v,vR,vL,d}=s,ac=S.mode==='AC',o={L:fmt(p.L,'H'),R:fmt(p.R,'Ω'),v:fmt(v,'V'),i:fmt(i,'A'),is:fmt(!S.on?0:ac?p.Im:S.Vdc/p.R,'A'),vL:fmt(vL,'V'),vR:fmt(vR,'V'),e:fmt(-vL,'V'),d:fmt(d,'A/s'),tau:fmt(p.tau,'s'),W:fmt(.5*p.L*i*i,'J'),phiB:fmt(p.L*i/S.N,'Wb'),XL:ac?fmt(p.X,'Ω'):'– (mode AC)',Z:ac?fmt(p.Z,'Ω'):'– (mode AC)',pf:ac?(p.R/p.Z).toFixed(3):'–',ph:ac?(p.phi*180/Math.PI).toFixed(1)+'°':'–'};
for(const k in o)$('#r_'+k).textContent=o[k];$('#msg').textContent=warn;outs()}

/* ---------- Kontrol ---------- */
function outs(){SL.forEach(([k,,,,,u])=>{$('#o_'+k).textContent=k==='L'?fmt(getL(),'H'):S[k]+' '+u})}
function sync(){SL.forEach(([k,,a,b,,,lg])=>{const el=$('#s_'+k);el.value=lg?1000*Math.log(S[k]/a)/Math.log(b/a):S[k];
if(k==='L')el.disabled=S.solMode;if(['A','len','mur'].includes(k))el.disabled=!S.solMode});
$('#solMode').checked=S.solMode;
const pr=(id,v)=>$(id).setAttribute('aria-pressed',v);pr('#bSw',S.on);pr('#bDC',S.mode==='DC');pr('#bAC',S.mode==='AC');pr('#bField',S.showField);pr('#bGraph',S.showGraph);
$('#bSw').textContent='Sakelar: '+(S.on?'ON':'OFF');$$('.cc').forEach(c=>{if(c.closest('#miniCharts'))c.hidden=!S.showGraph});outs()}
function setOn(v){anchor();S.on=v;sync();say(v?'Sakelar ON: sumber terhubung. Arus naik dari nilai awalnya dan εL menentang kenaikan.':'Sakelar OFF: sumber dilepas, arus meluruh eksponensial lewat jalur pelepasan; εL berbalik polaritas.')}
function setMode(m){anchor();S.mode=m;sync();say('Mode '+m+' dipilih.')}
function reset(){Object.assign(S,DEF,{running:true,t:0,t0:0,i0:0,hist:[]});dp=0;sync();say('Simulasi dikembalikan ke kondisi awal.')}
function initCtl(){
$('#ctl').innerHTML=SL.map(([k,l,a,b,s,u,lg])=>`<div class="sl"><label for="s_${k}">${l}</label><div><input type="range" id="s_${k}" min="${lg?0:a}" max="${lg?1000:b}" step="${lg?1:s}"><output id="o_${k}" for="s_${k}"></output></div></div>`).join('');
SL.forEach(([k,,a,b,,,lg])=>$('#s_'+k).addEventListener('input',e=>{const x=lg?a*Math.pow(b/a,e.target.value/1000):+e.target.value;
if(k==='I0'){S.I0=x;S.i0=x;S.t0=S.t}else{anchor();S[k]=x}outs()}));
$('#solMode').onchange=e=>{anchor();S.solMode=e.target.checked;sync();say(S.solMode?'Model solenoida: L dihitung dari μ₀μr, N, A, dan l.':'Model langsung: L diatur oleh slider.')};
$('#bStart').onclick=()=>{S.running=true;if(!S.on)setOn(true);else say('Simulasi berjalan.')};
$('#bPause').onclick=()=>{S.running=false;say('Simulasi dijeda.')};
$('#bResume').onclick=()=>{S.running=true;say('Simulasi dilanjutkan.')};
$('#bReset').onclick=reset;$('#bSw').onclick=()=>setOn(!S.on);
$('#bDC').onclick=()=>setMode('DC');$('#bAC').onclick=()=>setMode('AC');
$('#bField').onclick=()=>{S.showField=!S.showField;sync()};$('#bGraph').onclick=()=>{S.showGraph=!S.showGraph;sync()};
$('#bExp').onclick=()=>showTab('eksperimen');
$('#res').innerHTML=ROWS.map(([k,l])=>`<div><span>${l}</span><b id="r_${k}"></b></div>`).join('')}

/* ---------- Grafik ---------- */
const CH=[{id:'i',t:'Arus i(t)',u:'A',s:[['i','#2563eb',q=>q.i]]},
{id:'v',t:'Tegangan: sumber, induktor, resistor',u:'V',s:[['v sumber','#16a34a',q=>q.vs],['vL induktor','#9333ea',q=>q.vL],['vR resistor','#ea580c',q=>q.vR]]},
{id:'w',t:'Energi magnetik W(t) = ½Li²',u:'J',s:[['W','#0891b2',q=>q.W]]},
{id:'ph',t:'Beda fase v dan i (AC, dinormalkan)',u:'',ac:1,s:[['v/Vm','#16a34a',(q,p)=>q.vs/(p.Vm||1)],['i/Im','#2563eb',(q,p)=>q.i/(p.Im||1)]]}];
const charts=[];
function mkCharts(sel,ids){$(sel).innerHTML='';ids.forEach(id=>{const c=CH.find(x=>x.id===id),d=document.createElement('div');d.className='cc';d.innerHTML=`<h3>${c.t} (sumbu x: waktu simulasi, s)</h3><canvas role="img" aria-label="Grafik ${c.t}"></canvas>`;$(sel).append(d);
const o={c,cv:d.querySelector('canvas'),hx:null};o.cv.addEventListener('pointermove',e=>{o.hx=e.offsetX});o.cv.addEventListener('pointerleave',()=>{o.hx=null});charts.push(o)})}
function draw(o){const{c,cv}=o,w=cv.clientWidth,h=cv.clientHeight,dpr=devicePixelRatio||1;if(!w)return;
if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}
const g=cv.getContext('2d'),fg=getComputedStyle(document.body).getPropertyValue('--fg'),bd=getComputedStyle(document.body).getPropertyValue('--bd');
g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);g.font='11px system-ui,sans-serif';g.fillStyle=fg;
if(c.ac&&S.mode!=='AC'){g.fillText('Pilih Mode AC untuk melihat beda fase tegangan dan arus.',10,30);return}
const p=par(),win=winLen(p),t1=S.t,t0=t1-win,pts=S.hist.filter(q=>q.t>=t0);
let lo=0,hi=0;c.s.forEach(s=>pts.forEach(q=>{const x=s[2](q,p);if(isFinite(x)){lo=Math.min(lo,x);hi=Math.max(hi,x)}}));
if(hi-lo<1e-15){hi=lo+1e-3}const pad=(hi-lo)*.08;hi+=pad;if(lo<0)lo-=pad;
const m={l:58,r:8,t:26,b:22},W=w-m.l-m.r,H=h-m.t-m.b,X=t=>m.l+(t-t0)/win*W,Y=v=>m.t+H-(v-lo)/(hi-lo)*H;
g.strokeStyle=bd;g.lineWidth=1;g.textAlign='right';
for(let k=0;k<=4;k++){const v=lo+(hi-lo)*k/4,y=Y(v);g.beginPath();g.moveTo(m.l,y);g.lineTo(w-m.r,y);g.stroke();g.fillText(c.u?fmt(v,c.u):(+v.toPrecision(2)),m.l-4,y+4)}
g.textAlign='center';for(let k=0;k<=2;k++)g.fillText(fmt(t0+win*k/2,'s'),m.l+W*k/2,h-6);
g.strokeStyle=fg;g.beginPath();g.moveTo(m.l,Y(0));g.lineTo(w-m.r,Y(0));g.stroke();
let lx=m.l;g.textAlign='left';
c.s.forEach(s=>{g.strokeStyle=s[1];g.lineWidth=2;g.beginPath();pts.forEach((q,n)=>{const x=X(q.t),y=Y(s[2](q,p));n?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();
g.fillStyle=s[1];g.fillRect(lx,8,12,4);g.fillStyle=fg;g.fillText(s[0],lx+16,13);lx+=g.measureText(s[0]).width+32});
if(o.hx!=null&&pts.length){let b=pts[0];pts.forEach(q=>{if(Math.abs(X(q.t)-o.hx)<Math.abs(X(b.t)-o.hx))b=q});const x=X(b.t);g.strokeStyle=fg;g.lineWidth=1;g.beginPath();g.moveTo(x,m.t);g.lineTo(x,m.t+H);g.stroke();
g.textAlign='right';g.fillStyle=fg;g.fillText('t = '+fmt(b.t,'s'),w-m.r-4,m.t+14);c.s.forEach((s,n)=>{g.fillStyle=s[1];g.fillText(s[0]+' = '+(c.u?fmt(s[2](b,p),c.u):(+s[2](b,p).toPrecision(3))),w-m.r-4,m.t+28+14*n)})}}

/* ---------- Contoh perhitungan ---------- */
function example(){const p=par(),I=S.Vdc/p.R,f=x=>+x.toPrecision(4);
$('#ex').textContent=`A. RL seri DC (V = ${S.Vdc} V, R = ${p.R} Ω, L = ${f(p.L)} H)
τ = L/R = ${f(p.L)}/${p.R} = ${f(p.tau)} s
I tunak = V/R = ${S.Vdc}/${p.R} = ${f(I)} A
i(τ) = 0,632 × ${f(I)} = ${f(.632*I)} A
di/dt saat t = 0⁺ (arus awal 0) = V/L = ${f(S.Vdc/p.L)} A/s, jadi |εL| = ${f(S.Vdc)} V
W akhir = ½Li² = ½ × ${f(p.L)} × ${f(I)}² = ${f(.5*p.L*I*I)} J

B. RL seri AC (Vrms = ${S.Vac} V, f = ${S.f} Hz)
XL = 2πfL = 2π × ${S.f} × ${f(p.L)} = ${f(p.X)} Ω
Z = √(R² + XL²) = ${f(p.Z)} Ω
Irms = Vrms/Z = ${f(S.Vac/p.Z)} A
φ = arctan(XL/R) = ${f(p.phi*180/Math.PI)}° (arus tertinggal terhadap tegangan)
cosφ = R/Z = ${f(p.R/p.Z)}`}

/* ---------- Eksperimen ---------- */
const f3=x=>+x.toPrecision(3),tbl=(h,r)=>`<table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${r.map(a=>`<tr>${a.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;
const EX=[
{t:'1. Pengaruh induktansi',g:'Mengamati pengaruh L terhadap konstanta waktu.',st:['Mode DC, R = 100 Ω, V = 12 V.','Ubah L: 0,1; 0,5; 1; 2; 5 H.','Tekan Sakelar ON, amati kecepatan arus naik.'],iv:'L',dv:'τ, waktu mendekati tunak',cv:'R, V',P:{mode:'DC',R:100,Vdc:12,L:1,solMode:false},
run:()=>({h:['L (H)','τ (ms)','I tunak (A)','≈95% pada 3τ (ms)'],r:[.1,.5,1,2,5].map(L=>[L,f3(L/.1),.12,f3(3*L/.1)]),c:'τ sebanding dengan L, sedangkan I tunak = V/R tidak berubah. Induktansi hanya memperlambat arus.'})},
{t:'2. Pengaruh resistansi',g:'Mengamati pengaruh R terhadap τ dan arus tunak.',st:['Mode DC, L = 1 H, V = 12 V.','Ubah R: 10, 50, 100, 500 Ω.','Amati arus tunak dan kecepatan naik.'],iv:'R',dv:'τ, I tunak',cv:'L, V',P:{mode:'DC',R:100,Vdc:12,L:1,solMode:false},
run:()=>({h:['R (Ω)','τ (ms)','I tunak (A)'],r:[10,50,100,500].map(R=>[R,f3(1e3/R),f3(12/R)]),c:'R besar membuat τ lebih kecil dan arus tunak lebih kecil: τ ∝ 1/R, I tunak ∝ 1/R.'})},
{t:'3. Pengaruh tegangan sumber',g:'Mengamati pengaruh V terhadap arus dan GGL induksi.',st:['Mode DC, L = 1 H, R = 100 Ω.','Ubah V: 3, 6, 12, 24 V.','Amati arus tunak dan εL sesaat setelah ON.'],iv:'V',dv:'I tunak, di/dt awal, εL',cv:'L, R',P:{mode:'DC',R:100,Vdc:12,L:1,solMode:false},
run:()=>({h:['V (V)','I tunak (A)','di/dt pada 0⁺ (A/s)','|εL| pada 0⁺ (V)','τ (ms)'],r:[3,6,12,24].map(V=>[V,V/100,V,V,10]),c:'I tunak dan di/dt awal sebanding dengan V. Pada 0⁺ seluruh V jatuh di induktor (|εL| = V), τ tetap.'})},
{t:'4. Hukum Lenz',g:'Mengamati arah GGL induksi saat arus naik dan turun.',st:['Mode DC, L = 1 H, R = 100 Ω, V = 12 V.','Sakelar ON, lihat tanda + / − pada ujung kumparan.','Tunggu arus tunak, lalu Sakelar OFF, lihat polaritas berbalik.'],iv:'Waktu / keadaan sakelar',dv:'Tanda di/dt dan εL',cv:'L, R, V',P:{mode:'DC',R:100,Vdc:12,L:1,solMode:false},
run:()=>({h:['Keadaan','di/dt (A/s)','εL (V)','Arah GGL'],r:[['0⁺ setelah ON',12,-12,'menentang kenaikan'],['t = τ',f3(12*Math.exp(-1)),f3(-12*Math.exp(-1)),'menentang kenaikan'],['0⁺ setelah OFF (I₀ = 0,12 A)',-12,12,'menentang penurunan']],c:'Saat arus naik εL berlawanan dengan arah arus; saat arus turun polaritas berbalik. GGL selalu menentang perubahan, bukan menghentikannya.'})},
{t:'5. Induktor pada sumber AC',g:'Mengamati XL, amplitudo arus, dan fase terhadap frekuensi.',st:['Mode AC, R = 100 Ω, L = 0,5 H, V = 12 Vrms.','Ubah f: 5, 20, 50, 100 Hz.','Lihat grafik fase di tab Grafik.'],iv:'f',dv:'XL, Irms, φ',cv:'R, L, V',P:{mode:'AC',R:100,Vac:12,L:.5,f:20,solMode:false},
run:()=>({h:['f (Hz)','XL (Ω)','Z (Ω)','Irms (A)','φ (°)'],r:[5,20,50,100].map(fr=>{const X=2*Math.PI*fr*.5,Z=Math.hypot(100,X);return[fr,f3(X),f3(Z),f3(12/Z),f3(Math.atan2(X,100)*180/Math.PI)]}),c:'f lebih tinggi menaikkan XL, menurunkan Irms, dan memperbesar sudut fase mendekati 90°.'})},
{t:'6. Pengaruh jumlah lilitan',g:'Menunjukkan L solenoida ideal sebanding dengan N².',st:['Aktifkan "Hitung L dari solenoida", μr = 200, A = 20 cm², l = 10 cm.','Ubah N: 100, 200, 400, 800.','Bandingkan L terhadap N = 100.'],iv:'N',dv:'L',cv:'A, l, μr',P:{solMode:true,mur:200,A:20,len:10,N:100,mode:'DC'},
run:()=>{const L=N=>MU0*200*N*N*20e-4/.1;return{h:['N','L (H)','L/L(N=100)'],r:[100,200,400,800].map(N=>[N,f3(L(N)),f3(L(N)/L(100))]),c:'Menggandakan N melipatempatkan L (rasio 1, 4, 16, 64): L ∝ N².'}}}];
function initExp(){$('#exps').innerHTML=EX.map((e,n)=>`<details class="card"><summary>${e.t}</summary><p><b>Tujuan:</b> ${e.g}</p><ol>${e.st.map(s=>`<li>${s}</li>`).join('')}</ol><p><b>Variabel bebas:</b> ${e.iv}. <b>Terikat:</b> ${e.dv}. <b>Kontrol:</b> ${e.cv}.</p><label>Prediksi Anda:<textarea></textarea></label><div class="btns"><button class="btn" data-a="${n}">Terapkan ke simulasi</button><button class="btn p" data-r="${n}">Tampilkan hasil</button></div><div id="er${n}" aria-live="polite"></div></details>`).join('');
$('#exps').onclick=ev=>{const b=ev.target.closest('button');if(!b)return;
if(b.dataset.a!==undefined){Object.assign(S,DEF,EX[+b.dataset.a].P,{running:true,t:0,t0:0,i0:0,hist:[],on:false});dp=0;sync();showTab('sim');say('Parameter eksperimen diterapkan. Tekan Mulai.')}
else{const r=EX[+b.dataset.r].run();$('#er'+b.dataset.r).innerHTML=tbl(r.h,r.r)+`<p><b>Kesimpulan:</b> ${r.c}</p>`}}}

/* ---------- Kuis ---------- */
const Q=[['Satuan SI induktansi adalah…',['farad','henry','weber','tesla'],1,'Induktansi diukur dalam henry (H) = V·s/A.'],
['Tanda negatif pada εL = −L di/dt menyatakan…',['Hukum Ohm','Hukum Lenz','Hukum Coulomb','kekekalan muatan'],1,'GGL induksi menentang perubahan arus (Hukum Lenz).'],
['Rangkaian RL seri dengan L = 2 H dan R = 100 Ω memiliki τ…',['0,02 s','0,2 s','50 s','200 s'],0,'τ = L/R = 2/100 = 0,02 s.'],
['Pada t = τ, arus naik dari nol mencapai sekitar…',['37%','50%','63,2%','100%'],2,'1 − e⁻¹ ≈ 0,632 dari nilai tunak.'],
['Energi pada L = 0,5 H dengan i = 2 A adalah…',['0,5 J','1 J','2 J','4 J'],1,'W = ½Li² = ½·0,5·4 = 1 J.'],
['Reaktansi induktif L = 0,1 H pada f = 50 Hz mendekati…',['5 Ω','15,7 Ω','31,4 Ω','314 Ω'],2,'XL = 2π·50·0,1 ≈ 31,4 Ω.'],
['Pada induktor ideal dengan sumber sinusoidal tunak, arus…',['sefase tegangan','mendahului 90°','tertinggal 90°','berlawanan fase'],2,'Arus induktor tertinggal 90° terhadap tegangan.'],
['Jumlah lilitan solenoida ideal dua kali lebih banyak (lainnya tetap), induktansi menjadi…',['2 kali','4 kali','8 kali','tetap'],1,'L ∝ N².'],
['Saat arus pada kumparan sedang naik, GGL induksi diri…',['membantu kenaikan arus','menentang kenaikan arus','selalu nol','mengubah arah arus seketika'],1,'Menurut Lenz, GGL menentang kenaikan arus.'],
['Sumber DC dilepas dan ada jalur arus. Arus induktor…',['langsung nol','meluruh eksponensial','naik tak hingga','berosilasi selalu'],1,'i(t) = I₀e^(−t/τ); arus induktor tidak dapat berubah seketika.']];
let ans=[];
function initQuiz(){ans=[];$('#quiz').innerHTML=Q.map((q,n)=>`<fieldset class="card"><legend>${n+1}. ${q[0]}</legend>${q[1].map((o,j)=>`<label class="op"><input type="radio" name="q${n}" value="${j}"> ${'ABCD'[j]}. ${o}</label>`).join('')}<p class="fb" id="fb${n}" aria-live="polite"></p></fieldset>`).join('')+'<div class="btns"><button class="btn p" id="qEnd">Hitung nilai</button><button class="btn" id="qRe">Ulangi kuis</button></div><p id="qs" class="status" aria-live="polite"></p>';
$('#quiz').onchange=e=>{const n=+e.target.name.slice(1),j=+e.target.value,q=Q[n];ans[n]=j;$$(`input[name=q${n}]`).forEach(x=>x.disabled=true);
$('#fb'+n).textContent=j===q[2]?'Benar. '+q[3]:`Kurang tepat. Jawaban benar: ${'ABCD'[q[2]]}. ${q[3]}`};
$('#qEnd').onclick=()=>{const s=Q.filter((q,n)=>ans[n]===q[2]).length;$('#qs').textContent=`Nilai akhir: ${s}/${Q.length} (${s*100/Q.length}). ${ans.filter(x=>x!==undefined).length<Q.length?'Masih ada soal yang belum dijawab.':''}`};
$('#qRe').onclick=initQuiz}

/* ---------- Tab, tema, loop ---------- */
function showTab(id){$$('main>section').forEach(s=>s.classList.toggle('on',s.id===id));$$('#tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.id===id));if(id==='rumus')example()}
function initTabs(){const secs=$$('main>section');$('#tabs').innerHTML=secs.map(s=>`<button role="tab" data-id="${s.id}">${s.dataset.title}</button>`).join('');
$('#tabs').onclick=e=>{const b=e.target.closest('button');if(b)showTab(b.dataset.id)};
$('#tabs').onkeydown=e=>{const bs=$$('#tabs button'),i=bs.indexOf(document.activeElement);if(i<0)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const n=bs[(i+(e.key==='ArrowRight'?1:bs.length-1))%bs.length];n.focus();showTab(n.dataset.id)}};showTab('sim')}
let last=performance.now(),fc=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;const p=par();
if(S.running){S.t+=dt*winLen(p)/6*S.speed;sample()}
const s=st();drawSvg(dt,s);if(fc++%3===0)updRes(s);
if(S.showGraph&&fc%2===0)charts.forEach(o=>{if(o.cv.offsetParent)draw(o)});requestAnimationFrame(frame)}
$('#bTheme').onclick=()=>document.body.classList.toggle('dark');
if(matchMedia('(prefers-color-scheme: dark)').matches)document.body.classList.add('dark');
buildSvg();initCtl();mkCharts('#miniCharts',['i','v']);mkCharts('#bigCharts',['i','v','w','ph']);initExp();initQuiz();initTabs();sync();requestAnimationFrame(frame);
