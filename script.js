// Tema değiştirme işlevi
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  themeToggle.querySelector('i').classList.toggle('fa-moon');
  themeToggle.querySelector('i').classList.toggle('fa-sun');
});

// Öne çıkan paylaşımı yükleme
async function loadFeaturedPost() {
  const featuredPostDiv = document.getElementById('featuredPost');
  if (!featuredPostDiv) return;
  try {
    const response = await fetch('https://sec66.onrender.com/posts');
    const posts = await response.json();
    if (posts.length > 0) {
      const post = posts[0];
      featuredPostDiv.innerHTML = `
        <p>${post.message}</p>
        ${post.files.map(file => `
          <a href="https://sec66.onrender.com/uploads/${file}" target="_blank">
            ${file.includes('.mp4') ? `<video controls src="https://sec66.onrender.com/uploads/${file}"></video>` : 
              file.includes('.mp3') ? `<audio controls src="https://sec66.onrender.com/uploads/${file}"></audio>` : 
              `<img src="https://sec66.onrender.com/uploads/${file}" alt="Paylaşım">`}
          </a>
        `).join('')}
        ${post.tags && post.tags.length > 0 ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
      `;
    } else {
      featuredPostDiv.innerHTML = '<p>Henüz paylaşım yok.</p>';
    }
  } catch (error) {
    featuredPostDiv.innerHTML = '<p>Paylaşım yüklenemedi.</p>';
    console.error('Hata:', error);
  }
}

// Son paylaşımları yükleme ve filtreleme (index.html için)
let currentPage = 1;
const postsPerPage = 5;
async function loadRecentPosts(filter = 'all') {
  const postList = document.getElementById('postList');
  if (!postList) return;
  try {
    const response = await fetch('https://sec66.onrender.com/posts');
    let posts = await response.json();
    
    if (filter !== 'all') {
      posts = posts.filter(post => 
        post.files.some(file => file.includes(`.${filter}`))
      );
    }

    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const paginatedPosts = posts.slice(start, end);

    if (currentPage === 1) postList.innerHTML = '';
    
    paginatedPosts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.classList.add('post');
      postDiv.innerHTML = `
        <p>${post.message}</p>
        ${post.files.map(file => `
          <a href="https://sec66.onrender.com/uploads/${file}" target="_blank">
            ${file.includes('.mp4') ? `<video controls src="https://sec66.onrender.com/uploads/${file}"></video>` : 
              file.includes('.mp3') ? `<audio controls src="https://sec66.onrender.com/uploads/${file}"></audio>` : 
              `<img src="https://sec66.onrender.com/uploads/${file}" alt="Paylaşım">`}
          </a>
        `).join('')}
        ${post.tags && post.tags.length > 0 ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
        <button class="delete-btn" data-id="${post.id}">Sil</button>
      `;
      postDiv.querySelector('.delete-btn').addEventListener('click', () => deletePost(post.id, postDiv));
      postList.appendChild(postDiv);
    });

    document.getElementById('loadMoreBtn').style.display = 
      end >= posts.length ? 'none' : 'block';
  } catch (error) {
    postList.innerHTML = '<p>Paylaşımlar yüklenemedi.</p>';
    console.error('Hata:', error);
  }
}

// Filtre butonları için olay dinleyicileri (index.html ve share.html için ortak)
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter-btn.active')?.classList.remove('active');
    btn.classList.add('active');
    currentPage = 1;
    sharePage = 1; // share.html için de sıfırlıyoruz
    if (document.getElementById('postList')) loadRecentPosts(btn.dataset.filter);
    if (document.getElementById('postContainer')) loadRecentShares(btn.dataset.filter);
  });
});

// Daha fazla yükle butonu (index.html)
document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
  currentPage++;
  loadRecentPosts(document.querySelector('.filter-btn.active').dataset.filter);
});

// Bülten formu gönderimi
document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('emailInput').value;
  const messageDiv = document.getElementById('newsletterMessage');
  messageDiv.textContent = 'Abone oldunuz: ' + email;
  messageDiv.style.color = '#ff6f61';
  setTimeout(() => messageDiv.textContent = '', 3000);
  e.target.reset();
});

// FAQ accordion işlevi
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const answer = question.nextElementSibling;
    const icon = question.querySelector('i');
    answer.classList.toggle('active');
    icon.classList.toggle('fa-chevron-down');
    icon.classList.toggle('fa-chevron-up');
  });
});

// İletişim formu gönderimi
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail').value;
  const subject = document.getElementById('contactSubject').value;
  const message = document.getElementById('contactMessage').value;
  const messageDiv = document.getElementById('contactMessage');

  try {
    const response = await fetch('https://sec66.onrender.com/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message })
    });

    if (!response.ok) throw new Error('Mesaj gönderilemedi!');
    
    messageDiv.textContent = 'Mesajınız başarıyla gönderildi!';
    messageDiv.style.color = '#ff6f61';
    e.target.reset();
  } catch (error) {
    messageDiv.textContent = 'Bir hata oluştu: ' + error.message;
    messageDiv.style.color = '#ff4444';
  }
  setTimeout(() => messageDiv.textContent = '', 3000);
});

// Forum sekme geçişi
document.querySelectorAll('.forum-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelector('.forum-tab.active')?.classList.remove('active');
    document.querySelector('.forum-content.active')?.classList.remove('active');
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Oylama sistemi
document.querySelectorAll('.forum-post').forEach(post => {
  const upVote = post.querySelector('.vote-up');
  const downVote = post.querySelector('.vote-down');
  const voteCount = post.querySelector('.vote-count');

  upVote.addEventListener('click', () => {
    let count = parseInt(voteCount.textContent);
    voteCount.textContent = count + 1;
    upVote.style.color = '#ff6f61';
  });

  downVote.addEventListener('click', () => {
    let count = parseInt(voteCount.textContent);
    if (count > 0) {
      voteCount.textContent = count - 1;
      downVote.style.color = '#ff6f61';
    }
  });
});

// Share sayfasındaki paylaşım fonksiyonu
document.getElementById("shareForm")?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData();
  const files = document.getElementById("fileUpload").files;
  const message = document.getElementById("messageInput").value.trim();
  const tags = document.getElementById("tagsInput").value.trim();
  const uploadStatus = document.getElementById("uploadStatus");

  if (files.length === 0) {
    uploadStatus.textContent = "Lütfen en az ■bir dosya seçin!";
    uploadStatus.style.color = '#ff4444';
    return;
  }
  if (!message) {
    uploadStatus.textContent = "Lütfen bir mesaj yazın!";
    uploadStatus.style.color = '#ff4444';
    return;
  }

  uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }
  formData.append("message", message);
  if (tags) formData.append("tags", tags);

  try {
    const response = await fetch("https://sec66.onrender.com/share", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Paylaşım yapılamadı!");

    const result = await response.json();
    uploadStatus.textContent = "Paylaşım başarılı!";
    uploadStatus.style.color = '#ff6f61';
    setTimeout(() => uploadStatus.textContent = '', 3000);

    document.getElementById("shareForm").reset();
    document.getElementById("previewContainer").innerHTML = '<p class="empty-preview">Önizleme burada görünecek</p>';
    document.getElementById("selectedFiles").textContent = "Dosya seçilmedi";
    document.getElementById("charCount").textContent = "0";
  } catch (error) {
    uploadStatus.textContent = "Hata: " + error.message;
    uploadStatus.style.color = '#ff4444';
    console.error(error);
  }
});

// Dosya önizleme
document.getElementById('fileUpload')?.addEventListener('change', (e) => {
  const files = e.target.files;
  const previewContainer = document.getElementById('previewContainer');
  const selectedFiles = document.getElementById('selectedFiles');
  previewContainer.innerHTML = '';

  if (files.length > 0) {
    selectedFiles.textContent = `${files.length} dosya seçildi`;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const previewElement = document.createElement('div');
      previewElement.classList.add('preview-item');

      reader.onload = (event) => {
        if (file.type.startsWith('image/')) {
          previewElement.innerHTML = `<img src="${event.target.result}" alt="${file.name}" class="preview-media">`;
        } else if (file.type.startsWith('video/')) {
          previewElement.innerHTML = `<video src="${event.target.result}" controls class="preview-media"></video>`;
        } else if (file.type.startsWith('audio/')) {
          previewElement.innerHTML = `<audio src="${event.target.result}" controls class="preview-media"></audio>`;
        }
        previewContainer.appendChild(previewElement);
      };
      reader.readAsDataURL(file);
    });
  } else {
    selectedFiles.textContent = "Dosya seçilmedi";
    previewContainer.innerHTML = '<p class="empty-preview">Önizleme burada görünecek</p>';
  }
});

// Karakter sayacı
document.getElementById('messageInput')?.addEventListener('input', (e) => {
  const charCount = document.getElementById('charCount');
  charCount.textContent = e.target.value.length;
});

// Son paylaşımları yükleme (share.html için)
let sharePage = 1;
async function loadRecentShares(filter = 'all') {
  const postContainer = document.getElementById('postContainer');
  if (!postContainer) return;
  try {
    const response = await fetch('https://sec66.onrender.com/posts');
    let posts = await response.json();
    
    if (filter !== 'all') {
      posts = posts.filter(post => 
        post.files.some(file => file.includes(`.${filter}`))
      );
    }

    const start = (sharePage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const paginatedPosts = posts.slice(start, end);

    if (sharePage === 1) postContainer.innerHTML = '';
    
    paginatedPosts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.classList.add('post');
      postDiv.innerHTML = `
        <p>${post.message}</p>
        ${post.files.map(file => `
          <a href="https://sec66.onrender.com/uploads/${file}" target="_blank">
            ${file.includes('.mp4') ? `<video controls src="https://sec66.onrender.com/uploads/${file}"></video>` : 
              file.includes('.mp3') ? `<audio controls src="https://sec66.onrender.com/uploads/${file}"></audio>` : 
              `<img src="https://sec66.onrender.com/uploads/${file}" alt="Paylaşım">`}
          </a>
        `).join('')}
        ${post.tags && post.tags.length > 0 ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
        <button class="delete-btn" data-id="${post.id}">Sil</button>
      `;
      postDiv.querySelector('.delete-btn').addEventListener('click', () => deletePost(post.id, postDiv));
      postContainer.appendChild(postDiv);
    });

    document.getElementById('loadMorePosts').style.display = 
      end >= posts.length ? 'none' : 'block';
  } catch (error) {
    postContainer.innerHTML = '<p>Paylaşımlar yüklenemedi.</p>';
    console.error('Hata:', error);
  }
}

// Daha fazla paylaşım yükle butonu (share.html)
document.getElementById('loadMorePosts')?.addEventListener('click', () => {
  sharePage++;
  loadRecentShares(document.querySelector('.filter-btn.active').dataset.filter);
});

// Paylaşım silme fonksiyonu
async function deletePost(postId, postElement) {
  try {
    const response = await fetch(`https://sec66.onrender.com/posts/${postId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Paylaşım silinemedi!');
    postElement.remove(); // DOM'dan kaldır
  } catch (error) {
    console.error('Silme hatası:', error);
    alert('Paylaşım silinirken bir hata oluştu: ' + error.message);
  }
}
// Kayıt formu gönderimi
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const statusDiv = document.getElementById('registerStatus');

  try {
    const response = await fetch('https://sec66.onrender.com/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Kayıt başarısız!');

    statusDiv.textContent = 'Kayıt başarılı! Giriş yapabilirsiniz.';
    statusDiv.style.color = '#ff6f61';
    e.target.reset();
    setTimeout(() => {
      window.location.href = 'login.html'; // Giriş sayfasına yönlendir
    }, 2000);
  } catch (error) {
    statusDiv.textContent = 'Hata: ' + error.message;
    statusDiv.style.color = '#ff4444';
  }
});
// Sayfa yüklendiğinde gerekli fonksiyonları çalıştır
loadFeaturedPost();
loadRecentPosts();
loadRecentShares();

