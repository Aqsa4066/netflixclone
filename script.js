document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app-root');
    const TMDB_API_KEY = "Your api key";
    const TMDB_BASE_URL = "https://api.themoviedb.org/3";
    const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";

    // --- DATA MANAGEMENT ---
    let myList = JSON.parse(localStorage.getItem('myList')) || [];
    let profiles = JSON.parse(localStorage.getItem('profiles')) || [
        { id: 1, name: 'Ashish', avatar: 'https://placehold.co/150x150/E50914/FFFFFF?text=A' },
        { id: 2, name: 'Kids', avatar: 'https://placehold.co/150x150/333/FFFFFF?text=K' }
    ];
    let manageMode = false;

    // --- CATEGORY & GENRE DEFINITIONS ---
    const HOME_CATEGORIES = { "Popular on Netflix": "trending/all/week", "Trending Now": "movie/popular", "Top Rated Movies": "movie/top_rated", "Top Rated TV Shows": "tv/top_rated" };
    const MOVIE_CATEGORIES = { "Popular Movies": "movie/popular", "Trending Movies": "trending/movie/week", "Action": "discover/movie?with_genres=28", "Comedy": "discover/movie?with_genres=35", "Horror": "discover/movie?with_genres=27" };
    const TV_CATEGORIES = { "Popular TV Shows": "tv/popular", "Top Rated TV": "tv/top_rated", "Sci-Fi & Fantasy": "discover/tv?with_genres=10765", "Dramas": "discover/tv?with_genres=18", "Comedies": "discover/tv?with_genres=35" };

    // --- HTML TEMPLATES ---
    const landingPageTemplate = `
        <div class="landing-page-container">
            <nav class="landing-nav">
                <img src="assets/Netflix_2015_logo.svg" alt="Netflix Logo" class="logo">
                <a href="#" class="btn-signin" data-route="profiles">Sign In</a>
            </nav>
            <div class="hero-card">
                <h1>Unlimited movies, TV shows and more.</h1>
                <h3>Watch anywhere. Cancel anytime.</h3>
                <p>Ready to watch? Enter your email to create or restart your membership.</p>
                <form class="email-form">
                    <input type="email" placeholder="Email address" required>
                    <button type="submit" class="btn-get-started" data-route="profiles">Get Started &gt;</button>
                </form>
            </div>
        </div>`;
        
    const browsePageTemplate = `
        <div class="browse-page-container">
            <nav class="sidebar">
                <img src="assets/Netflix_2015_logo.svg" alt="Netflix Logo" class="sidebar-logo">
                <ul class="sidebar-nav-links">
                    <li><a href="#" id="search-btn" title="Search"><i class="fas fa-search"></i></a></li>
                    <li><a href="#" id="home-btn" title="Home"><i class="fas fa-home"></i></a></li>
                    <li><a href="#" id="tv-btn" title="TV Shows"><i class="fas fa-tv"></i></a></li>
                    <li><a href="#" id="movies-btn" title="Movies"><i class="fas fa-film"></i></a></li>
                    <li><a href="#" id="my-list-btn" title="My List"><i class="fas fa-bookmark"></i></a></li>
                </ul>
                <div class="sidebar-logout">
                    <a href="#" data-route="profiles" title="Switch Profile"><i class="fas fa-power-off"></i></a>
                </div>
            </nav>
            <main class="main-content"></main>
        </div>`;

    const searchPageTemplate = `
        <div class="search-container"><input type="text" id="search-input" placeholder="Search for movies, TV shows..."></div>
        <div class="search-results-grid"></div>`;

    function getProfilesPageTemplate() {
        return `
        <div class="profiles-container">
            <h1>Who's watching?</h1>
            <div class="profile-list">
                ${profiles.map(p => `
                    <div class="profile" data-profile-id="${p.id}">
                        <div class="profile-avatar" style="background-image: url('${p.avatar}')">
                            ${manageMode && profiles.length > 1 ? '<div class="delete-overlay"><i class="fas fa-trash"></i></div>' : ''}
                        </div>
                        <span class="profile-name">${p.name}</span>
                    </div>`).join('')}
                <div class="profile" id="add-profile-btn">
                    <div class="profile-avatar" style="background-image: url('https://placehold.co/150x150/777/FFFFFF?text=%2B')"></div>
                    <span class="profile-name">Add Profile</span>
                </div>
            </div>
            <div class="profile-buttons">
                <button class="btn-manage-profiles">${manageMode ? 'Done' : 'Manage Profiles'}</button>
                <button class="btn-logout" data-route="landing">Logout</button>
            </div>
        </div>`;
    }

    // --- ROUTER & NAVIGATION ---
    function navigate(path) {
        if (path === 'profiles') {
            appRoot.innerHTML = getProfilesPageTemplate();
            addProfilePageListeners();
        } else {
            const routes = { 'landing': landingPageTemplate, 'browse': browsePageTemplate };
            appRoot.innerHTML = routes[path] || routes['landing'];
        }

        window.history.pushState({path}, path, `#${path}`);
        if (path === 'browse') initBrowsePage();
        addNavigationListeners();
    }
    function addNavigationListeners() {
        document.querySelectorAll('[data-route]').forEach(el => el.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(el.dataset.route);
        }));
    }

    // --- PROFILE PAGE LOGIC ---
    function addProfilePageListeners() {
        document.querySelectorAll('.profile[data-profile-id]').forEach(el => {
            el.addEventListener('click', () => {
                const profileId = parseInt(el.dataset.profileId);
                if (manageMode) {
                    if (profiles.length > 1) { // Prevent deleting the last profile
                        deleteProfile(profileId);
                    }
                } else {
                    navigate('browse');
                }
            });
        });
        document.getElementById('add-profile-btn')?.addEventListener('click', addProfile);
        document.querySelector('.btn-manage-profiles')?.addEventListener('click', toggleManageMode);
    }
    function saveProfiles() { localStorage.setItem('profiles', JSON.stringify(profiles)); }
    function addProfile() {
        const name = prompt("Enter a name for the new profile:");
        if (name && name.trim() !== '') {
            const newProfile = {
                id: Date.now(),
                name: name.trim(),
                avatar: `https://placehold.co/150x150/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=${name.charAt(0).toUpperCase()}`
            };
            profiles.push(newProfile);
            saveProfiles();
            navigate('profiles');
        }
    }
    function deleteProfile(id) {
        profiles = profiles.filter(p => p.id !== id);
        saveProfiles();
        navigate('profiles');
    }
    function toggleManageMode() {
        manageMode = !manageMode;
        navigate('profiles');
    }

    // --- BROWSE PAGE LOGIC ---
    function initBrowsePage() {
        renderHomePage();
        addSidebarNavListeners();
    }
    function addSidebarNavListeners() {
        document.getElementById('home-btn')?.addEventListener('click', (e) => { e.preventDefault(); renderHomePage(); });
        document.getElementById('tv-btn')?.addEventListener('click', (e) => { e.preventDefault(); renderContentPage(TV_CATEGORIES, 'tv', 'tv-btn'); });
        document.getElementById('movies-btn')?.addEventListener('click', (e) => { e.preventDefault(); renderContentPage(MOVIE_CATEGORIES, 'movie', 'movies-btn'); });
        document.getElementById('my-list-btn')?.addEventListener('click', (e) => { e.preventDefault(); renderMyListPage(); });
        document.getElementById('search-btn')?.addEventListener('click', (e) => { e.preventDefault(); renderSearchPage(); });
        document.querySelector('.sidebar-logout a')?.addEventListener('click', (e) => { e.preventDefault(); navigate('profiles'); });
    }
    
    // --- PAGE RENDERING FUNCTIONS ---
    async function renderContentPage(categories, type = 'movie', activeId) {
        updateActiveLink(activeId);
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;
        mainContent.innerHTML = `<section class="hero-section"></section><div class="movie-rows-container"></div>`;

        const heroContent = await fetchMovies(type === 'tv' ? 'tv/popular' : 'movie/popular');
        if (heroContent?.results?.length > 0) {
            displayHero(heroContent.results[Math.floor(Math.random() * heroContent.results.length)]);
        }

        const rowsContainer = mainContent.querySelector('.movie-rows-container');
        for (const [title, endpoint] of Object.entries(categories)) {
            const items = await fetchMovies(endpoint);
            if (items?.results?.length > 0) {
                rowsContainer.appendChild(createMovieRow(title, items.results));
            }
        }
    }
    function renderHomePage() { renderContentPage(HOME_CATEGORIES, 'movie', 'home-btn'); }
    async function renderMyListPage() {
        updateActiveLink('my-list-btn');
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;
        mainContent.innerHTML = `<h1 class="my-list-page-header">My Favourite Movies & Shows</h1><div class="movie-rows-container" style="margin-top: 20px;"></div>`;

        const rowsContainer = mainContent.querySelector('.movie-rows-container');
        if (myList.length === 0) {
            rowsContainer.innerHTML = `<h2 style="font-size: 1.5rem; text-align: center; margin-top: 50px;">My List is empty. Add shows and movies to see them here!</h2>`;
            return;
        }

        const myListDetails = await Promise.all(myList.map(item => fetchMovies(`${item.type}/${item.id}`)));
        
        const movies = myListDetails.filter(item => item && item.title);
        const tvShows = myListDetails.filter(item => item && item.name);

        rowsContainer.innerHTML = ''; // Clear for new content
        if (movies.length > 0) {
            rowsContainer.appendChild(createMovieRow("Movies", movies));
        }
        if (tvShows.length > 0) {
            rowsContainer.appendChild(createMovieRow("TV Shows", tvShows));
        }
    }
    async function renderSearchPage() {
        updateActiveLink('search-btn');
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;
        mainContent.innerHTML = searchPageTemplate;

        const searchInput = document.getElementById('search-input');
        const resultsGrid = document.querySelector('.search-results-grid');
        
        const initialResults = await fetchMovies('trending/all/week');
        displaySearchResults(initialResults, resultsGrid, "Top Searches");

        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                const query = searchInput.value.trim();
                if (query) {
                    const searchResults = await fetchMovies(`search/multi`, `&query=${encodeURIComponent(query)}`);
                    displaySearchResults(searchResults, resultsGrid, "Results");
                } else {
                    displaySearchResults(initialResults, resultsGrid, "Top Searches");
                }
            }, 500);
        });
    }
    function displaySearchResults(results, container, title) {
        container.innerHTML = `<h2>${title}</h2>`;
        if (results?.results?.length > 0) {
            results.results
                .filter(item => item.poster_path)
                .forEach(item => container.appendChild(createMovieCard(item)));
        } else if (title === "Results") {
            container.innerHTML += `<p>No results found.</p>`;
        }
    }

    // --- CORE HELPER FUNCTIONS ---
    async function fetchMovies(endpoint, queryParams = '') {
        const url = `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&language=en-US${queryParams}`;
        try {
            const response = await fetch(url);
            if (!response.ok) { console.error(`API Error: ${response.status} for ${url}`); return null; }
            return await response.json();
        } catch (error) { console.error(`Fetch Error for ${url}:`, error); return null; }
    }
    function createMovieRow(title, items) {
        const row = document.createElement('section');
        row.className = 'movie-row';
        row.innerHTML = `<h2>${title}</h2><div class="carousel-inner"></div>`;
        const carousel = row.querySelector('.carousel-inner');
        if (Array.isArray(items)) {
            items.forEach(item => carousel.appendChild(createMovieCard(item)));
        }
        return row;
    }
    function createMovieCard(item) {
        const card = document.createElement('div');
        card.className = 'movie-card-browse';
        card.dataset.itemId = item.id;
        const posterPath = item.poster_path ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}` : 'https://placehold.co/220x330/222/FFF?text=No+Image';
        card.innerHTML = `<img src="${posterPath}" alt="${item.title || item.name}">`;
        const myListBtn = document.createElement('button');
        myListBtn.className = 'my-list-btn-card';
        updateMyListButtonState(myListBtn, item.id);
        myListBtn.onclick = (e) => {
            e.stopPropagation();
            toggleMyList(item, myListBtn);
            if (document.querySelector('.sidebar-nav-links li a.active')?.id === 'my-list-btn') {
                renderMyListPage();
            }
        };
        card.appendChild(myListBtn);
        card.onclick = () => displayHero(item);
        return card;
    }
    function displayHero(item) {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection || !item) return;
        const backdropPath = item.backdrop_path ? `${TMDB_IMAGE_BASE_URL}original${item.backdrop_path}` : '';
        heroSection.innerHTML = `
            <div class="hero-background" style="background-image: linear-gradient(to right, #111 20%, transparent 80%), url(${backdropPath})"></div>
            <div class="hero-content">
                <h1 class="hero-title">${item.title || item.name}</h1>
                <p class="hero-description">${item.overview}</p>
                <div class="hero-buttons">
                    <button class="btn-hero btn-play"><i class="fas fa-play"></i> Play</button>
                    <button class="btn-hero btn-my-list" data-item-id="${item.id}"></button>
                </div>
            </div>`;
        const heroMyListButton = heroSection.querySelector('.btn-my-list');
        updateMyListButtonState(heroMyListButton, item.id);
        heroMyListButton.addEventListener('click', () => toggleMyList(item, heroMyListButton));
    }
    function toggleMyList(item, button) {
        const itemId = item.id;
        const itemType = item.media_type || (item.title ? 'movie' : 'tv');
        const index = myList.findIndex(i => i.id === itemId);
        if (index > -1) { myList.splice(index, 1); } else { myList.push({ id: itemId, type: itemType }); }
        localStorage.setItem('myList', JSON.stringify(myList));
        updateMyListButtonState(button, itemId);
        const cardButton = document.querySelector(`.movie-card-browse[data-item-id='${itemId}'] .my-list-btn-card`);
        if (cardButton) updateMyListButtonState(cardButton, itemId);
    }
    function updateMyListButtonState(button, itemId) {
        if (!button) return;
        const isInList = myList.some(i => i.id === itemId);
        const icon = isInList ? 'fa-check' : 'fa-plus';
        if (button.classList.contains('my-list-btn-card')) {
             button.innerHTML = `<i class="fas ${icon}"></i>`;
        } else {
             button.innerHTML = `<i class="fas ${icon}"></i> My List`;
        }
    }
    function updateActiveLink(activeId) {
        document.querySelectorAll('.sidebar-nav-links li a').forEach(link => {
            link.classList.remove('active');
        });
        const linkToActivate = document.getElementById(activeId);
        if (linkToActivate) {
            linkToActivate.classList.add('active');
        }
    }

    // --- INITIAL APPLICATION LOAD ---
    const initialPath = window.location.hash.replace('#', '') || 'landing';
    navigate(initialPath);
});
