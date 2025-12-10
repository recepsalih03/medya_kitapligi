const API_KEY = '1a52c27b49eaaf7b2e60876fc327a602';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const state = {
    page: 1,
    currentType: 'movie',
    searchQuery: null
};

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const sectionTitle = document.getElementById('section-title');

async function fetchData(endpoint, query = null) {
    try {
        let url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=tr-TR&page=${state.page}`;
        if (query) {
            url += `&query=${encodeURIComponent(query)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Hata oluştu');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

function displayResults(results) {
    const grid = document.getElementById('media-grid');
    grid.innerHTML = '';

    if (results.length === 0) {
        grid.innerHTML = '<p>Sonuç bulunamadı.</p>';
        return;
    }

    results.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('media-card');
        
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
        
        grid.appendChild(card);
    });
}

async function updateContent() {
    let endpoint;
    
    if (state.searchQuery) {
        endpoint = `/search/${state.currentType}`;
        sectionTitle.textContent = `"${state.searchQuery}" için Sonuçlar (${state.currentType === 'movie' ? 'Film' : 'Dizi'})`;
    } else {
        endpoint = `/${state.currentType}/popular`;
        sectionTitle.textContent = `Popüler ${state.currentType === 'movie' ? 'Filmler' : 'Diziler'}`;
    }

    const data = await fetchData(endpoint, state.searchQuery);
    if (data && data.results) {
        displayResults(data.results);
    }
}


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