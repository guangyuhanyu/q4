/* Guangyu Hanyu · Quyển 4 · mã học viên & giải mã bài học */
(function(){
const LS_SESS="gyq4_sess", LS_DEV="gyhy_dev", REFRESH_MS=2*24*3600*1000;
const ls={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
function devId(){let d=ls.get(LS_DEV);if(!d){d=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)).replace(/-/g,"").slice(0,16);ls.set(LS_DEV,d)}return d}
function devLabel(){const u=navigator.userAgent;const os=/iPhone/.test(u)?"iPhone":/iPad/.test(u)?"iPad":/Android/.test(u)?"Android":/Mac/.test(u)?"Mac":/Windows/.test(u)?"Windows":"Khác";
  const br=/Edg\//.test(u)?"Edge":/CriOS|Chrome\//.test(u)?"Chrome":/FxiOS|Firefox/.test(u)?"Firefox":/Safari/.test(u)?"Safari":"";return os+(br?" · "+br:"")}
const ERR={missing:"Bạn chưa nhập mã.",notfound:"Mã không đúng. Kiểm tra lại hoặc liên hệ Thầy Vy.",expired:"Mã đã hết hạn. Liên hệ Thầy Vy để gia hạn.",devices:"Mã này đã dùng trên quá nhiều thiết bị. Liên hệ Thầy Vy.",
  locked:"Mã đang tạm khóa. Liên hệ Thầy Vy.",nodate:"Mã chưa được kích hoạt. Liên hệ Thầy Vy.",noserver:"Trang chưa được cấu hình máy chủ (gy-config.js).",network:"Không kết nối được. Kiểm tra mạng rồi thử lại."};
async function call(code){
  if(!window.GY_SCRIPT_URL) return {ok:false,error:"noserver"};
  const u=window.GY_SCRIPT_URL+"?code="+encodeURIComponent(code)+"&dev="+encodeURIComponent(devId())+"&label="+encodeURIComponent(devLabel())+"&t="+Date.now();
  try{const r=await fetch(u,{redirect:"follow",cache:"no-store"});return await r.json()}catch(e){return {ok:false,error:"network"}}
}
const GY={
  ERR, devId,
  session(){const s=ls.get(LS_SESS);if(!s)return null;if(new Date(s.exp)<new Date()){return null}return s},
  rawSession(){return ls.get(LS_SESS)},
  async login(code){code=String(code||"").replace(/\s+/g,"").toUpperCase();if(!code)return {ok:false,error:"missing"};
    const r=await call(code);if(r.ok){ls.set(LS_SESS,{code,name:r.name,exp:r.expires,lessons:r.lessons,keys:r.keys,ts:Date.now()})}return r},
  async refresh(force){const s=ls.get(LS_SESS);if(!s)return null;
    /* Trang chủ: luôn hỏi máy chủ. Trang bài: chỉ hỏi khi chưa có khóa bài này, để mở bài nhanh. */
    const onLesson=typeof UNIT!=="undefined", needUnit=onLesson&&!(s.keys&&s.keys[UNIT]);
    if(!force&&onLesson&&!needUnit&&Date.now()-s.ts<REFRESH_MS&&new Date(s.exp)>new Date())return s;
    const r=await call(s.code);if(r.ok){const n={code:s.code,name:r.name,exp:r.expires,lessons:r.lessons,keys:r.keys,ts:Date.now()};ls.set(LS_SESS,n);return n}
    if(r.error&&r.error!=="network"&&r.error!=="noserver"){ls.del(LS_SESS);return null}return GY.session()},
  logout(){ls.del(LS_SESS)},
  key(unit){const s=GY.session();return s&&s.keys?s.keys[unit]||null:null},
  async decrypt(unit,b64){const k=GY.key(unit);if(!k)throw new Error("nokey");
    const raw=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const kb=new Uint8Array(k.match(/../g).map(h=>parseInt(h,16)));
    const key=await crypto.subtle.importKey("raw",kb,"AES-GCM",false,["decrypt"]);
    const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:raw.slice(0,12)},key,raw.slice(12));
    if(typeof DecompressionStream==="undefined")throw new Error("old");
    return await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream("gzip"))).text()},
  fmtDate(d){const x=new Date(d);return x.toLocaleDateString("vi-VN")}
};
window.GY=GY;
})();
