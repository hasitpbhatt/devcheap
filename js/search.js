// DevCheap Premium SPA Search & Router Engine

let resourcesData = [];
let promptsData = [];
let currentCategory = 'all';
let searchTimeout = null;

// Helpers to load JSON files relatively
async function loadJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to fetch ${path}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Markdown Renderer configuration
function setupMarked() {
  if (typeof marked === 'undefined') return;

  const renderer = new marked.Renderer();
  
  // Custom link renderer to make absolute file links relative hash routes
  renderer.link = function(href, title, text) {
    let cleanHref = href;
    if (href.startsWith('/')) {
      cleanHref = `#${href}`;
    }
    return `<a href="${cleanHref}">${text}</a>`;
  };

  // Custom code renderer to wrap with copy header
  renderer.code = function(code, language) {
    const validLang = language || 'text';
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span>${validLang.toUpperCase()}</span>
          <button class="copy-btn" onclick="copyText(this)">
            <i class="far fa-copy"></i> Copy
          </button>
        </div>
        <pre><code class="language-${validLang}">${escapedCode}</code></pre>
      </div>
    `;
  };

  marked.setOptions({
    renderer: renderer,
    gfm: true,
    breaks: true
  });
}

// Copy to clipboard helper
window.copyText = function(button) {
  const container = button.closest('.code-block-wrapper, .prompt-box');
  let text = '';
  
  if (container.classList.contains('code-block-wrapper')) {
    text = container.querySelector('code').textContent;
  } else if (container.classList.contains('prompt-box')) {
    text = container.querySelector('.prompt-content').textContent;
  }

  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.style.color = 'var(--success)';
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.color = '';
    }, 2000);
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
};

// Render the sidebar items based on filter & search
function renderSidebar() {
  const listEl = document.getElementById('sidebar-list');
  if (!listEl) return;

  listEl.innerHTML = '';
  const query = document.getElementById('search-input').value.trim().toLowerCase();

  // Combine data
  let items = [];
  if (currentCategory === 'all' || currentCategory === 'resources') {
    items = items.concat(resourcesData.map(r => ({ ...r, type: 'resource' })));
  }
  if (currentCategory === 'all' || currentCategory === 'prompts') {
    items = items.concat(promptsData.map(p => ({ ...p, type: 'prompt' })));
  }

  // Filter based on search query
  if (query) {
    items = items.filter(item => {
      const matchTitle = item.title && item.title.toLowerCase().includes(query);
      const matchDesc = item.desc && item.desc.toLowerCase().includes(query);
      const matchTags = item.tags && item.tags.toLowerCase().includes(query);
      return matchTitle || matchDesc || matchTags;
    });
  }

  if (items.length === 0) {
    listEl.innerHTML = '<div style="padding:16px; color:var(--text-muted); font-size:14px; text-align:center;">No results found</div>';
    return;
  }

  // Group items by type
  const resources = items.filter(i => i.type === 'resource');
  const prompts = items.filter(i => i.type === 'prompt');

  const currentHash = window.location.hash;

  if (resources.length > 0) {
    const header = document.createElement('div');
    header.className = 'section-title';
    header.textContent = 'Resources';
    listEl.appendChild(header);

    resources.forEach(item => {
      const itemEl = createSidebarItem(item, currentHash);
      listEl.appendChild(itemEl);
    });
  }

  if (prompts.length > 0) {
    const header = document.createElement('div');
    header.className = 'section-title';
    header.textContent = 'Quick Prompts';
    listEl.appendChild(header);

    prompts.forEach(item => {
      const itemEl = createSidebarItem(item, currentHash);
      listEl.appendChild(itemEl);
    });
  }
}

function createSidebarItem(item, currentHash) {
  const a = document.createElement('a');
  // Hash formatting: resources are routed by their URL path, prompts by their ID
  const route = item.type === 'resource' ? `#${item.url}` : `#/prompts/${item.id}`;
  a.href = route;
  a.className = `list-item ${currentHash === route ? 'active' : ''}`;
  
  // Close mobile sidebar on navigate
  a.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-backdrop').classList.remove('open');
  });

  const title = document.createElement('div');
  title.className = 'list-item-title';
  title.textContent = item.title;
  a.appendChild(title);

  if (item.desc) {
    const desc = document.createElement('div');
    desc.className = 'list-item-desc';
    desc.textContent = item.desc;
    a.appendChild(desc);
  }

  if (item.tags) {
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'tag-container';
    item.tags.split(',').forEach(tag => {
      const tagBadge = document.createElement('span');
      tagBadge.className = 'tag-badge';
      tagBadge.textContent = tag.trim();
      tagsContainer.appendChild(tagBadge);
    });
    a.appendChild(tagsContainer);
  }

  return a;
}

// Router & Detail view handler
async function handleRoute() {
  const contentPane = document.getElementById('content-pane');
  if (!contentPane) return;

  const hash = window.location.hash;
  
  // Update sidebar active states
  document.querySelectorAll('.list-item').forEach(el => {
    if (el.getAttribute('href') === hash) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  if (!hash || hash === '#/') {
    renderWelcomeScreen();
    return;
  }

  contentPane.innerHTML = '<div class="welcome-screen"><div class="welcome-icon"><i class="fas fa-spinner fa-spin"></i></div><h2>Loading...</h2></div>';

  if (hash.startsWith('#/resources/') || hash.endsWith('.md')) {
    // It's a markdown resource
    // Strip leading hash and slash to make it relative
    const path = hash.replace(/^#\/?/, '');
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error('Markdown file not found');
      const text = await response.text();
      
      contentPane.innerHTML = `
        <div class="markdown-body">
          ${marked.parse(text)}
        </div>
      `;
      // Trigger Prism syntax highlighting
      if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
      }
    } catch (err) {
      contentPane.innerHTML = `
        <div class="welcome-screen">
          <div class="welcome-icon" style="color:var(--text-muted);"><i class="fas fa-exclamation-triangle"></i></div>
          <h2>Resource Not Found</h2>
          <p>Failed to load the resource from path: <code>${path}</code>.</p>
        </div>
      `;
    }
  } else if (hash.startsWith('#/prompts/')) {
    // It's a structured quick prompt
    const promptId = hash.replace('#/prompts/', '');
    const prompt = promptsData.find(p => p.id === promptId);
    
    if (prompt) {
      contentPane.innerHTML = `
        <div class="markdown-body">
          <h1>${prompt.title}</h1>
          <p class="lede">${prompt.desc || ''}</p>
          
          <h2>Prompt System Instructions</h2>
          <div class="prompt-box">
            <button class="copy-btn" style="position: absolute; right: 16px; top: 16px;" onclick="copyText(this)">
              <i class="far fa-copy"></i> Copy Prompt
            </button>
            <pre class="prompt-content" style="white-space: pre-wrap; font-family: var(--font-mono); font-size:14px; color: var(--text); padding-right: 100px;">${prompt.prompt}</pre>
          </div>
          
          <h2>How to use</h2>
          <ul>
            <li>Click <strong>Copy Prompt</strong> in the block above.</li>
            <li>Paste it as a system prompt or instruction when interacting with your LLM (Claude, ChatGPT, Gemini).</li>
            <li>Provide your codebase or code snippets directly below it to get PR-ready fixes or clean refactors.</li>
          </ul>
        </div>
      `;
    } else {
      contentPane.innerHTML = `
        <div class="welcome-screen">
          <div class="welcome-icon" style="color:var(--text-muted);"><i class="fas fa-exclamation-triangle"></i></div>
          <h2>Prompt Not Found</h2>
          <p>The prompt with ID <code>${promptId}</code> could not be found.</p>
        </div>
      `;
    }
  }
}

function renderWelcomeScreen() {
  const contentPane = document.getElementById('content-pane');
  if (!contentPane) return;

  contentPane.innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-icon"><i class="fas fa-code"></i></div>
      <h2>Welcome to DevCheap</h2>
      <p>Select a developer resource or prompt template from the sidebar to view details, copy quickstarts, and accelerate your workflow.</p>
      <div style="margin-top: 24px; display: flex; gap: 12px;">
        <a href="#/resources/01-llm-tools.md" class="category-tab active" style="text-decoration:none; padding: 10px 16px;">
          <i class="fas fa-rocket"></i> Get Started
        </a>
      </div>
    </div>
  `;
}

// Theme management
function setupTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  // Retrieve saved theme or default to dark
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#theme-toggle i');
  if (!icon) return;
  if (theme === 'light') {
    icon.className = 'fas fa-moon';
  } else {
    icon.className = 'fas fa-sun';
  }
}

// Setup responsive drawer toggle
function setupMobileMenu() {
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (!menuBtn || !sidebar || !backdrop) return;

  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('open');
  });

  backdrop.addEventListener('click', () => {
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
  });
}

// Bootstrapping
async function boot() {
  // Fetch indices relatively (without leading slash)
  resourcesData = await loadJSON('resources/index.json');
  promptsData = await loadJSON('prompts/index.json');

  setupMarked();
  setupTheme();
  setupMobileMenu();

  // Search setup
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');

  if (searchInput && clearBtn) {
    searchInput.addEventListener('input', () => {
      clearBtn.style.display = searchInput.value ? 'block' : 'none';
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(renderSidebar, 150);
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      renderSidebar();
    });
  }

  // Category selection setup
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentCategory = e.currentTarget.dataset.category;
      renderSidebar();
    });
  });

  renderSidebar();
  handleRoute();

  window.addEventListener('hashchange', handleRoute);
}

window.addEventListener('DOMContentLoaded', boot);
