const track = document.querySelector('.carousel-track');
const games = Array.from(document.querySelectorAll('.game'));
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('carouselDots');

let currentIndex = 0;

function updateCarousel() {
    const currentGameWidth = games[currentIndex].getBoundingClientRect().width;
    const carousel = document.querySelector('.carousel');
    const carouselWidth = carousel.getBoundingClientRect().width;
    const offset = (carouselWidth - currentGameWidth) / 2;
    const moveAmount = -games[currentIndex].offsetLeft + offset;
    track.style.transform = `translateX(${moveAmount}px)`;

    games.forEach((game, index) => {
        game.classList.toggle('active', index === currentIndex);
    });

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === games.length - 1;

    Array.from(dotsContainer.children).forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });
}

games.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('carousel-dot');
    if (index === currentIndex) dot.classList.add('active');
    dot.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
    });
    dotsContainer.appendChild(dot);
});

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentIndex < games.length - 1) {
        currentIndex++;
        updateCarousel();
    }
});

window.addEventListener('resize', updateCarousel);
updateCarousel();
