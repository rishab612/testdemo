import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, increment, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"; // Add getDoc
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
import { firebaseConfig } from "./firebaseConfig.js";  // Import firebaseConfig from your config file

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

document.addEventListener("DOMContentLoaded", async () => {
    const projectsList = document.querySelector(".projects-list");

    // Function to create a project card element
    const createProjectCard = (project, docId) => {
        const projectCard = document.createElement("div");
        projectCard.classList.add("project-card");

        const linkText = project.link ? `<i class="fas fa-external-link-alt"></i> View on GitHub` : "No link available";
        const linkHref = project.link || "#";

        projectCard.innerHTML = `
            <h3><i class="fas fa-code"></i> ${project.title}</h3>
            <p>${project.description}</p>
            <a href="${linkHref}" target="_blank" class="project-link" ${!project.link ? "style='pointer-events: none; color: gray;'" : ""} data-project-id="${docId}" data-project-title="${project.title}">
                ${linkText}
            </a>
        `;

        // Add event listener to track project link clicks
        const projectLink = projectCard.querySelector(".project-link");
        projectLink.addEventListener('click', async (event) => {
            event.preventDefault();

            logEvent(analytics, 'project_link_click', { project_title: project.title });
            const projectDocRef = doc(db, "projects", docId);

            try {
                await updateDoc(projectDocRef, { click_count: increment(1) });
            } catch (error) {
                console.error("Error updating click count: ", error);
            }

            if (projectLink.href !== "#") {
                window.open(projectLink.href, "_blank");
            }
        });

        return projectCard;
    };

    // Lazy load projects when in view
    const observer = new IntersectionObserver(async (entries, observer) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                try {
                    const querySnapshot = await getDocs(collection(db, "projects"));

                    if (querySnapshot.empty) {
                        projectsList.innerHTML = `<img src="yPMXzPK4h7Jx6FSC9GTs.png" alt="No content available" class="no-content-image">`;
                    } else {
                        querySnapshot.forEach((doc) => {
                            const project = doc.data();
                            const projectCard = createProjectCard(project, doc.id);
                            projectsList.appendChild(projectCard);
                        });
                    }
                    observer.disconnect(); // Disconnect after loading
                } catch (error) {
                    console.error("Error fetching projects: ", error);
                    projectsList.innerHTML = `<img src="i43f9QmvsqFFjQ5N0u1V.jpeg" alt="Error loading content" class="error-image">`;
                }
            }
        }
    });

    // Observe a sentinel element to trigger loading
    const sentinel = document.createElement('div');
    sentinel.classList.add('sentinel');
    projectsList.appendChild(sentinel);
    observer.observe(sentinel);
});

// Go to Top Button functionality
window.onscroll = function() {
    const goToTopBtn = document.getElementById("goToTop");
    // Check if the page is scrolled more than 200px
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        goToTopBtn.classList.add("show");
    } else {
        goToTopBtn.classList.remove("show");
    }
};

// Scroll to the top when the button is clicked
document.getElementById("goToTop").onclick = function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

document.addEventListener('contextmenu', function (e) {
    if (e.target.classList.contains('profile-img')) {
        e.preventDefault();
    }
});

window.addEventListener("load", () => {
    const preloader = document.getElementById("preloader");
    const content = document.getElementById("content");
    const minPreloadTime = 2000;

    if (sessionStorage.getItem("preloaderShown")) {
        preloader.style.display = "none";
        content.style.display = "block";
    } else {
        sessionStorage.setItem("preloaderShown", "true");

        const startTime = Date.now();
        setTimeout(() => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = minPreloadTime - elapsedTime;

            setTimeout(() => {
                preloader.style.display = "none";
                content.style.display = "block";
            }, Math.max(remainingTime, 0));
        }, 0);
    }
});


// Function to fetch marquee message from Firestore
function fetchMarqueeMessage() {
    const marqueeRef = doc(db, 'marqueeMessages', 'message1'); // Reference to Firestore document
    getDoc(marqueeRef).then((snapshot) => {
        if (snapshot.exists()) {
            const message = snapshot.data().message; // Access the 'message' field
            if (message) {
                showMarquee(message); // Call function to show message
            } else {
                console.log("No marquee message found.");
            }
        } else {
            console.log("No data available at the specified path.");
        }
    }).catch((error) => {
        console.error("Error fetching marquee data: ", error);
    });
}

// Function to display the marquee message on the page
function showMarquee(message) {
    const marqueeContainer = document.getElementById('marquee-container');
    if (!marqueeContainer) {
        console.error('Marquee container not found!');
        return;
    }

    marqueeContainer.style.display = 'block'; // Show marquee container

    // Disable horizontal scrollbar when marquee is active
    document.body.classList.add('marquee-active');
    document.documentElement.classList.add('marquee-active');

    const marquee = document.createElement('div');
    marquee.classList.add('marquee');
    marquee.innerHTML = `<div class="marquee-text">${message}</div>`;
    marqueeContainer.appendChild(marquee);

    // Apply the animation duration immediately after appending the message
    const marqueeText = document.querySelector('.marquee-text');
    if (marqueeText) {
        // Set the initial animation duration before the animation starts
        setInitialAnimationDuration(marqueeText);

        // Adjust marquee animation duration based on text width
        adjustMarqueeSpeed();

        // Add resize listener
        window.addEventListener('resize', adjustMarqueeSpeed);
    }
}

// Function to set initial animation duration before animation starts
function setInitialAnimationDuration(marqueeText) {
    const textWidth = marqueeText.offsetWidth; // Get the width of the text
    const containerWidth = marqueeText.parentElement.offsetWidth; // Get the width of the container

    // Use a reasonable base duration for the animation
    const baseDuration = 8;
    const duration = Math.max(baseDuration, (textWidth / containerWidth) * baseDuration); // Adjust duration based on width
    marqueeText.style.animationDuration = `${duration}s`; // Set the calculated duration
}

// Function to adjust the speed of the marquee based on text width
function adjustMarqueeSpeed() {
    const marqueeText = document.querySelector('.marquee-text');
    if (marqueeText) {
        // Ensure that the marquee text is fully rendered before calculating the width
        setTimeout(() => {
            const textWidth = marqueeText.offsetWidth; // Get the width of the text
            const containerWidth = marqueeText.parentElement.offsetWidth; // Get the width of the container

            // Adjust the animation duration based on text width and container width
            const baseDuration = 8; // Base duration in seconds
            const duration = Math.max(baseDuration, (textWidth / containerWidth) * baseDuration); // Adjust duration based on width
            marqueeText.style.animationDuration = `${duration}s`; // Set the calculated duration
        }, 0); // Start immediately (no delay)
    }
}

// Call the function to fetch the message when the page loads
fetchMarqueeMessage();
