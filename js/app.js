const { API_URL } = CONFIG;

const state = {
    startIndex: 0,
    currentQuery: 'subject:fiction',
    isSearch: false
};

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const sectionTitle = document.getElementById('section-title');
const mediaGrid = document.getElementById('media-grid');
const favoritesGrid = document.getElementById('favorites-grid');
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');

const contentSection = document.getElementById('content-section');
const favoritesSection = document.getElementById('favorites-section');
const searchSection = document.getElementById('search-section');
const navHome = document.getElementById('nav-home');
const navFavorites = document.getElementById('nav-favorites');

function getFavorites() {
    const favs = localStorage.getItem('libraryFavorites');
    return favs ? JSON.parse(favs) : [];
}

function saveFavorite(book) {
    const favs = getFavorites();
    if (!favs.some(f => f.id === book.id)) {
        favs.push(book);
        localStorage.setItem('libraryFavorites', JSON.stringify(favs));
        alert('Kitap okuma listesine eklendi!');
    }
}

function removeFavorite(id) {
    let favs = getFavorites();
    favs = favs.filter(b => b.id !== id);
    localStorage.setItem('libraryFavorites', JSON.stringify(favs));
    if (!favoritesSection.classList.contains('hidden')) displayFavorites();
}

function isFavorite(id) {
    return getFavorites().some(b => b.id === id);
}

function showLoading() {
    mediaGrid.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
}

async function fetchBooks(query) {
    showLoading();
    try {
        const url = `${API_URL}?q=${encodeURIComponent(query)}&startIndex=${state.startIndex}&maxResults=20&printType=books`;
        const response = await fetch(url);
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('API Hatası:', error);
        return [];
    }
}

async function fetchBookDetails(id) {
    try {
        const url = `${API_URL}/${id}`;
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

function createBookCard(item) {
    const info = item.volumeInfo;
    const title = info.title || 'İsimsiz Kitap';
    const authors = info.authors ? info.authors.join(', ') : 'Yazar Bilinmiyor';
    const date = info.publishedDate ? info.publishedDate.substring(0, 4) : '';
    const img = info.imageLinks?.thumbnail || 'https://via.placeholder.com/128x196?text=Resim+Yok';

    return `
        <img src="${img}" alt="${title}">
        <div class="card-info">
            <h3>${title}</h3>
            <p class="author">${authors}</p>
            <p class="date">${date}</p>
        </div>
    `;
}

function displayBooks(items) {
    mediaGrid.innerHTML = '';
    if (items.length === 0) {
        mediaGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Sonuç bulunamadı.</p>';
        return;
    }

    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.classList.add('media-card');
        card.style.animationDelay = `${index * 0.05}s`; // Sırayla gelme efekti
        card.dataset.id = item.id;
        card.innerHTML = createBookCard(item);
        mediaGrid.appendChild(card);
    });
}

function displayFavorites() {
    const favs = getFavorites();
    favoritesGrid.innerHTML = '';
    
    if (favs.length === 0) {
        favoritesGrid.innerHTML = '<p>Okuma listeniz boş.</p>';
        return;
    }

    favs.forEach(item => {
        const mockItem = {
            id: item.id,
            volumeInfo: {
                title: item.title,
                authors: item.authors,
                publishedDate: item.date,
                imageLinks: { thumbnail: item.img }
            }
        };
        
        const card = document.createElement('div');
        card.classList.add('media-card');
        card.dataset.id = item.id;
        card.innerHTML = createBookCard(mockItem);
        favoritesGrid.appendChild(card);
    });
}

function openModal(data) {
    const info = data.volumeInfo;
    const title = info.title;
    const authors = info.authors ? info.authors.join(', ') : 'Bilinmiyor';
    const desc = info.description || 'Özet bilgisi bulunmamaktadır.';
    const pageCount = info.pageCount ? `${info.pageCount} Sayfa` : '';
    const img = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || 'https://via.placeholder.com/200x300';
    
    const cleanDesc = desc.replace(/<[^>]*>?/gm, '');
    const favorited = isFavorite(data.id);
    const btnText = favorited ? 'Listeden Çıkar' : 'Okuma Listeme Ekle';
    const btnClass = favorited ? 'remove-fav' : 'add-fav';

    modalBody.innerHTML = `
        <div class="modal-flex">
            <img src="${img}" alt="${title}" class="modal-poster">
            <div class="modal-info">
                <h2>${title}</h2>
                <div class="meta">
                    <span>✍️ ${authors}</span> | 
                    <span>📅 ${info.publishedDate || '-'}</span> |
                    <span>📄 ${pageCount}</span>
                </div>
                <p>${cleanDesc.substring(0, 500)}${cleanDesc.length > 500 ? '...' : ''}</p>
                <button id="fav-btn" class="${btnClass}">${btnText}</button>
                ${info.previewLink ? `<a href="${info.previewLink}" target="_blank" style="margin-left:10px; text-decoration:none; color:var(--primary-color);">Google'da İncele ↗</a>` : ''}
            </div>
        </div>
    `;

    document.getElementById('fav-btn').addEventListener('click', () => {
        if (isFavorite(data.id)) {
            removeFavorite(data.id);
            modalOverlay.classList.add('hidden');
            document.body.style.overflow = 'auto';
        } else {
            const bookToSave = {
                id: data.id,
                title: title,
                authors: info.authors,
                date: info.publishedDate,
                img: img
            };
            saveFavorite(bookToSave);
            modalOverlay.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    });

    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

async function updateContent() {
    const query = state.currentQuery;
    const books = await fetchBooks(query);
    displayBooks(books);
}

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = searchInput.value.trim();
    if (val) {
        state.currentQuery = val;
        sectionTitle.textContent = `"${val}" için sonuçlar`;
        filterBtns.forEach(b => b.classList.remove('active'));
        updateContent();
    }
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentQuery = btn.dataset.query;
        sectionTitle.textContent = `${btn.textContent} Kitapları`;
        updateContent();
    });
});

mediaGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.media-card');
    if (card) {
        const details = await fetchBookDetails(card.dataset.id);
        if (details) openModal(details);
    }
});

favoritesGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.media-card');
    if (card) {
        const details = await fetchBookDetails(card.dataset.id);
        if (details) openModal(details);
    }
});

navHome.addEventListener('click', () => {
    contentSection.classList.remove('hidden');
    searchSection.classList.remove('hidden');
    favoritesSection.classList.add('hidden');
    navHome.classList.add('active');
    navFavorites.classList.remove('active');
    updateContent();
});

navFavorites.addEventListener('click', () => {
    contentSection.classList.add('hidden');
    searchSection.classList.add('hidden');
    favoritesSection.classList.remove('hidden');
    navHome.classList.remove('active');
    navFavorites.classList.add('active');
    displayFavorites();
});

closeModalBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = 'auto';
});
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
});

document.addEventListener('DOMContentLoaded', updateContent);