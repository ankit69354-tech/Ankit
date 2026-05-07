// =============================================
// CONFIGURATION
// Update API_BASE_URL after deploying your backend
// =============================================
const API_BASE_URL = 'https://YOUR-BACKEND-URL/api/students';
// Example (Railway): 'https://studentapp-backend.up.railway.app/api/students'

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  checkApiHealth();
  loadAllStudents();
});

// =============================================
// HEALTH CHECK
// =============================================
async function checkApiHealth() {
  const banner = document.getElementById('api-status');
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (res.ok) {
      banner.className = 'status-banner connected';
      banner.textContent = '✅ Connected to Spring Boot API & Supabase Database';
    } else {
      throw new Error('Non-OK response');
    }
  } catch (e) {
    banner.className = 'status-banner error';
    banner.textContent = '❌ Cannot reach the API. Make sure the backend is running. Check API_BASE_URL in app.js';
  }
}

// =============================================
// LOAD ALL STUDENTS
// =============================================
async function loadAllStudents() {
  const tbody = document.getElementById('student-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Loading...</td></tr>';

  try {
    const res = await fetch(API_BASE_URL);
    if (!res.ok) throw new Error('Failed to fetch');
    const students = await res.json();
    renderTable(students);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-msg">⚠️ Could not load students. Is the API running?</td></tr>`;
  }
}

// =============================================
// RENDER TABLE
// =============================================
function renderTable(students) {
  const tbody = document.getElementById('student-tbody');
  const countEl = document.getElementById('student-count');
  countEl.textContent = students.length;

  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">No students found. Add one above! 👆</td></tr>';
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr>
      <td><strong>#${s.id}</strong></td>
      <td>${escHtml(s.name)}</td>
      <td>${escHtml(s.email)}</td>
      <td><span style="background:#e0e7ff;color:#3730a3;padding:2px 10px;border-radius:999px;font-size:0.8rem;font-weight:600">${escHtml(s.course)}</span></td>
      <td>${s.age ?? '—'}</td>
      <td>${formatDate(s.createdAt)}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-edit" onclick="editStudent(${s.id})">✏️ Edit</button>
          <button class="btn btn-delete" onclick="deleteStudent(${s.id}, '${escHtml(s.name)}')">🗑️ Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// =============================================
// SUBMIT STUDENT (Create or Update)
// =============================================
async function submitStudent() {
  const id = document.getElementById('student-id').value;
  const payload = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    course: document.getElementById('course').value.trim(),
    age: document.getElementById('age').value ? parseInt(document.getElementById('age').value) : null
  };

  // Basic validation
  if (!payload.name || !payload.email || !payload.course) {
    showFormMessage('Please fill in Name, Email, and Course.', 'error');
    return;
  }

  const isEdit = !!id;
  const url = isEdit ? `${API_BASE_URL}/${id}` : API_BASE_URL;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      showFormMessage(isEdit ? '✅ Student updated!' : '✅ Student added!', 'success');
      resetForm();
      loadAllStudents();
    } else {
      showFormMessage(`❌ ${data.error || 'Something went wrong'}`, 'error');
    }
  } catch (e) {
    showFormMessage('❌ Network error. Is the backend running?', 'error');
  }
}

// =============================================
// EDIT — populate form
// =============================================
async function editStudent(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);
    if (!res.ok) throw new Error('Not found');
    const s = await res.json();

    document.getElementById('student-id').value = s.id;
    document.getElementById('name').value = s.name;
    document.getElementById('email').value = s.email;
    document.getElementById('course').value = s.course;
    document.getElementById('age').value = s.age ?? '';
    document.getElementById('form-title').textContent = `✏️ Editing Student #${s.id}`;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    alert('Could not load student for editing.');
  }
}

// =============================================
// DELETE
// =============================================
async function deleteStudent(id, name) {
  if (!confirm(`Delete student "${name}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadAllStudents();
    } else {
      const data = await res.json();
      alert(`Error: ${data.error}`);
    }
  } catch (e) {
    alert('Network error. Could not delete.');
  }
}

// =============================================
// SEARCH
// =============================================
async function searchStudents() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) { loadAllStudents(); return; }

  try {
    const res = await fetch(`${API_BASE_URL}/search?name=${encodeURIComponent(query)}`);
    const students = await res.json();
    renderTable(students);
  } catch (e) {
    console.error('Search failed', e);
  }
}

// =============================================
// HELPERS
// =============================================
function resetForm() {
  document.getElementById('student-id').value = '';
  document.getElementById('name').value = '';
  document.getElementById('email').value = '';
  document.getElementById('course').value = '';
  document.getElementById('age').value = '';
  document.getElementById('form-title').textContent = '➕ Add New Student';
  document.getElementById('form-message').className = 'form-message';
  document.getElementById('form-message').textContent = '';
}

function showFormMessage(msg, type) {
  const el = document.getElementById('form-message');
  el.textContent = msg;
  el.className = `form-message ${type}`;
  setTimeout(() => { el.className = 'form-message'; el.textContent = ''; }, 4000);
}

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
