import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  increment,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getAnalytics,
  logEvent,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

document.addEventListener("DOMContentLoaded", async () => {
  const projectsList = document.querySelector(".projects-list");

  document.querySelector(".menu-toggle").addEventListener("click", () => {
    document.querySelector(".navbar ul").classList.toggle("active");
});

 window.addEventListener('scroll', function() {
            const scrollTop = document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / scrollHeight) * 100;
            
            const progressBar = document.querySelector('.progress-bar');
            progressBar.style.width = scrollPercent + '%';
        });
  // Function to create a project card element
  const createProjectCard = (project, docId) => {
    const projectCard = document.createElement("div");
    projectCard.classList.add("project-card");

    const linkText = project.link
      ? `<i class="fas fa-external-link-alt"></i> View on GitHub`
      : "No link available";
    const linkHref = project.link || "#";

    projectCard.innerHTML = `
            <h3><i class="fas fa-code"></i> ${project.title}</h3>
            <p>${project.description}</p>
            <a href="${linkHref}" target="_blank" class="project-link" ${
      !project.link ? "style='pointer-events: none; color: gray;'" : ""
    } data-project-id="${docId}" data-project-title="${project.title}">
                ${linkText}
            </a>
        `;

        
    // Add event listener to track project link clicks
    const projectLink = projectCard.querySelector(".project-link");
    projectLink.addEventListener("click", async (event) => {
      event.preventDefault();

      logEvent(analytics, "project_link_click", {
        project_title: project.title,
      });
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
          observer.disconnect();
        } catch (error) {
          console.error("Error fetching projects: ", error);
          projectsList.innerHTML = `<img src="i43f9QmvsqFFjQ5N0u1V.jpeg" alt="Error loading content" class="error-image">`;
        }
      }
    }
  });

  // Observe a sentinel element to trigger loading
  const sentinel = document.createElement("div");
  sentinel.classList.add("sentinel");
  projectsList.appendChild(sentinel);
  observer.observe(sentinel);
});

// Go to Top Button functionality
window.onscroll = function () {
  const goToTopBtn = document.getElementById("goToTop");
  if (
    document.body.scrollTop > 200 ||
    document.documentElement.scrollTop > 200
  ) {
    goToTopBtn.classList.add("show");
  } else {
    goToTopBtn.classList.remove("show");
  }
};

// Scroll to the top when the button is clicked
document.getElementById("goToTop").onclick = function () {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

document.addEventListener("contextmenu", function (e) {
  if (e.target.classList.contains("profile-img")) {
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
  const marqueeRef = doc(db, "marqueeMessages", "message1");
  getDoc(marqueeRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const message = snapshot.data().message;
        if (message) {
          showMarquee(message);
        } else {
          console.log("No marquee message found.");
        }
      } else {
        console.log("No data available at the specified path.");
      }
    })
    .catch((error) => {
      console.error("Error fetching marquee data: ", error);
    });
}


function showMarquee(message) {
  const marqueeContainer = document.getElementById("marquee-container");
  if (!marqueeContainer) {
    console.error("Marquee container not found!");
    return;
  }

  marqueeContainer.style.display = "block";
  document.body.classList.add("marquee-active");
  document.documentElement.classList.add("marquee-active");

  const marquee = document.createElement("div");
  marquee.classList.add("marquee");
  marquee.innerHTML = `<div class="marquee-text">${message}</div>`;
  marqueeContainer.appendChild(marquee);

  const marqueeText = document.querySelector(".marquee-text");
  if (marqueeText) {
    setInitialAnimationDuration(marqueeText);

    adjustMarqueeSpeed();

    window.addEventListener("resize", adjustMarqueeSpeed);
  }
}

// Function to set initial animation duration before animation starts
function setInitialAnimationDuration(marqueeText) {
  const textWidth = marqueeText.offsetWidth;
  const containerWidth = marqueeText.parentElement.offsetWidth;

  const baseDuration = 8;
  const duration = Math.max(
    baseDuration,
    (textWidth / containerWidth) * baseDuration
  ); 
  marqueeText.style.animationDuration = `${duration}s`; 
}

// Function to adjust the speed of the marquee based on text width
function adjustMarqueeSpeed() {
  const marqueeText = document.querySelector(".marquee-text");
  if (marqueeText) {
    setTimeout(() => {
      const textWidth = marqueeText.offsetWidth;
      const containerWidth = marqueeText.parentElement.offsetWidth;

      const baseDuration = 8;
      const duration = Math.max(
        baseDuration,
        (textWidth / containerWidth) * baseDuration
      ); 
      marqueeText.style.animationDuration = `${duration}s`; 
    }, 0);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const projectsList = document.querySelector(".projects-list");
  
  const searchContainer = document.createElement("div");
  searchContainer.classList.add("search-container");
  
  const searchInput = document.createElement("input");
  searchInput.setAttribute("type", "text");
  searchInput.setAttribute("placeholder", "Search projects Beta Test...");
  searchInput.classList.add("search-box");
  
  const searchButton = document.createElement("button");
  searchButton.innerText = "Search";
  searchButton.classList.add("search-button");
  
  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(searchButton);
  
  const categoryFilter = document.createElement("select");
  categoryFilter.classList.add("category-filter");
  categoryFilter.innerHTML = `
    <option value="all">All Categories</option>
    <option value="web">Web Development</option>
    <option value="mobile">Mobile Apps</option>
    <option value="ai">AI & ML</option>
    <option value="other">Other</option>
  `;
  
  const filterContainer = document.createElement("div");
  filterContainer.classList.add("filter-container");
  filterContainer.appendChild(searchContainer);
  filterContainer.appendChild(categoryFilter);
  document.querySelector(".projects").insertBefore(filterContainer, projectsList);
  
  let projects = [];
  
  const fetchProjects = async () => {
    const querySnapshot = await getDocs(collection(db, "projects"));
    projects = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderProjects(projects);
  };
  
  const renderProjects = (filteredProjects) => {
    projectsList.innerHTML = "";
    if (filteredProjects.length === 0) {
      if (!document.querySelector(".no-results-image")) {
        const noResultsImg = document.createElement("img");
        noResultsImg.src = "yPMXzPK4h7Jx6FSC9GTs.png";
        noResultsImg.alt = "No results found";
        noResultsImg.classList.add("no-results-image");
        projectsList.appendChild(noResultsImg);
      }
    } else {
      filteredProjects.forEach((project) => {
        const projectCard = document.createElement("div");
        projectCard.classList.add("project-card");
        projectCard.setAttribute("data-category", project.category);
        projectCard.innerHTML = `
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <a href="${project.link}" target="_blank" class="project-link">View on GitHub</a>
        `;
        projectsList.appendChild(projectCard);
      });
    }
  };
  
  
  searchButton.addEventListener("click", () => {
    const searchText = searchInput.value.toLowerCase();
    const filteredProjects = projects.filter((project) =>
      project.title.toLowerCase().includes(searchText) ||
      project.description.toLowerCase().includes(searchText)
    );
    renderProjects(filteredProjects);
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchButton.click();
    }
  });
  
  categoryFilter.addEventListener("change", () => {
    const selectedCategory = categoryFilter.value;
    const filteredProjects = selectedCategory === "all"
      ? projects
      : projects.filter((project) => project.category === selectedCategory);
    renderProjects(filteredProjects);
  });
  
  await fetchProjects();
  
});

fetchMarqueeMessage();

