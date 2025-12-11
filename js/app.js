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
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');


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
        
        const title = item.title || item.name;
        const date = item.release_date || item.first_air_date || 'Tarih Yok';
        const posterPath = item.poster_path 
            ? IMAGE_BASE_URL + item.poster_path 
            : 'https://via.placeholder.com/500x750?text=Gorsel+Yok';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : '0';

        card.innerHTML = `
            <div class="rating">${rating}</div>
            <img src="${posterPath}" alt="${title}">
            <div class="card-info">
                <h3>${title}</h3>
                <p class="release-date">${date}</p>
            </div>
        `;
        
        mediaGrid.appendChild(card);
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
                <button id="add-favorite-btn" data-id="${data.id}" data-type="${state.currentType}">
                    ❤️ Favorilere Ekle
                </button>
            </div>
        </div>
    `;

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


mediaGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.media-card');
    if (card) {
        const id = card.dataset.id;
        const type = state.currentType;
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