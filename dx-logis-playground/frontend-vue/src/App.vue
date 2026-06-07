<template>
  <div class="app">
    <header>
      <div class="header-top">
        <h1>⚡ Vue + FastAPI + Supabase</h1>
        <div class="status" :class="dbStatus">DB: {{ dbMessage }}</div>
      </div>
      <nav class="manual-nav">
        <span class="nav-label">📖 매뉴얼</span>
        <a href="/render-setup-manual.html" target="_blank" class="nav-link">
          🚀 Render 환경 구성 가이드
        </a>
        <a href="/fullstack-test-manual.html" target="_blank" class="nav-link">
          🔗 Full Stack 연결 테스트 가이드
        </a>
      </nav>
    </header>

    <section class="add-form">
      <input v-model="newName"    placeholder="이름"  />
      <input v-model="newContent" placeholder="내용"  />
      <button @click="addItem" :disabled="!newName">추가</button>
    </section>

    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <ul v-else class="list">
      <li v-for="item in items" :key="item.id">
        <span class="id">#{{ item.id }}</span>
        <span class="name">{{ item.name }}</span>
        <span class="content">{{ item.content }}</span>
        <button @click="deleteItem(item.id)">삭제</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const items      = ref([])
const loading    = ref(true)
const error      = ref(null)
const dbMessage  = ref('확인 중...')
const dbStatus   = ref('checking')
const newName    = ref('')
const newContent = ref('')

async function checkDB() {
  try {
    const res  = await fetch(`${API}/db-check`)
    const data = await res.json()
    dbMessage.value = `연결됨 (총 ${data.items_count}건)`
    dbStatus.value  = 'ok'
  } catch {
    dbMessage.value = '연결 실패'
    dbStatus.value  = 'fail'
  }
}

async function fetchItems() {
  try {
    loading.value = true
    const res  = await fetch(`${API}/items`)
    const data = await res.json()
    items.value = Array.isArray(data) ? data : []
    if (!Array.isArray(data)) error.value = `API 응답 오류: ${JSON.stringify(data)}`
  } catch (e) {
    error.value = `API 오류: ${e.message}`
  } finally {
    loading.value = false
  }
}

async function addItem() {
  await fetch(`${API}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName.value, content: newContent.value })
  })
  newName.value = newContent.value = ''
  await fetchItems()
}

async function deleteItem(id) {
  await fetch(`${API}/items/${id}`, { method: 'DELETE' })
  await fetchItems()
}

onMounted(() => { checkDB(); fetchItems() })
</script>

<style scoped>
* { box-sizing: border-box; }
.app { max-width: 700px; margin: 40px auto; padding: 0 20px; font-family: sans-serif; }

/* header */
header { margin-bottom: 24px; }
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
h1 { font-size: 18px; }

/* DB status badge */
.status { font-size: 12px; padding: 4px 12px; border-radius: 20px; }
.status.ok       { background: #d1fae5; color: #065f46; }
.status.fail     { background: #fee2e2; color: #991b1b; }
.status.checking { background: #fef3c7; color: #92400e; }

/* manual nav */
.manual-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  flex-wrap: wrap;
}
.nav-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-right: 4px;
}
.nav-link {
  font-size: 12px;
  color: #3b82f6;
  text-decoration: none;
  padding: 4px 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  transition: all 0.15s;
}
.nav-link:hover { background: #dbeafe; color: #1d4ed8; }

/* form */
.add-form { display: flex; gap: 8px; margin-bottom: 20px; }
.add-form input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}
.add-form button {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.add-form button:disabled { opacity: 0.4; cursor: not-allowed; }

/* list */
.loading { color: #6b7280; padding: 20px; text-align: center; }
.error   { color: #dc2626; padding: 12px; background: #fee2e2; border-radius: 6px; }
.list    { list-style: none; padding: 0; }
.list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}
.id      { font-family: monospace; font-size: 11px; color: #9ca3af; width: 28px; }
.name    { font-weight: 600; font-size: 13px; width: 140px; }
.content { flex: 1; font-size: 13px; color: #6b7280; }
.list li button {
  padding: 4px 10px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}
</style>