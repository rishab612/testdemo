// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { 
    getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let inactivityTimer;
const adminUID = "your_admin_uid"; // Replace with the actual admin UID

// Function to reset the inactivity timer
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        autoLogout();
    }, 3600000); // 1 hour = 3600000 milliseconds
}

// Function to log out the user after inactivity
async function autoLogout() {
    await signOut(auth);
    sessionStorage.clear();
    alert("You have been logged out due to inactivity.");
    location.reload();
}

// Detect user activity to reset inactivity timer
window.addEventListener("mousemove", resetInactivityTimer);
window.addEventListener("keypress", resetInactivityTimer);
window.addEventListener("click", resetInactivityTimer);

// ✅ Secure Login Functionality
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        await showLastLogin(userId); // Fetch and show the last login BEFORE updating it
        await updateLastLogin(userId); // Then update the new login time
        
        alert("Login successful!");
        checkAuthState();
        resetInactivityTimer();
    } catch (error) {
        console.error("Error logging in: ", error);
        alert("Invalid credentials!");
    }
});

// ✅ Fetch & Display Last Login Time BEFORE Updating
async function showLastLogin(userId) {
    const docRef = doc(db, "admin", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        document.getElementById("last-login").innerText = `Last Login: ${docSnap.data().lastLogin || "Not available"}`;
    } else {
        document.getElementById("last-login").innerText = "Last Login: Not available";
    }
}

// ✅ Update Last Login Time AFTER Fetching the Previous One
async function updateLastLogin(userId) {
    const loginTime = new Date().toLocaleString(); // Get current date & time
    await setDoc(doc(db, "admin", userId), { lastLogin: loginTime }, { merge: true });
}

// ✅ Check Authentication State
function checkAuthState() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            document.getElementById("admin-container").style.display = "block";
            document.getElementById("login-container").style.display = "none";
            await showLastLogin(user.uid); // Show the last login time
            loadProjects();
        } else {
            document.getElementById("admin-container").style.display = "none";
            document.getElementById("login-container").style.display = "block";
        }
    });
}

// ✅ Secure Logout
document.getElementById("logout-btn").addEventListener("click", async () => {
    await signOut(auth);
    sessionStorage.clear();
    alert("Logged out successfully!");
});

// ✅ Secure Add Project
document.getElementById("project-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const link = document.getElementById("link").value.trim();

    try {
        await addDoc(collection(db, "projects"), { title, description, link });
        alert("Project added successfully!");
        document.getElementById("project-form").reset();
        loadProjects();
    } catch (error) {
        console.error("Error adding project:", error);
    }
});

// ✅ Load Projects from Firestore in a Table Format
async function loadProjects() {
    const projectsList = document.getElementById("projects-list");
    projectsList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Link</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="projects-table-body"></tbody>
        </table>
    `;

    const tableBody = document.getElementById("projects-table-body");
    const querySnapshot = await getDocs(collection(db, "projects"));

    querySnapshot.forEach((doc) => {
        const project = doc.data();
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${project.title}</td>
            <td>${project.description}</td>
            <td><a href="${project.link}" target="_blank">View</a></td>
            <td>
                <button class="edit-btn" data-id="${doc.id}">Edit</button>
                <button class="delete-btn" data-id="${doc.id}">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // ✅ Delete Project
    document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", async () => {
            const projectId = button.getAttribute("data-id");
            if (confirm("Are you sure you want to delete this project?")) {
                await deleteDoc(doc(db, "projects", projectId));
                alert("Project deleted successfully!");
                loadProjects();
            }
        });
    });

    // ✅ Edit Project
    document.querySelectorAll(".edit-btn").forEach((button) => {
        button.addEventListener("click", async () => {
            const projectId = button.getAttribute("data-id");
            const title = prompt("Edit Title", "");
            const description = prompt("Edit Description", "");
            const link = prompt("Edit Link", "");

            if (title && description && link) {
                await updateDoc(doc(db, "projects", projectId), { title, description, link });
                alert("Project updated successfully!");
                loadProjects();
            } else {
                alert("Invalid input detected!");
            }
        });
    });
}

// Function to check if the device is mobile
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
}

// Restrict access if it's a mobile device
if (isMobileDevice()) {
    document.body.innerHTML = "<h2>Access Denied: This panel is only accessible from a desktop.</h2>";
    throw new Error("Access Denied: Mobile access is restricted.");
    window.location.href = "https://codelevate.netlify.app/"; 
}



checkAuthState();
