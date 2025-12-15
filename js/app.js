const API_KEY = CONFIG.API_KEY;
const BASE_URL = CONFIG.API_URL;
const IMAGE_BASE_URL = CONFIG.IMAGE_URL;

const state = {
    page: 1,
    currentType: 'movie', 
    searchQuery: null
};

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const sectionTitle = document.getElementById('section-title');
const mediaGrid = document.getElementById('media-grid');
const favoritesGrid = document.getElementById('favorites-grid'); // Yeni
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');

const contentSection = document.getElementById('content-section');
const favoritesSection = document.getElementById('favorites-section');
const searchSection = document.getElementById('search-section');
const navHome = document.getElementById('nav-home');
const navFavorites = document.getElementById('nav-favorites');


function getFavorites() {
    const favorites = localStorage.getItem('cineLibraryFavorites');
    return favorites ? JSON.parse(favorites) : [];
}

function saveFavorite(item) {
    const favorites = getFavorites();
    if (!favorites.some(fav => fav.id === item.id)) {
        favorites.push(item);
        localStorage.setItem('cineLibraryFavorites', JSON.stringify(favorites));
        alert('Favorilere eklendi!');
    }
}

function removeFavorite(id) {
    let favorites = getFavorites();
    favorites = favorites.filter(item => item.id.toString() !== id.toString());
    localStorage.setItem('cineLibraryFavorites', JSON.stringify(favorites));
    if (!favoritesSection.classList.contains('hidden')) {
        displayFavorites();
    }
}

function isFavorite(id) {
    const favorites = getFavorites();
    return favorites.some(item => item.id.toString() === id.toString());
}


async function fetchData(endpoint, query = null) {
    try {
        let url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=tr-TR&page=${state.page}`;
        if (query) url += `&query=${encodeURIComponent(query)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Hata oluştu');
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function fetchDetails(id, type) {
    try {
        const url = `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=tr-TR`;
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}


function createCardHTML(item) {
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date || 'Tarih Yok';
    const posterPath = item.poster_path 
        ? IMAGE_BASE_URL + item.poster_path 
        : 'https://via.placeholder.com/500x750?text=Gorsel+Yok';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : '0';

    return `
        <div class="rating">${rating}</div>
        <img src="${posterPath}" alt="${title}">
        <div class="card-info">
            <h3>${title}</h3>
            <p class="release-date">${date}</p>
        </div>
    `;
}

function displayResults(results) {
    mediaGrid.innerHTML = '';
    if (results.length === 0) {
        mediaGrid.innerHTML = '<p>Sonuç bulunamadı.</p>';
        return;
    }
    results.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('media-card');
        card.dataset.id = item.id;
        card.dataset.type = state.currentType; 
        card.innerHTML = createCardHTML(item);
        mediaGrid.appendChild(card);
    });
}

function displayFavorites() {
    const favorites = getFavorites();
    favoritesGrid.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = '<p>Henüz favori eklemediniz.</p>';
        return;
    }

    favorites.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('media-card');
        card.dataset.id = item.id;
        card.dataset.type = item.type || 'movie';
        card.innerHTML = createCardHTML(item);
        favoritesGrid.appendChild(card);
    });
}

function openModal(data) {
    const title = data.title || data.name;
    const date = data.release_date || data.first_air_date || '-';
    const overview = data.overview || 'Özet bulunmuyor.';
    const posterPath = data.poster_path 
        ? IMAGE_BASE_URL + data.poster_path 
        : 'https://via.placeholder.com/500x750?text=Gorsel+Yok';
    const genres = data.genres ? data.genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('') : '';
    const vote = data.vote_average ? data.vote_average.toFixed(1) : '-';

    const favorited = isFavorite(data.id);
    const btnText = favorited ? '💔 Favorilerden Çıkar' : '❤️ Favorilere Ekle';
    const btnClass = favorited ? 'remove-fav' : 'add-fav';

    modalBody.innerHTML = `
        <div class="modal-flex">
            <img src="${posterPath}" alt="${title}" class="modal-poster">
            <div class="modal-info">
                <h2>${title}</h2>
                <div class="meta">
                    <span>📅 ${date}</span>
                    <span>⭐ ${vote}/10</span>
                </div>
                <div class="genres">${genres}</div>
                <p>${overview}</p>
                <button id="fav-btn" class="${btnClass}" data-id="${data.id}">
                    ${btnText}
                </button>
            </div>
        </div>
    `;

    document.getElementById('fav-btn').addEventListener('click', () => {
        if (isFavorite(data.id)) {
            removeFavorite(data.id);
            modalOverlay.classList.add('hidden');
            document.body.style.overflow = 'auto';
        } else {
            const itemToSave = {
                id: data.id,
                title: title,
                name: data.name,
                poster_path: data.poster_path,
                release_date: data.release_date,
                first_air_date: data.first_air_date,
                vote_average: data.vote_average,
                type: state.currentType
            };
            saveFavorite(itemToSave);
            modalOverlay.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    });

    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

async function updateContent() {
    let endpoint;
    if (state.searchQuery) {
        endpoint = `/search/${state.currentType}`;
        sectionTitle.textContent = `"${state.searchQuery}" Sonuçları`;
    } else {
        endpoint = `/${state.currentType}/popular`;
        sectionTitle.textContent = `Popüler ${state.currentType === 'movie' ? 'Filmler' : 'Diziler'}`;
    }

    const data = await fetchData(endpoint, state.searchQuery);
    if (data && data.results) displayResults(data.results);
}


function showHome() {
    contentSection.classList.remove('hidden');
    searchSection.classList.remove('hidden');
    favoritesSection.classList.add('hidden');
    
    navHome.classList.add('active');
    navFavorites.classList.remove('active');
    
    updateContent();
}

function showFavorites() {
    contentSection.classList.add('hidden');
    searchSection.classList.add('hidden');
    favoritesSection.classList.remove('hidden');
    
    navHome.classList.remove('active');
    navFavorites.classList.add('active');
    
    displayFavorites();
}


navHome.addEventListener('click', (e) => {
    e.preventDefault();
    showHome();
});

navFavorites.addEventListener('click', (e) => {
    e.preventDefault();
    showFavorites();
});

mediaGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.media-card');
    if (card) {
        const id = card.dataset.id;
        const type = card.dataset.type;
        const details = await fetchDetails(id, type);
        if (details) openModal(details);
    }
});

favoritesGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.media-card');
    if (card) {
        const id = card.dataset.id;
        const type = card.dataset.type || 'movie'; 
        
        const details = await fetchDetails(id, type);
        if (details) openModal(details);
    }
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

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        state.searchQuery = query;
        updateContent();
    }
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentType = btn.dataset.type;
        updateContent();
    });
});

document.addEventListener('DOMContentLoaded', updateContent);