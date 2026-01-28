const TOTAL_CATS = 15;
let currentIndex = 0;
let viewedCount = 0;
let likedCats = [];
let superlikedCats = [];
let swipeHistory = [];
let undoRemaining = 3;

const stack = document.getElementById("stack");
const progress = document.getElementById("progress");
const progressFill = document.getElementById("progressFill");
const controls = document.getElementById("controls");
const undoBtn = document.getElementById("undoBtn");
const undoCountEl = document.getElementById("undoCount");

let currentCard = null;
let startX = 0;
let startY = 0;
let isDragging = false;
let hasSwiped = false;
let lastTapTime = 0;

const rotations = [0, -4, 5, -5, 3, -4, 6, -3, 4, -5];

// Cat name generator
const catNames = [
  "Whiskers", "Luna", "Mittens", "Shadow", "Simba", "Bella", "Oliver", "Cleo",
  "Charlie", "Lucy", "Max", "Lily", "Leo", "Nala", "Milo", "Chloe", "Felix",
  "Daisy", "Oscar", "Sophie", "Tiger", "Zoe", "Smokey", "Princess", "Jasper"
];

const personalities = [
  "Playful", "Lazy", "Adventurous", "Cuddly", "Independent", "Mischievous",
  "Calm", "Energetic", "Curious", "Shy", "Social", "Sassy"
];

const breeds = [
  "Tabby", "Siamese", "Persian", "Maine Coon", "British Shorthair", "Bengal",
  "Russian Blue", "Ragdoll", "Sphynx", "Scottish Fold", "Mixed Breed"
];

const bios = [
  "Loves naps and treats. Dislikes Mondays.",
  "Professional bird watcher. Expert box sitter.",
  "Looking for someone to share my tuna with.",
  "Seeking lap to warm. Must love cuddles.",
  "Passionate about knocking things off tables.",
  "Enjoys long naps in sunbeams.",
  "Looking for my purr-fect match!",
  "I promise I'll only wake you at 5 AM sometimes.",
  "Expert in the art of loafing.",
  "Will judge you silently from across the room."
];

function generateCatProfile() {
  return {
    name: catNames[Math.floor(Math.random() * catNames.length)],
    age: Math.floor(Math.random() * 15) + 1,
    breed: breeds[Math.floor(Math.random() * breeds.length)],
    bio: bios[Math.floor(Math.random() * bios.length)],
    traits: [
      personalities[Math.floor(Math.random() * personalities.length)],
      personalities[Math.floor(Math.random() * personalities.length)],
      personalities[Math.floor(Math.random() * personalities.length)]
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3),
    stats: {
      cuteness: Math.floor(Math.random() * 3) + 8,
      fluffiness: Math.floor(Math.random() * 5) + 5,
      sass: Math.floor(Math.random() * 10) + 1
    },
    distance: Math.floor(Math.random() * 10) + 1
  };
}

function createStack() {
  for (let i = 0; i < 3; i++) addCard();
  updateProgress();
}

function addCard() {
  if (currentIndex >= TOTAL_CATS) return;

  const profile = generateCatProfile();
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.profile = JSON.stringify(profile);
  card.dataset.index = currentIndex;

  const img = document.createElement("img");
  img.src = `https://cataas.com/cat?width=500&random=${currentIndex}`;
  card.appendChild(img);

  // Info button
  const infoBtn = document.createElement("button");
  infoBtn.classList.add("info-btn");
  infoBtn.innerHTML = "i";
  infoBtn.onclick = (e) => {
    e.stopPropagation();
    card.classList.toggle("show-profile");
  };
  card.appendChild(infoBtn);

  // Profile overlay
  const profileDiv = document.createElement("div");
  profileDiv.classList.add("cat-profile");
  profileDiv.innerHTML = `
    <div class="cat-name">${profile.name}, ${profile.age}</div>
    <div class="cat-age">${profile.breed} • ${profile.distance} km away</div>
    <div class="cat-bio">${profile.bio}</div>
    <div class="cat-traits">
      ${profile.traits.map(trait => `<span class="trait-badge">${trait}</span>`).join('')}
    </div>
    <div class="cat-stats">
      <div class="stat">
        <div class="stat-label">Cuteness</div>
        <div class="stat-value">${profile.stats.cuteness}/10</div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width: ${profile.stats.cuteness * 10}%"></div></div>
      </div>
      <div class="stat">
        <div class="stat-label">Fluffiness</div>
        <div class="stat-value">${profile.stats.fluffiness}/10</div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width: ${profile.stats.fluffiness * 10}%"></div></div>
      </div>
      <div class="stat">
        <div class="stat-label">Sass</div>
        <div class="stat-value">${profile.stats.sass}/10</div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width: ${profile.stats.sass * 10}%"></div></div>
      </div>
    </div>
  `;
  card.appendChild(profileDiv);

  // Overlays
  const likeOverlay = document.createElement("div");
  likeOverlay.classList.add("card-overlay", "like");
  likeOverlay.innerHTML = '<div class="overlay-text">LIKE</div>';
  card.appendChild(likeOverlay);

  const nopeOverlay = document.createElement("div");
  nopeOverlay.classList.add("card-overlay", "nope");
  nopeOverlay.innerHTML = '<div class="overlay-text">NOPE</div>';
  card.appendChild(nopeOverlay);

  const superlikeOverlay = document.createElement("div");
  superlikeOverlay.classList.add("card-overlay", "superlike");
  superlikeOverlay.innerHTML = '<div class="overlay-text">SUPER!</div>';
  card.appendChild(superlikeOverlay);

  stack.prepend(card);
  updateStackPositions();
  currentIndex++;

  if (currentIndex + 1 < TOTAL_CATS) preloadCat(currentIndex + 1);
  if (currentIndex + 2 < TOTAL_CATS) preloadCat(currentIndex + 2);

  if (stack.children.length === 1) enableDrag(card);
}

function updateStackPositions() {
  const cards = Array.from(stack.children).reverse();
  cards.forEach((card, index) => {
    if (index === 0) {
      card.style.transform = '';
      card.style.opacity = '1';
    } else {
      const scale = 1 - (index * 0.05);
      const translateY = index * 12;
      const rotation = rotations[index % rotations.length];
      const opacity = 1 - (index * 0.1);
      card.style.transform = `scale(${scale}) translateY(${translateY}px) rotate(${rotation}deg)`;
      card.style.opacity = opacity;
    }
  });
}

function preloadCat(index) {
  const img = new Image();
  img.src = `https://cataas.com/cat?width=500&random=${index}`;
}

function enableDrag(card) {
  currentCard = card;

  card.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", endDrag);

  card.addEventListener("touchstart", startDrag);
  document.addEventListener("touchmove", onDrag, { passive: false });
  document.addEventListener("touchend", endDrag);

  // Double tap for super like
  card.addEventListener("dblclick", () => {
    if (!hasSwiped) {
      handleButtonSwipe('superlike');
    }
  });
  
  // Mobile double tap
  card.addEventListener("touchend", (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    if (tapLength < 300 && tapLength > 0) {
      if (!hasSwiped && !isDragging) {
        handleButtonSwipe('superlike');
      }
    }
    lastTapTime = currentTime;
  });
}

function getX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
function getY(e) { return e.touches ? e.touches[0].clientY : e.clientY; }

function startDrag(e) {
  if (!currentCard || e.target.classList.contains('info-btn')) return;
  isDragging = true;
  hasSwiped = false;
  startX = getX(e);
  startY = getY(e);
  currentCard.classList.add('dragging');
}

function onDrag(e) {
  if (!isDragging || !currentCard || hasSwiped) return;
  e.preventDefault();

  const x = getX(e) - startX;
  const y = getY(e) - startY;
  const rotate = x / 15;

  const opacity = 1 - Math.abs(x) / 400;
  currentCard.style.opacity = Math.max(0.3, opacity);

  currentCard.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg)`;

  const likeOverlay = currentCard.querySelector('.card-overlay.like');
  const nopeOverlay = currentCard.querySelector('.card-overlay.nope');
  const superlikeOverlay = currentCard.querySelector('.card-overlay.superlike');
  
  if (x > 50) {
    likeOverlay.classList.add('show');
    nopeOverlay.classList.remove('show');
    superlikeOverlay.classList.remove('show');
  } else if (x < -50) {
    nopeOverlay.classList.add('show');
    likeOverlay.classList.remove('show');
    superlikeOverlay.classList.remove('show');
  } else {
    likeOverlay.classList.remove('show');
    nopeOverlay.classList.remove('show');
    superlikeOverlay.classList.remove('show');
  }

  const SWIPE_THRESHOLD = 100;
  if (Math.abs(x) > SWIPE_THRESHOLD) {
    hasSwiped = true;
    swipe(currentCard, x > 0 ? "right" : "left", y);
  }
}

function endDrag(e) {
  if (!isDragging || !currentCard) return;
  isDragging = false;

  currentCard.classList.remove('dragging');

  if (!hasSwiped) {
    currentCard.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    currentCard.style.transform = "translate(0px, 0px) rotate(0deg)";
    currentCard.style.opacity = "1";
    
    currentCard.querySelector('.card-overlay.like').classList.remove('show');
    currentCard.querySelector('.card-overlay.nope').classList.remove('show');
    currentCard.querySelector('.card-overlay.superlike').classList.remove('show');
  }
}

function swipe(card, direction, dragY = 0) {
  if (!card) return;

  const cardData = {
    imgSrc: card.querySelector("img").src,
    profile: JSON.parse(card.dataset.profile),
    direction: direction,
    index: parseInt(card.dataset.index)
  };
  
  swipeHistory.push(cardData);

  card.style.transition = "transform 0.6s ease, opacity 0.6s ease";

  const flyX = direction === "right" ? 1000 : direction === "superlike" ? 0 : -1000;
  const flyY = direction === "superlike" ? -1000 : dragY * 2;
  const rotate = direction === "right" ? 30 : direction === "left" ? -30 : 0;

  if (direction === "right") {
    likedCats.push(cardData);
    showMatchAnimation(cardData.imgSrc);
  } else if (direction === "superlike") {
    likedCats.push(cardData);
    superlikedCats.push(cardData);
    showMatchAnimation(cardData.imgSrc, true);
  }
  
  viewedCount++;

  card.style.transform = `translate(${flyX}px, ${flyY}px) rotate(${rotate}deg)`;
  card.style.opacity = "0";

  setTimeout(() => {
    card.remove();
    addCard();
    if (stack.children.length > 0) enableDrag(stack.lastElementChild);
    updateProgress();
    updateUndoButton();

    if (viewedCount >= TOTAL_CATS && stack.children.length === 0) showSummary();
  }, 600);
}

function handleButtonSwipe(direction) {
  if (!currentCard || hasSwiped) return;
  hasSwiped = true;
  
  const overlay = direction === "right" 
    ? currentCard.querySelector('.card-overlay.like')
    : direction === "superlike"
    ? currentCard.querySelector('.card-overlay.superlike')
    : currentCard.querySelector('.card-overlay.nope');
  overlay.classList.add('show');
  
  setTimeout(() => swipe(currentCard, direction, 0), 100);
}

function undoSwipe() {
  if (undoRemaining <= 0 || swipeHistory.length === 0) return;
  
  const lastSwipe = swipeHistory.pop();
  undoRemaining--;
  viewedCount--;
  
  // Remove from liked/superliked arrays
  likedCats = likedCats.filter(cat => cat.index !== lastSwipe.index);
  superlikedCats = superlikedCats.filter(cat => cat.index !== lastSwipe.index);
  
  // Remove current top card
  if (currentCard) {
    currentCard.remove();
  }
  
  // Recreate the card
  currentIndex = lastSwipe.index;
  const profile = lastSwipe.profile;
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.profile = JSON.stringify(profile);
  card.dataset.index = lastSwipe.index;

  const img = document.createElement("img");
  img.src = lastSwipe.imgSrc;
  card.appendChild(img);

  const infoBtn = document.createElement("button");
  infoBtn.classList.add("info-btn");
  infoBtn.innerHTML = "i";
  infoBtn.onclick = (e) => {
    e.stopPropagation();
    card.classList.toggle("show-profile");
  };
  card.appendChild(infoBtn);

  const profileDiv = document.createElement("div");
  profileDiv.classList.add("cat-profile");
  profileDiv.innerHTML = `
    <div class="cat-name">${profile.name}, ${profile.age}</div>
    <div class="cat-age">${profile.breed} • ${profile.distance} km away</div>
    <div class="cat-bio">${profile.bio}</div>
    <div class="cat-traits">
      ${profile.traits.map(trait => `<span class="trait-badge">${trait}</span>`).join('')}
    </div>
    <div class="cat-stats">
      <div class="stat">
        <div class="stat-label">Cuteness</div>
        <div class="stat-value">${profile.stats.cuteness}/10</div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width: ${profile.stats.cuteness * 10}%"></div></div>
      </div>
      <div class="stat">
        <div class="stat-label">Fluffiness</div>
        <div class="stat-value">${profile.stats.fluffiness}/10</div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width: ${profile.stats.fluffiness * 10}%"></div></div>
      </div>
      <div class="stat">
        <div class="stat-label">Sass</div>
        <div class="stat-value">${profile.stats.sass}/10</div>
        <div class="stat-bar"><div class="stat-bar-fill" style="width: ${profile.stats.sass * 10}%"></div></div>
      </div>
    </div>
  `;
  card.appendChild(profileDiv);

  const likeOverlay = document.createElement("div");
  likeOverlay.classList.add("card-overlay", "like");
  likeOverlay.innerHTML = '<div class="overlay-text">LIKE</div>';
  card.appendChild(likeOverlay);

  const nopeOverlay = document.createElement("div");
  nopeOverlay.classList.add("card-overlay", "nope");
  nopeOverlay.innerHTML = '<div class="overlay-text">NOPE</div>';
  card.appendChild(nopeOverlay);

  const superlikeOverlay = document.createElement("div");
  superlikeOverlay.classList.add("card-overlay", "superlike");
  superlikeOverlay.innerHTML = '<div class="overlay-text">SUPER!</div>';
  card.appendChild(superlikeOverlay);

  stack.appendChild(card);
  currentIndex++;
  
  enableDrag(card);
  updateProgress();
  updateUndoButton();
}

function updateUndoButton() {
  undoCountEl.textContent = undoRemaining;
  if (undoRemaining <= 0) {
    undoBtn.classList.add('disabled');
  } else {
    undoBtn.classList.remove('disabled');
  }
}

function showMatchAnimation(imgSrc, isSuperLike = false) {
  const overlay = document.getElementById('matchOverlay');
  const matchImg = document.getElementById('matchImage');
  matchImg.src = imgSrc;
  overlay.classList.add('active');
  
  // Add confetti
  createConfetti(isSuperLike);
  
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 2000);
}

function createConfetti(isSuperLike) {
  const colors = isSuperLike 
    ? ['#007bff', '#6495ed', '#ffd700', '#fff']
    : ['#ff6b9d', '#ffa3c1', '#ff1493', '#fff'];
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    document.getElementById('matchOverlay').appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
}

function updateProgress() {
  const viewed = viewedCount;
  const percentage = (viewed / TOTAL_CATS) * 100;
  
  progress.textContent = `${viewed} of ${TOTAL_CATS} cats viewed`;
  progressFill.style.width = `${percentage}%`;
}

function openLightbox(imgSrc) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  lightboxImg.src = imgSrc;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function showSummary() {
  const appWrapper = document.querySelector('.app-wrapper');
  
  // Calculate analytics
  const likeRate = ((likedCats.length / TOTAL_CATS) * 100).toFixed(0);
  const avgCuteness = likedCats.length > 0 
    ? (likedCats.reduce((sum, cat) => sum + cat.profile.stats.cuteness, 0) / likedCats.length).toFixed(1)
    : 0;
  
  const traitCounts = {};
  likedCats.forEach(cat => {
    cat.profile.traits.forEach(trait => {
      traitCounts[trait] = (traitCounts[trait] || 0) + 1;
    });
  });
  const topTrait = Object.keys(traitCounts).sort((a, b) => traitCounts[b] - traitCounts[a])[0] || "None";
  
  appWrapper.innerHTML = `
    <div class="app" style="max-width: 1200px;">
      <div class="summary">
        <h2>You liked ${likedCats.length} cat${likedCats.length !== 1 ? 's' : ''}! 🐾</h2>
        
        ${likedCats.length > 0 ? `
          <div class="analytics">
            <h3>Your Swiping Stats <i class="fa-solid fa-chart-line"></i></h3>
            <div class="stat-grid">
              <div class="analytics-stat">
                <div class="analytics-stat-value">${likeRate}%</div>
                <div class="analytics-stat-label">Like Rate</div>
              </div>
              <div class="analytics-stat">
                <div class="analytics-stat-value">${superlikedCats.length}</div>
                <div class="analytics-stat-label">Super Likes <i class="fa-solid fa-star"></i></div>
              </div>
              <div class="analytics-stat">
                <div class="analytics-stat-value">${avgCuteness}/10</div>
                <div class="analytics-stat-label">Avg Cuteness</div>
              </div>
              <div class="analytics-stat">
                <div class="analytics-stat-value">${topTrait}</div>
                <div class="analytics-stat-label">Top Trait</div>
              </div>
            </div>
            <div class="fun-fact">
              💡 Fun Fact: You're ${parseInt(likeRate) > 50 ? 'not very picky' : 'quite selective'}! 
              ${superlikedCats.length > 0 ? `You gave out ${superlikedCats.length} super like${superlikedCats.length !== 1 ? 's' : ''}.` : ''}
            </div>
          </div>
          
          <div class="gallery-tabs">
            <button class="tab-btn active" onclick="showGallery('all')">All Matches (${likedCats.length})</button>
            ${superlikedCats.length > 0 ? `<button class="tab-btn" onclick="showGallery('super')">Super Likes <i class="fa-solid fa-star"></i> (${superlikedCats.length})</button>` : ''}
          </div>
          
          <div class="gallery-section active" id="gallery-all">
            <div class="liked-cats">
              ${likedCats.map(cat => `
                <div class="gallery-item ${superlikedCats.some(sc => sc.index === cat.index) ? 'superliked' : ''}" onclick="openLightbox('${cat.imgSrc}')">
                  <img src="${cat.imgSrc}" alt="${cat.profile.name}" />
                </div>
              `).join("")}
            </div>
          </div>
          
          ${superlikedCats.length > 0 ? `
            <div class="gallery-section" id="gallery-super">
              <div class="liked-cats">
                ${superlikedCats.map(cat => `
                  <div class="gallery-item superliked" onclick="openLightbox('${cat.imgSrc}')">
                    <img src="${cat.imgSrc}" alt="${cat.profile.name}" />
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ''}
        ` : `
          <div class="empty-state">
            <h3>No matches yet!</h3>
            <p>Maybe you're just too picky?</p>
          </div>
        `}
        
        <p>${likedCats.length > 0 ? 'Great taste in cats! Click any photo to view larger.' : 'Thanks for swiping!'}</p>
        <button class="btn-restart" onclick="location.reload()">Swipe Again</button>
      </div>
    </div>
  `;
}

function showGallery(type) {
  const tabs = document.querySelectorAll('.tab-btn');
  const galleries = document.querySelectorAll('.gallery-section');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  galleries.forEach(gallery => gallery.classList.remove('active'));
  
  if (type === 'all') {
    tabs[0].classList.add('active');
    document.getElementById('gallery-all').classList.add('active');
  } else {
    tabs[1].classList.add('active');
    document.getElementById('gallery-super').classList.add('active');
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLightbox();
});

createStack();