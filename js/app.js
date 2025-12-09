const API_KEY = '1a52c27b49eaaf7b2e60876fc327a602';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const state = {
    page: 1,
    totalPage: 1,
    currentType: 'movie', 
    searchQuery: null
};

async function fetchData(endpoint) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=tr-TR`);
        if (!response.ok) {
            throw new Error(`HTTP Hata: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Veri çekme hatası:', error);
        return null;
    }
}

function displayResults(results) {
    const grid = document.getElementById('media-grid');
    grid.innerHTML = '';

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

async function init() {
    const data = await fetchData('/movie/popular');
    if (data && data.results) {
        displayResults(data.results);
    }
}

document.addEventListener('DOMContentLoaded', init);