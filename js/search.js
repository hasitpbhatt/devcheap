// Small client-side search and renderer
async function loadJSON(path){try{const r=await fetch(path);if(!r.ok)throw new Error('fetch');return await r.json()}catch(e){return null}}

function renderList(items, container){const el=document.getElementById(container);if(!el)return;el.innerHTML='';
  if(items.length===0){el.innerHTML='<p class="muted">No results</p>';return}
  items.forEach(i=>{
    const d=document.createElement('div');d.className=(container==='results'?'item':'prompt');
    if(i.url){d.innerHTML=`<a href="${i.url}"><strong>${i.title}</strong></a><p>${i.desc||''}</p>`}
    else{d.innerHTML=`<strong>${i.title}</strong><p>${i.desc||''}</p>`}
    el.appendChild(d);
  })
}

async function boot(){const resources=await loadJSON('/resources/index.json')||[];
  const prompts=await loadJSON('/prompts/index.json')||[];
  renderList(resources,'results');renderList(prompts,'prompt-list');

  const input=document.getElementById('search');const clear=document.getElementById('clear');
  input.addEventListener('input',()=>{
    const q=input.value.trim().toLowerCase();
    if(!q){renderList(resources,'results');return}
    const filtered=resources.filter(r=>((r.title+r.desc+(r.tags||'')).toLowerCase().includes(q)));
    renderList(filtered,'results');
  })
  clear.addEventListener('click',()=>{input.value='';renderList(resources,'results')})
}

window.addEventListener('DOMContentLoaded',boot);
