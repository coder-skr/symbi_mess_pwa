let menuData = {};

// Fetch the JSON file when the app loads
async function fetchMenu() {
    try {
        const response = await fetch('./menu.json');
        menuData = await response.json();
        initializeTabs();
    } catch (error) {
        document.getElementById('meal-content').innerHTML = '<p style="color:red; text-align:center;">Failed to load menu data.</p>';
        console.error("Error fetching JSON:", error);
    }
}

// Dynamically create a button for every date found in the JSON
function initializeTabs() {
    const tabsContainer = document.getElementById('date-tabs');
    const availableDates = Object.keys(menuData).sort();

    if (availableDates.length === 0) {
        tabsContainer.innerHTML = '<p style="padding:15px;">No menu data available.</p>';
        return;
    }

    let tabsHtml = '';
    availableDates.forEach(dateKey => {
        // Create a short display name
        const dayName = menuData[dateKey].day.substring(0, 3);
        const shortDate = dateKey.split('-').slice(1).join('/');

        tabsHtml += `
            <button class="tab-btn" id="btn-${dateKey}" onclick="loadMenu('${dateKey}')">
                ${dayName}<br><small>${shortDate}</small>
            </button>
        `;
    });

    tabsContainer.innerHTML = tabsHtml;

    const todayStr = getTodayString();
    if (availableDates.includes(todayStr)) {
        loadMenu(todayStr);
    } else {
        loadMenu(availableDates[0]);
    }
}

// Function to get the current real-world date in YYYY-MM-DD format
function getTodayString() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadMenu(dateKey) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${dateKey}`);
    if (activeBtn) activeBtn.classList.add('active');

    if (activeBtn) activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

    const displayDate = document.getElementById('date-display');
    const content = document.getElementById('meal-content');
    const dailyMenu = menuData[dateKey];

    if (dailyMenu) {
        displayDate.innerText = `${dailyMenu.day}, ${dateKey}`;
        let html = '';

        const blockList = ["NA", "N/A", "N\\A", "NIA", "-", ""];

        for (const [mealName, items] of Object.entries(dailyMenu.meals)) {

            const cleanItems = items.filter(item => {
                const sanitized = item.trim().toUpperCase();
                return sanitized.length > 0 && !blockList.includes(sanitized);
            });

            if (cleanItems.length > 0) {
                html += `
                    <div class="meal-section">
                        <h3>${mealName}</h3>
                        <ul>
                            ${cleanItems.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
        }

        content.innerHTML = html || '<p class="no-data">No meals listed for this day.</p>';
    }
}

fetchMenu();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}

/* =========================================
   SWIPE & TRACKPAD NAVIGATION LOGIC
   ========================================= */

// 1. Target the main content area for swipes
const swipeContainer = document.getElementById('menu-container');

// 2. Variables for Mobile Touch
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const SWIPE_THRESHOLD = 50; // Minimum pixel distance to count as a swipe

// 3. Variables for Laptop Trackpad
let isTrackpadScrolling = false;

// --- MOBILE TOUCH EVENTS ---
swipeContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

swipeContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

// --- LAPTOP TRACKPAD EVENTS ---
swipeContainer.addEventListener('wheel', (e) => {
    // A cooldown prevents one long trackpad swipe from skipping 4 days at once
    if (isTrackpadScrolling) return;

    // Ensure it's mostly a horizontal scroll, not a vertical one
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20) {
        if (e.deltaX > 0) {
            changeDay('next'); // Scrolled Right -> Next Day
        } else {
            changeDay('prev'); // Scrolled Left -> Prev Day
        }

        // Lock the trackpad scroll for half a second
        isTrackpadScrolling = true;
        setTimeout(() => {
            isTrackpadScrolling = false;
        }, 500);
    }
}, { passive: true });

// --- CALCULATE SWIPE DIRECTION ---
function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Check if the swipe was more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX < 0) {
            // Swiped Left (Finger moved Right to Left) -> Next Day
            changeDay('next');
        } else {
            // Swiped Right (Finger moved Left to Right) -> Previous Day
            changeDay('prev');
        }
    }
}

// --- TAB SWITCHING LOGIC ---
function changeDay(direction) {
    // Grab all the tab buttons generated in your HTML
    const tabs = Array.from(document.querySelectorAll('.tab-btn'));
    if (tabs.length === 0) return;

    // Find the currently active tab
    const activeIndex = tabs.findIndex(tab => tab.classList.contains('active'));
    if (activeIndex === -1) return;

    let targetIndex = activeIndex;

    // Determine the next index safely
    if (direction === 'next' && activeIndex < tabs.length - 1) {
        targetIndex = activeIndex + 1;
    } else if (direction === 'prev' && activeIndex > 0) {
        targetIndex = activeIndex - 1;
    }

    // If a new tab is selected, trigger its click event and scroll to it
    if (targetIndex !== activeIndex) {
        tabs[targetIndex].click();

        // Smoothly center the newly selected tab in the top ribbon
        tabs[targetIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
}