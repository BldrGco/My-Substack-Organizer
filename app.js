// CSV Import Functionality
document.getElementById('csvFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  
  // Parse CSV using PapaParse
  Papa.parse(file, {
    header: true,
    complete: function(results) {
      localStorage.setItem('substackData', JSON.stringify(results.data));
      renderItems(results.data);
    }
  });
});

// Render Items in Grid/List View
function renderItems(data) {
  const categories = [...new Set(data.map(item => item.category))];
  
  // Populate category filter dropdown
  const filter = document.getElementById('categoryFilter');
  filter.innerHTML = '<option value="all">All Categories</option>' + 
                     categories.map(cat => `<option>${cat}</option>`).join('');
  
  filter.addEventListener('change', () => {
    const filtered = data.filter(item => 
      filter.value === 'all' || item.category === filter.value
    );
    updateDisplay(filtered);
  });

  updateDisplay(data);
}

// Update Display Based on Filter/View
function updateDisplay(items) {
  const container = document.getElementById('data-container');
  
  container.innerHTML = items.map(item => `
    <div class="item" data-category="${item.category}">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <a href="${item.url}" target="_blank">Read more</a>
    </div>
  `).join('');
}

// View Toggle Functionality
document.getElementById('viewToggle').addEventListener('click', function() {
  const container = document.getElementById('data-container');
  
  container.classList.toggle('grid-view');
  container.classList.toggle('list-view');
  
  this.textContent = container.classList.contains('grid-view') ? 
                     'Switch to List View' : 'Switch to Grid View';
});

// Load Saved Data on Page Load
window.addEventListener('DOMContentLoaded', () => {
  const savedData = localStorage.getItem('substackData');
  
  if (savedData) renderItems(JSON.parse(savedData));
});
