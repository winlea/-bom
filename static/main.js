let toastContainer;
function showToast(message, type='primary'){
  const id = 't' + Math.random().toString(36).slice(2,8);
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
  el.role = 'alert';
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
  toastContainer.appendChild(el);
  setTimeout(()=> el.remove(), 3000);
}

async function api(path, opts = {}) {
  const loading = document.getElementById('loading');
  loading?.classList.remove('d-none');
  try{
    const res = await fetch(path, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) {
      throw new Error(typeof data === 'string' ? data : (data.error || 'Error'));
    }
    return data;
  } finally {
    loading?.classList.add('d-none');
  }
}

async function refreshList() {
  const q = document.getElementById('q').value.trim();
  const params = q ? ('?q=' + encodeURIComponent(q)) : '';
  const data = await api('/items' + params);
  const list = document.getElementById('list');
  list.innerHTML = '';
  if (!data.items || data.items.length === 0){
    list.innerHTML = '<div class="text-center text-muted py-4">暂无数据</div>';
    return;
  }
  for (const item of data.items) {
    const col = document.createElement('div');
    col.className = 'col';
    const card = document.createElement('div');
    card.className = 'card h-100';
    const img = document.createElement('img');
    img.src = '/download/' + item.id;
    img.alt = item.part_number;
    img.className = 'thumb-img card-img-top';
    const body = document.createElement('div');
    body.className = 'card-body';
    const title = document.createElement('h6');
    title.className = 'card-title mb-1';
    title.textContent = item.part_number + (item.part_name ? (' | ' + item.part_name) : '');
    const ts = document.createElement('div');
    ts.className = 'text-muted small';
    ts.textContent = item.created_at || '';
    body.appendChild(title);
    body.appendChild(ts);
    card.appendChild(img);
    card.appendChild(body);
    col.appendChild(card);
    list.appendChild(col);
  }
}

async function uploadFile() {
  const pn = document.getElementById('pn_file').value.trim();
  const file = document.getElementById('file_input').files[0];
  if (!pn || !file) { showToast('请填写 Part Number 并选择图片','warning'); return; }
  const b64 = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
  await api('/upload/base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part_number: pn, image_data: b64 })
  });
  showToast('上传成功','success');
  await refreshList();
}

async function loadProjects() {
  const data = await api('/api/projects');
  const sel = document.getElementById('project_select');
  sel.innerHTML = '';
  for(const p of data.items){
    const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; sel.appendChild(opt);
  }
}

async function uploadUrl() {
  const pn = document.getElementById('pn_url').value.trim();
  const url = document.getElementById('img_url').value.trim();
  if (!pn || !url) { showToast('请填写 Part Number 与图片 URL','warning'); return; }
  await api('/upload/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part_number: pn, url })
  });
  showToast('上传成功','success');
  await refreshList();
}

async function importBOM(){
  const file = document.getElementById('bom_file').files[0];
  const sel = document.getElementById('project_select');
  const pid = sel && sel.value ? parseInt(sel.value,10) : null;
  if(!file){ showToast('请选择 CSV/XLSX 文件','warning'); return; }
  if(!pid){ showToast('请选择目标项目','warning'); return; }
  const fd = new FormData();
  fd.append('file', file);
  fd.append('project_id', String(pid));
  const res = await fetch('/import/bom', { method: 'POST', body: fd });
  const text = await res.text();
  let data; try{ data = JSON.parse(text);}catch{ data = text; }
  if(!res.ok){ throw new Error((data && data.error) || '导入失败'); }
  showToast(`导入成功：${data.created} 条，错误 ${data.errors?.length||0} 条`, 'success');
  if(data.errors && data.errors.length){ console.warn('Import errors:', data.errors); }
  await refreshList();
}

window.addEventListener('DOMContentLoaded', () => {
  toastContainer = document.getElementById('toastContainer');
  document.getElementById('btn_upload_file').addEventListener('click', () => uploadFile().catch(e => showToast(e.message,'danger')));
  document.getElementById('btn_upload_url').addEventListener('click', () => uploadUrl().catch(e => showToast(e.message,'danger')));
  document.getElementById('btn_refresh').addEventListener('click', () => refreshList().catch(e => showToast(e.message,'danger')));
  document.getElementById('btn_search').addEventListener('click', () => refreshList().catch(e => showToast(e.message,'danger')));
  const btnImport = document.getElementById('btn_import_bom');
  if(btnImport){ btnImport.addEventListener('click', () => importBOM().catch(e => showToast(e.message,'danger'))); }
  loadProjects().catch(()=>{});

  // dashboard cards & recent lists
  (async ()=>{
    try{
      const s = await api('/api/dashboard/summary');
      const set = (id, v)=>{ const el = document.getElementById(id); el && (el.textContent = v ?? '-'); };
      set('dc_projects', s.project_count);
      set('dc_parts', s.parts_count);
      set('dc_withimg', s.parts_with_image + ' / ' + (s.parts_without_image ?? 0));
      set('dc_lastimp', s.last_import_time || '—');
      const r = await api('/api/dashboard/recent');
      const rp = document.getElementById('recent_projects');
      if(rp){ rp.innerHTML=''; for(const p of r.recent_projects){ const li=document.createElement('li'); li.className='list-group-item d-flex justify-content-between align-items-center'; const a=document.createElement('a'); a.href='/parts?project_id='+p.id; a.textContent=p.name; const small=document.createElement('small'); small.className='text-muted'; small.textContent=p.status?('['+p.status+']') : ''; li.appendChild(a); li.appendChild(small); rp.appendChild(li);} }
      const ri = document.getElementById('recent_imports');
      if(ri){ ri.innerHTML=''; for(const it of r.recent_imports){ const li=document.createElement('li'); li.className='list-group-item'; const a=document.createElement('a'); a.href='/parts?project_id='+it.project_id; a.textContent=(it.project_name||'项目') + ' — ' + (it.filename||'导入'); const sm=document.createElement('div'); sm.className='text-muted small'; sm.textContent=`成功 ${it.created_count||0}，错误 ${it.errors_count||0}，时间 ${it.created_at}`; li.appendChild(a); li.appendChild(sm); ri.appendChild(li);} }
    }catch(e){ /* ignore on home without APIs */ }
  })();

  // home quick project selector
  const homeSel = document.getElementById('home_project_select');
  if(homeSel){
    api('/api/projects').then(d=>{
      homeSel.innerHTML='';
      for(const p of d.items){ const o=document.createElement('option'); o.value=p.id; o.textContent=p.name; homeSel.appendChild(o);}
    }).catch(()=>{});
    const goBtn = document.getElementById('btn_go_parts_by_project');
    goBtn && goBtn.addEventListener('click', (e)=>{
      e.preventDefault(); const v = homeSel.value; if(v){ window.location.href = '/parts?project_id=' + v; }
    });
  }
  refreshList().catch(e => console.error(e));
});

