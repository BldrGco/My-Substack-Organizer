let subscriptions = [];
let posts = [];

function loadData() {
  fetch('data.json').then(response => response.json()).then(data => {
    subscriptions = localStorage.getItem('subscriptions') ? JSON.parse(localStorage.getItem('subscriptions')) : data;
    renderAll();
  }).catch(() => {
    subscriptions = localStorage.getItem('subscriptions') ? JSON.parse(localStorage.getItem('subscriptions')) : [];
    renderAll();
  });
}

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    complete: (result) => {
      const data = result.data;
      if (data[0].name && data[0].url) { // Subscriptions CSV
        subscriptions = data.map(row => ({
          name: row.name || '',
          url: row.url || '',
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
          status: row.status || 'active',
          notes: row.notes || ''
        }));
      } else if (data[0].title && data[0].url) { // Posts CSV
        posts = data.map(row => ({
          title: row.title || '',
          url: row.url || '',
          date: row.date || '',
          category: categorizePost(row.title, row.tags) // Auto-categorize
        }));
      }
      renderAll();
    }
  });
}

function categorizePost(title, tags = '') {
  const keywords = { tech: ['AI', 'tech', 'code'], culture: ['art', 'culture', 'history'], science: ['science', 'research'] };
  tags = tags.split(',').map(t => t.trim().toLowerCase());
  for (let [cat, words] of Object.entries(keywords)) {
    if (tags.some(t => words.includes(t)) || words.some(w => title.toLowerCase().includes(w))) return cat;
  }
  return 'other';
}

function renderAll(filter = 'all', search = '') {
  renderSubscriptions(filter, search);
  renderPosts(search);
  renderCharts();
  saveToLocalStorage();
}

function renderSubscriptions(filter, search) {
  const subsDiv = document.getElementById('subscriptions');
  subsDiv.innerHTML = `<h2>Subscriptions</h2><table>
    <tr><th>Name</th><th>Tags</th><th>Status</th><th>Notes</th></tr>` +
    subscriptions.filter(sub => (filter === 'all' || sub.status === filter))
      .filter(sub => sub.name.toLowerCase().includes(search.toLowerCase()) || sub.notes.toLowerCase().includes(search.toLowerCase()))
      .map(sub => `
        <tr class="${sub.status}">
          <td><a href="${sub.url}" target="_blank">${sub.name}</a></td>
          <td>${sub.tags.join(', ')} <button onclick="editTags('${sub.name}')">Edit</button></td>
          <td>${sub.status} <button onclick="cycleStatus('${sub.name}')">Cycle</button></td>
          <td><textarea onchange="updateNotes('${sub.name}', this.value)">${sub.notes}</textarea></td>
        </tr>`).join('') + '</table>';
}

function renderPosts(search) {
  const postsDiv = document.getElementById('posts');
  postsDiv.innerHTML = `<h2>Posts</h2><table>
    <tr><th>Title</th><th>Date</th><th>Category</th></tr>` +
    posts.filter(post => post.title.toLowerCase().includes(search.toLowerCase()) || post.category.toLowerCase().includes(search.toLowerCase()))
      .map(post => `
        <tr>
          <td><a href="${post.url}" target="_blank">${post.title}</a></td>
          <td>${post.date}</td>
          <td>${post.category}</td>
        </tr>`).join('') + '</table>';
}

function renderCharts() {
  const statusCtx = document.getElementById('statusChart').getContext('2d');
  const categoryCtx = document.getElementById('categoryChart').getContext('2d');

  new Chart(statusCtx, {
    type: 'bar',
    data: {
      labels: ['Active', 'Paused', 'Dropped'],
      datasets: [{
        label: 'Subscriptions by Status',
        data: [
          subscriptions.filter(s => s.status === 'active').length,
          subscriptions.filter(s => s.status === 'paused').length,
          subscriptions.filter(s => s.status === 'dropped').length
        ],
        backgroundColor: ['#28a745', '#6c757d', '#dc3545']
      }]
    }
  });

  const categories = {};
  posts.forEach(p => categories[p.category] = (categories[p.category] || 0) + 1);
  new Chart(categoryCtx, {
    type: 'pie',
    data: {
      labels: Object.keys(categories),
      datasets: [{
        label: 'Post Categories',
        data: Object.values(categories),
        backgroundColor: ['#007bff', '#28a745', '#ffc107', '#6c757d']
      }]
    }
  });
}

function saveToLocalStorage() {
  localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
  localStorage.setItem('posts', JSON.stringify(posts));
}

function cycleStatus(name) {
  const sub = subscriptions.find(s => s.name === name);
  sub.status = sub.status === 'active' ? 'paused' : sub.status === 'paused' ? 'dropped' : 'active';
  renderAll(document.getElementById('filter').value, document.getElementById('search').value);
}

function updateNotes(name, value) {
  const sub = subscriptions.find(s => s.name === name);
  sub.notes = value;
  saveToLocalStorage();
}

function editTags(name) {
  const sub = subscriptions.find(s => s.name === name);
  const newTags = prompt('Edit tags (comma-separated):', sub.tags.join(', '));
  if (newTags) {
    sub.tags = newTags.split(',').map(tag => tag.trim());
    renderAll(document.getElementById('filter').value, document.getElementById('search').value);
  }
}

document.getElementById('filter').addEventListener('change', (e) => renderAll(e.target.value, document.getElementById('search').value));
document.getElementById('search').addEventListener('input', (e) => renderAll(document.getElementById('filter').value, e.target.value));

document.getElementById('add-sub').addEventListener('click', () => {
  const name = prompt('Substack name:');
  const url = prompt('URL:');
  if (name && url) {
    subscriptions.push({ name, url, tags: [], status: 'active', notes: '' });
    renderAll();
  }
});

document.getElementById('export').addEventListener('click', () => {
  const csv = [
    ['Type', 'Name/Title', 'URL', 'Tags/Category', 'Status/Date', 'Notes'],
    ...subscriptions.map(s => ['Subscription', s.name, s.url, s.tags.join(', '), s.status, s.notes]),
    ...posts.map(p => ['Post', p.title, p.url, p.category, p.date, ''])
  ].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'substack_data.csv';
  a.click();
  URL.revokeObjectURL(url);
});

loadData();
