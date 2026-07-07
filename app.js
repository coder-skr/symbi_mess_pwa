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
    const availableDates = Object.keys(menuData).sort(); // Sort chronologically

    if (availableDates.length === 0) {
        tabsContainer.innerHTML = '<p style="padding:15px;">No menu data available.</p>';
        return;
    }

    let tabsHtml = '';
    availableDates.forEach(dateKey => {
        // Create a short display name (e.g., "Mon" and "07/06")
        const dayName = menuData[dateKey].day.substring(0, 3);
        const shortDate = dateKey.split('-').slice(1).join('/');

        tabsHtml += `
            <button class="tab-btn" id="btn-${dateKey}" onclick="loadMenu('${dateKey}')">
                ${dayName}<br><small>${shortDate}</small>
            </button>
        `;
    });

    tabsContainer.innerHTML = tabsHtml;

    // Figure out which tab to open first (Try today, otherwise default to the first available date)
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

    // NOTE: Uncomment the line below to test it against your PDF's dates (July 2026)
    // date.setFullYear(2026, 6, 6);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Render the selected date's menu
// Render the selected date's menu
function loadMenu(dateKey) {
    // Update active button styling
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${dateKey}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Auto-scroll the tabs so the selected day is visible
    if (activeBtn) activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

    const displayDate = document.getElementById('date-display');
    const content = document.getElementById('meal-content');
    const dailyMenu = menuData[dateKey];

    if (dailyMenu) {
        displayDate.innerText = `${dailyMenu.day}, ${dateKey}`;
        let html = '';

        // Define a list of garbage text we want the UI to completely ignore
        const blockList = ["NA", "N/A", "N\\A", "NIA", "-", ""];

        for (const [mealName, items] of Object.entries(dailyMenu.meals)) {

            // 1. Filter out the junk data before rendering
            const cleanItems = items.filter(item => {
                // Remove extra spaces and make uppercase to catch variations
                const sanitized = item.trim().toUpperCase();
                return sanitized.length > 0 && !blockList.includes(sanitized);
            });

            // 2. Only render the meal section if there are actually valid items left
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

        // If all items were filtered out (e.g., college is closed), show a fallback message
        content.innerHTML = html || '<p class="no-data">No meals listed for this day.</p>';
    }
}

fetchMenu();

// Service Worker Registration for Offline Support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}