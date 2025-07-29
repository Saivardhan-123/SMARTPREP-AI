const apiKey = process.env.OPENAI_API_KEY;

document.addEventListener("DOMContentLoaded", function () {
    const subjectList = document.getElementById("subject-list");

    if (!subjectList) {
        console.error("Error: Element with ID 'subject-list' not found.");
        return;
    }

    fetch("/get-subjects")
        .then(response => response.json())
        .then(data => {
            subjectList.innerHTML = "";
            if (data.subjects && data.subjects.length > 0) {
                data.subjects.forEach(subject => {
                    subject = subject.replace(/^[0-9]+\.\s*/, '').trim(); // Clean up "1. Mathematics"
                    const li = document.createElement("li");
                    li.textContent = subject;
                    li.addEventListener("click", () => fetchTopics(subject)); // Click event to fetch topics
                    subjectList.appendChild(li);
                });
            } else {
                subjectList.innerHTML = "<li>No subjects available.</li>";
            }
        })
        .catch(error => {
            console.error("Error fetching subjects:", error);
            subjectList.innerHTML = "<li>Failed to load subjects.</li>";
        });
});

async function fetchTopics(subject) {
    const state = localStorage.getItem("state");
    const curriculum = localStorage.getItem("curriculum");
    const grade = localStorage.getItem("grade");

    console.log("🔍 Fetching chapters for:", { subject, state, curriculum, grade });

    if (!state || !curriculum || !grade) {
        alert("Missing state, curriculum, or grade. Cannot fetch chapters.");
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:3000/get-topics?state=${encodeURIComponent(state)}&curriculum=${encodeURIComponent(curriculum)}&grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`);

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();

        const chapterDisplay = document.getElementById("chapter-display");
        chapterDisplay.innerHTML = `<h3>Chapters for ${subject}</h3><ul>` +
            data.topics.map(topic => `<li>${topic}</li>`).join("") +
            "</ul>";
    } catch (error) {
        console.error("❌ Error fetching chapters:", error);
    }
}

function displaySubjects(subjects) {
    let tableBody = document.getElementById("subject-table-body");
    tableBody.innerHTML = "";

    subjects.forEach(subject => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${subject.trim()}</td>
            <td>
                <select class="priority-select">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function savePriorities() {
    let selectedPriorities = [];
    let subjects = document.querySelectorAll("#subject-table-body tr");

    subjects.forEach(row => {
        let subject = row.cells[0].textContent;
        let priority = row.cells[1].querySelector(".priority-select").value;
        selectedPriorities.push({ subject, priority });
    });

    console.log("Saved Priorities:", selectedPriorities);
    alert("Priorities saved successfully!");
}

function goBack() {
    window.location.href = "index.html";
}

function generateTimetable() {
    const fromTime = parseInt(document.getElementById("from-time").value); 
    const toTime = parseInt(document.getElementById("to-time").value);

    if (isNaN(fromTime) || isNaN(toTime)) {
        alert("Please enter valid college timings!");
        return;
    }

    const totalDayStart = 6;
    const totalDayEnd = 22;

    const availableTimeSlots = (totalDayEnd - totalDayStart) - (toTime - fromTime);
    if (availableTimeSlots <= 0) {
        alert("No available time left after college!");
        return;
    }

    const subjects = Array.from(document.querySelectorAll(".priority-dropdown"))
        .map(select => ({
            subject: select.dataset.subject,
            priority: select.value ? parseInt(select.value) : 0
        }))
        .filter(subj => subj.priority > 0)
        .sort((a, b) => a.priority - b.priority);

    if (subjects.length === 0) {
        alert("No subjects with priorities assigned!");
        return;
    }

    let totalPriority = subjects.reduce((sum, subj) => sum + subj.priority, 0);
    let subjectTimes = subjects.map(subj => ({
        subject: subj.subject,
        allocatedTime: Math.round((subj.priority / totalPriority) * availableTimeSlots)
    }));

    let timetableHTML = "";
    let currentTime = totalDayStart;

    subjectTimes.forEach(({ subject, allocatedTime }) => {
        for (let i = 0; i < allocatedTime; i++) {
            let hour = currentTime;
            let ampm = hour >= 12 ? "PM" : "AM";
            let displayHour = hour > 12 ? hour - 12 : hour;

            timetableHTML += `<tr><td>${displayHour}:00 ${ampm}</td><td>${subject}</td></tr>`;
            currentTime++;
            if (currentTime === fromTime) currentTime = toTime;
        }
    });

    document.querySelector("#timetable tbody").innerHTML = timetableHTML;
}

document.addEventListener("DOMContentLoaded", () => {
    const button = document.createElement("button");
    button.innerText = "Generate Timetable";
    button.onclick = generateTimetable;
    document.querySelector(".container").appendChild(button);
});
