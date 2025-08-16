let currentSubject = "";
let currentTopic = "";
let currentChapterText = "";

let currentState = localStorage.getItem("state") || "";
let currentCurriculum = localStorage.getItem("curriculum") || "";
let currentGrade = localStorage.getItem("grade") || "";

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM fully loaded.");

    // Initialize for topic-view.html
    if (window.location.pathname.includes('topic-view.html')) {
        currentSubject = localStorage.getItem('currentSubject');
        currentTopic = localStorage.getItem('currentTopic');
        currentChapterText = localStorage.getItem('currentChapterText');
        currentState = localStorage.getItem('state');
        currentCurriculum = localStorage.getItem('curriculum');
        currentGrade = localStorage.getItem('grade');
    }

    // Display timetable if on timetable.html
    if (window.location.pathname.includes('timetable.html')) {
        const timeSlots = JSON.parse(localStorage.getItem('timeSlots') || '[]');
        if (timeSlots.length > 0) {
            displayTimetable(timeSlots);
        } else {
            console.log("❌ No time slots found.");
        }
    }
});

async function generateSummary() {
    try {
        // Get all required data
        const data = {
            subject: localStorage.getItem('currentSubject'),
            topic: localStorage.getItem('currentTopic'),
            chapterText: localStorage.getItem('currentChapterText'),
            numPoints: parseInt(localStorage.getItem('numSummary')) || 5
        };

        // Validate data
        if (!data.subject || !data.topic || !data.chapterText) {
            throw new Error("Missing required data. Please select a topic first.");
        }

        if (!data.numPoints || data.numPoints < 1) {
            throw new Error("Please enter a valid number of summary points.");
        }

        // Show loading state
        const container = document.getElementById("summary-container");
        if (container) {
            container.innerHTML = '<div class="loading-message">Generating Summary...</div>';
        }

        // Log data in a more readable format
        console.log("📤 Generating summary with data:", {
            subject: data.subject,
            topic: data.topic,
            numPoints: data.numPoints,
            chapterTextPreview: data.chapterText.substring(0, 100) + "..."
        });

        const response = await fetch("https://smartprep-ai-work.onrender.com/api/generate-summary"
, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: data.chapterText,
                numPoints: data.numPoints,
                topic: data.topic,
                subject: data.subject
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to generate summary");
        }

        const responseData = await response.json();
        console.log("✅ Received summary response:", {
            summaryPreview: responseData.summary.substring(0, 100) + "..."
        });

        if (!responseData.summary) {
            throw new Error("No summary received from the server");
        }

        // Display the summary
        if (container) {
            // Add the page-content visible class
            document.querySelector('.page-content').classList.add('visible');
            
            // Set the container content
            container.innerHTML = `<h2>Summary for ${data.subject} - ${data.topic}</h2>`;
            
            // Process and display the summary points
            const bulletPoints = responseData.summary
                .split('\n')
                .filter(line => line.trim() !== '')
                .map(point => point.trim());
            
            bulletPoints.forEach(point => {
                const div = document.createElement("div");
                div.className = 'summary-point';
                // Remove any numbering and clean up the point
                const cleanPoint = point.replace(/^\d+[\.\)]\s*/, '').trim();
                div.textContent = cleanPoint;
                container.appendChild(div);
            });
        }

    } catch (error) {
        console.error("❌ Error generating summary:", error);
        const container = document.getElementById("summary-container");
        if (container) {
            container.innerHTML = `<p class="error-message">${error.message || 'Failed to generate summary. Please try again.'}</p>`;
        }
    }
}

async function handleTopicClick(topic, subject) {
    try {
        console.log("🔍 Starting content fetch for:", { topic, subject });
        
        const state = localStorage.getItem("state");
        const curriculum = localStorage.getItem("curriculum");
        const grade = localStorage.getItem("grade");

        // Validate required data
        if (!state || !curriculum || !grade) {
            throw new Error("Missing required data (state, curriculum, or grade)");
        }

        // Show loading state
        const transition = document.getElementById('pageTransition');
        if (transition) {
            transition.style.display = 'flex';
            transition.classList.add('active');
            transition.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading content for ${subject} - ${topic}...</div>
            `;
        }

        // First check if server is available
        try {
            const healthCheck = await fetch("https://smartprep-ai-work.onrender.com/health"
);
            if (!healthCheck.ok) {
                throw new Error("Server is not responding properly");
            }
        } catch (error) {
            console.error("❌ Server health check failed:", error);
            throw new Error("Server is not available. Please ensure the server is running and try again.");
        }

        // First store the subject and topic
        localStorage.setItem('currentSubject', subject);
        localStorage.setItem('currentTopic', topic);

        console.log("✅ Stored initial data:", {
            subject: localStorage.getItem('currentSubject'),
            topic: localStorage.getItem('currentTopic')
        });

        // Then fetch the content
        let response;
        try {
            response = await fetch("https://smartprep-ai-work.onrender.com/api/get-chapter-content"
, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    topic, 
                    subject,
                    state, 
                    curriculum, 
                    grade 
                })
            });
        } catch (error) {
            console.error("❌ Network error:", error);
            throw new Error("Failed to connect to server. Please check your internet connection and try again.");
        }

        // Check for non-JSON responses
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            console.error("❌ Invalid response type:", contentType);
            throw new Error("Server returned invalid response type. Please ensure the server is running correctly.");
        }

        if (!response.ok) {
            let errorMessage = "Failed to fetch content";
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || `${response.status} ${response.statusText}`;
            } catch (e) {
                console.error("❌ Error parsing error response:", e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (!data.content) {
            throw new Error("No content received from server");
        }

        // Store the chapter content
        localStorage.setItem('currentChapterText', data.content);

        // Verify all required data is stored
        const verification = {
            subject: localStorage.getItem('currentSubject'),
            topic: localStorage.getItem('currentTopic'),
            chapterText: localStorage.getItem('currentChapterText'),
            state: localStorage.getItem('state'),
            curriculum: localStorage.getItem('curriculum'),
            grade: localStorage.getItem('grade')
        };

        console.log("📝 Data verification after storage:", {
            subject: {
                value: verification.subject,
                exists: !!verification.subject
            },
            topic: {
                value: verification.topic,
                exists: !!verification.topic
            },
            chapterText: {
                exists: !!verification.chapterText,
                length: verification.chapterText?.length || 0,
                preview: verification.chapterText ? verification.chapterText.substring(0, 50) + "..." : null
            },
            state: {
                value: verification.state,
                exists: !!verification.state
            },
            curriculum: {
                value: verification.curriculum,
                exists: !!verification.curriculum
            },
            grade: {
                value: verification.grade,
                exists: !!verification.grade
            }
        });

        // Check if any data is missing
        const missingData = Object.entries(verification)
            .filter(([key, value]) => !value)
            .map(([key]) => key);

        if (missingData.length > 0) {
            throw new Error(`Failed to store required data: ${missingData.join(', ')}`);
        }

        // Navigate to topic view page
        window.location.href = 'topic-view.html';

    } catch (error) {
        console.error("❌ Error in handleTopicClick:", error);
        
        // Clear any partially stored data
        localStorage.removeItem('currentChapterText');
        localStorage.removeItem('currentSubject');
        localStorage.removeItem('currentTopic');
        
        // Hide loading state
        const transition = document.getElementById('pageTransition');
        if (transition) {
            transition.classList.remove('active');
            transition.style.display = 'none';
        }
        
        // Show a more user-friendly error message
        const errorMessage = error.message.includes("Server")
            ? error.message
            : "Failed to load topic content. Please try again.";
            
        alert(`${errorMessage}\n\nIf this error persists, please:\n1. Ensure the server is running\n2. Try refreshing the page\n3. Clear your browser data`);
    }
}

async function generateMCQs() {
    try {
        // Get all required data
        const data = {
            subject: localStorage.getItem('currentSubject'),
            topic: localStorage.getItem('currentTopic'),
            state: localStorage.getItem('state'),
            curriculum: localStorage.getItem('curriculum'),
            grade: localStorage.getItem('grade'),
            chapterText: localStorage.getItem('currentChapterText'),
            numQuestions: parseInt(localStorage.getItem('numQuestions')) || 5
        };

        // Debug log each piece of data
        console.log("🔍 MCQ Generation Data Check:", {
            subject: {
                value: data.subject,
                exists: !!data.subject
            },
            topic: {
                value: data.topic,
                exists: !!data.topic
            },
            chapterText: {
                exists: !!data.chapterText,
                length: data.chapterText?.length || 0,
                preview: data.chapterText ? data.chapterText.substring(0, 50) + "..." : "null"
            },
            state: {
                value: data.state,
                exists: !!data.state
            },
            curriculum: {
                value: data.curriculum,
                exists: !!data.curriculum
            },
            grade: {
                value: data.grade,
                exists: !!data.grade
            },
            numQuestions: {
                value: data.numQuestions,
                isValid: !isNaN(data.numQuestions) && data.numQuestions > 0
            }
        });

        // Validate all required data
        const missingFields = [];
        if (!data.subject) missingFields.push('subject');
        if (!data.topic) missingFields.push('topic');
        if (!data.chapterText) missingFields.push('chapter content');
        if (!data.state) missingFields.push('state');
        if (!data.curriculum) missingFields.push('curriculum');
        if (!data.grade) missingFields.push('grade');

        if (missingFields.length > 0) {
            throw new Error(`Missing required data: ${missingFields.join(', ')}. Please ensure all data is properly selected and try again.`);
        }

        // Show loading state
        const container = document.getElementById("mcq-container");
        if (container) {
            container.innerHTML = `
                <div class="loading-message">
                    <div class="loading-spinner"></div>
                    <p>Generating ${data.numQuestions} MCQs for ${data.subject} - ${data.topic}...</p>
                    <p class="loading-info">This may take a few moments. Please wait...</p>
                </div>`;
        }

        // Make API call with all required data
        const response = await fetch('https://smartprep-ai-work.onrender.com/api/generate-mcq'
, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subject: data.subject,
                topic: data.topic,
                state: data.state,
                curriculum: data.curriculum,
                grade: data.grade,
                numQuestions: data.numQuestions,
                content: data.chapterText // Make sure to send the content
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate MCQs');
        }

        const mcqData = await response.json();
        
        console.log("✅ Raw MCQ API Response:", mcqData);

        if (!mcqData || !mcqData.questions) {
            throw new Error('No questions were generated. Please try again.');
        }

        // Parse the questions string into an array of question objects
        const questionsArray = mcqData.questions.split('\n\n')
            .filter(q => q.trim())
            .map((questionBlock, idx) => { // Added idx for logging
                const lines = questionBlock.split('\n');
                const questionText = lines[0].replace(/^\d+[\.\)]?\s*/, '').trim();
                const options = lines.slice(1, 5).map(opt => opt.trim());
                const correctAnswerText = options.find(opt => opt.includes('✓'))?.replace(' ✓', '') || options[0];
                
                const parsedQuestion = {
                    question: questionText,
                    options: options.map(opt => opt.replace(' ✓', '')),
                    correctAnswer: correctAnswerText
                };
                console.log(`🔍 Parsed Question #${idx + 1}:`, JSON.stringify(parsedQuestion)); // Added logging
                if (!questionText || questionText.trim() === "") { // Added check for empty/whitespace question
                    console.warn(`⚠️ Question #${idx + 1} text is empty or whitespace. Original block line 0: "${lines[0]}"`);
                }
                return parsedQuestion;
            });
            
        console.log("✅ Parsed Questions Array:", questionsArray);

        // Display MCQs
        container.innerHTML = `
            <h2>${data.subject} - ${data.topic}</h2>
            ${questionsArray.map((question, index) => `
                <div class="mcq-question" style="animation-delay: ${index * 0.2}s">
                    <div class="question-text">Q${index + 1}. ${question.question || '[No Question Text Found]'}</div>
                    <div class="options-container">
                        ${question.options.map((option, optIndex) => `
                            <div class="option-item">
                                <span>${String.fromCharCode(65 + optIndex)}. ${option}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="correct-answer-container">
                        <div class="flip-card" onclick="this.classList.toggle('flipped')">
                            <div class="flip-front">Show Answer</div>
                            <div class="flip-back">Answer: ${String.fromCharCode(65 + question.options.indexOf(question.correctAnswer))}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;

    } catch (error) {
        console.error("❌ Error in generateMCQs:", error);
        const container = document.getElementById('mcq-container');
        container.innerHTML = `
            <div class="error-message">
                <p>${error.message || 'Failed to generate MCQs'}</p>
                <p class="error-details">If this error persists, try clearing your browser data and refreshing the page.</p>
                <button onclick="window.location.reload()" class="retry-button">Try Again</button>
            </div>
        `;
    }
}

// Add this new function
async function fetchAndRedirect() {
    const state = document.getElementById("state").value;
    const curriculum = document.getElementById("curriculum").value;
    const grade = document.getElementById("grade").value;

    localStorage.setItem("state", state);
    localStorage.setItem("curriculum", curriculum);
    localStorage.setItem("grade", grade);

    try {
        const response = await fetch(`https://smartprep-ai-work.onrender.com/get-subjects?state=${state}&curriculum=${curriculum}&grade=${grade}
`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        localStorage.setItem("subjects", JSON.stringify(data.subjects));
        
        // Redirect to loading page instead of directly to timetable-setup
        window.location.href = 'loading.html';
    } catch (error) {
        console.error("❌ Error fetching subjects:", error);
        alert("Failed to fetch subjects. Please try again.");
    }
}

// Update the existing code to check current page
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes("timetable-setup.html")) {
        const subjects = JSON.parse(localStorage.getItem("subjects") || "[]");
        displaySubjects(subjects);
    }
});


async function fetchSubjects() {
    const state = document.getElementById("state").value;
    const curriculum = document.getElementById("curriculum").value;
    const grade = document.getElementById("grade").value;

    localStorage.setItem("state", state);
    localStorage.setItem("curriculum", curriculum);
    localStorage.setItem("grade", grade);

    console.log("📌 Fetching Subjects with:", { state, curriculum, grade });

    try {
        const response = await fetch(`https://smartprep-ai-work.onrender.com/get-subjects?state=${state}&curriculum=${curriculum}&grade=${grade}
`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        const subjects = data.subjects;

        console.log(`✅ Fetched ${subjects.length} subjects.`);
        displaySubjects(subjects);

        sessionStorage.setItem("totalSubjects", subjects.length);
    } catch (error) {
        console.error("❌ Error fetching subjects:", error);
    }
}

function displaySubjects(subjects) {
    const container = document.getElementById("subject-container");
    container.innerHTML = "";

    subjects.forEach(subject => {
        const div = document.createElement("div");
        div.innerHTML = `
            <input type="checkbox" class="subject-checkbox" onchange="togglePriorityInput(this)">
            <label>${subject}</label>
            <input type="number" class="priority" min="1" max="10" value="1" style="display: none;">
        `;
        container.appendChild(div);
    });
}

function togglePriorityInput(checkbox) {
    const priorityInput = checkbox.nextElementSibling.nextElementSibling;
    priorityInput.style.display = checkbox.checked ? "inline-block" : "none";
}

function generateTimetable() {
    try {
        const subjects = document.querySelectorAll("#subject-container div");
        const selectedSubjects = [];

        // Get school timings
        const schoolStart = document.getElementById("college-start-time").value || "09:00";
        const schoolEnd = document.getElementById("college-end-time").value || "17:00";

        console.log("School timings:", { schoolStart, schoolEnd });

        // Collect selected subjects and their priorities
        subjects.forEach(subjectDiv => {
            const checkbox = subjectDiv.querySelector(".subject-checkbox");
            if (checkbox.checked) {
                const subjectName = subjectDiv.querySelector("label").innerText;
                const priorityInput = subjectDiv.querySelector(".priority");
                const priorityValue = parseInt(priorityInput.value, 10);
                selectedSubjects.push({
                    subject: subjectName,
                    priority: priorityValue
                });
            }
        });

        console.log("Selected subjects:", selectedSubjects);

        if (selectedSubjects.length === 0) {
            alert("Please select at least one subject!");
            return;
        }

        // Sort subjects by priority (1 is highest)
        selectedSubjects.sort((a, b) => a.priority - b.priority);
        console.log("Sorted subjects by priority:", selectedSubjects);

        // Generate time slots
        const timeSlots = generateTimeSlots(selectedSubjects, schoolStart, schoolEnd);
        console.log("Generated time slots:", timeSlots);

        // Store and display the timetable
        localStorage.setItem("timeSlots", JSON.stringify(timeSlots));
        window.open("timetable.html", "_blank");

    } catch (error) {
        console.error("Error generating timetable:", error);
        alert("Error generating timetable. Please try again.");
    }
}

function generateTimeSlots(subjects, schoolStart, schoolEnd) {
    // Define fixed times
    const dayStart = "05:00";
    const dayEnd = "23:00";  // 11:00 PM
    
    // Calculate study times
    const beforeSchoolStart = addMinutes(schoolStart, -30);
    const afterSchoolEnd = addMinutes(schoolEnd, 30);

    // Define meal times
    const meals = [
        { time: addMinutes(schoolStart, -30), duration: 30, label: "Breakfast" },
        { time: afterSchoolEnd, duration: 30, label: "Evening Snacks" },
        { time: "20:00", duration: 45, label: "Dinner" }
    ];

    let slots = [];

    // Add meal slots first
    meals.forEach(meal => {
        slots.push({
            from: meal.time,
            to: addMinutes(meal.time, meal.duration),
            subject: meal.label,
            isMeal: true
        });
    });

    // Sort subjects by priority (1 is highest)
    subjects.sort((a, b) => a.priority - b.priority);

    // Define study periods
    const studyPeriods = [
        {
            start: dayStart,
            end: beforeSchoolStart,
            label: "Early Morning"
        },
        {
            start: addMinutes(afterSchoolEnd, 30),
            end: "20:00",
            label: "Evening"
        },
        {
            start: "20:45",
            end: dayEnd,
            label: "Night"
        }
    ];

    // Function to check if a time slot is available
    const isSlotAvailable = (start, end) => {
        // Check for meal conflicts
        const mealConflict = meals.some(meal => 
            isTimeOverlap(start, end, meal.time, addMinutes(meal.time, meal.duration))
        );
        
        // Check for existing slot conflicts
        const slotConflict = slots.some(slot => 
            isTimeOverlap(start, end, slot.from, slot.to)
        );

        // Check for school hours conflict
        const schoolConflict = isTimeOverlap(start, end, schoolStart, schoolEnd);

        return !mealConflict && !slotConflict && !schoolConflict;
    };

    // Function to get next available time in a period
    const getNextAvailableTime = (currentTime, endTime) => {
        while (currentTime < endTime) {
            const slotEnd = addMinutes(currentTime, 45); // 45-minute slots
            if (isSlotAvailable(currentTime, slotEnd)) {
                return currentTime;
            }
            currentTime = addMinutes(currentTime, 15);
        }
        return null;
    };

    // Distribute subjects across available time slots
    let subjectIndex = 0;
    let remainingSubjects = [...subjects];

    // First pass: Fill all periods with at least one slot per subject
    studyPeriods.forEach(period => {
        let currentTime = period.start;
        
        while (currentTime < period.end && remainingSubjects.length > 0) {
            const nextTime = getNextAvailableTime(currentTime, period.end);
            if (!nextTime) break;

            const subject = remainingSubjects[0];
            const slotEnd = addMinutes(nextTime, 45);

            slots.push({
                from: nextTime,
                to: slotEnd,
                subject: subject.subject,
                priority: subject.priority
            });

            remainingSubjects = remainingSubjects.slice(1);
            currentTime = addMinutes(slotEnd, 15); // 15-minute break
        }
    });

    // Second pass: Fill remaining time slots
    studyPeriods.forEach(period => {
        let currentTime = period.start;
        
        while (currentTime < period.end) {
            const nextTime = getNextAvailableTime(currentTime, period.end);
            if (!nextTime) {
                currentTime = addMinutes(currentTime, 15);
                continue;
            }

            const subject = subjects[subjectIndex % subjects.length];
            const slotEnd = addMinutes(nextTime, 45);

            slots.push({
                from: nextTime,
                to: slotEnd,
                subject: subject.subject,
                priority: subject.priority
            });

            subjectIndex++;
            currentTime = addMinutes(slotEnd, 15); // 15-minute break
        }
    });

    // Sort all slots by time
    slots.sort((a, b) => {
        const timeA = a.from.split(':').map(Number);
        const timeB = b.from.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    // Log the distribution of subjects
    console.log("Subject distribution in timetable:");
    subjects.forEach(subject => {
        const count = slots.filter(slot => slot.subject === subject.subject).length;
        console.log(`${subject.subject} (Priority ${subject.priority}): ${count} slot(s)`);
    });

    return slots;
}

function isTimeOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
}

function getMinutesBetween(start, end) {
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

function addMinutes(time, minutes) {
    let [hours, mins] = time.split(':').map(Number);
    let totalMins = hours * 60 + mins + minutes;
    let newHours = Math.floor(totalMins / 60);
    let newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

function formatTime(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

function displayTimetable(slots) {
    console.log("📅 Displaying timetable with slots:", slots);
    const container = document.getElementById('timetable-container');
    if (!container) {
        console.error("❌ Timetable container not found");
        return;
    }

    // Create timetable structure
    const table = document.createElement('table');
    table.className = 'timetable';

    // Create header row
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>FROM</th>
        <th>TO</th>
        <th>SUBJECT</th>
    `;
    table.appendChild(headerRow);

    // Add rows for each time slot
    slots.forEach(slot => {
        const row = document.createElement('tr');
        
        // From time
        const fromCell = document.createElement('td');
        fromCell.className = 'time-cell';
        fromCell.textContent = formatTime(slot.from);
        
        // To time
        const toCell = document.createElement('td');
        toCell.className = 'time-cell';
        toCell.textContent = formatTime(slot.to);
        
        // Subject/Activity cell
        const subjectCell = document.createElement('td');
        
        if (slot.isMeal) {
            subjectCell.className = 'meal-cell';
            subjectCell.innerHTML = `🍽️ ${slot.subject}`;
        } else {
            subjectCell.className = 'subject-cell';
            if (slot.subject) {
                const subjectLink = document.createElement('span');
                subjectLink.className = 'clickable-subject';
                subjectLink.innerHTML = `${slot.subject} <span class="priority-indicator">Priority ${slot.priority}</span>`;
                
                // Add click handler
                subjectLink.onclick = async () => {
                    console.log("🔍 Subject clicked:", slot.subject);
                    try {
                        // Clear any existing data first
                        localStorage.removeItem('currentChapterText');
                        localStorage.removeItem('currentSubject');
                        localStorage.removeItem('currentTopic');
                        localStorage.removeItem('currentTopics');
                        
                        // Store the subject
                        localStorage.setItem('currentSubject', slot.subject);
                        console.log("✅ Stored current subject:", slot.subject);
                        
                        // Show loading state
                        const loadingDiv = document.createElement('div');
                        loadingDiv.className = 'loading-overlay';
                        loadingDiv.innerHTML = `
                            <div class="loading-spinner"></div>
                            <div class="loading-text">Loading topics for ${slot.subject}...</div>
                        `;
                        document.body.appendChild(loadingDiv);
                        
                        // Fetch topics for this subject
                        await fetchTopics(slot.subject);
                        
                        // Remove loading overlay
                        document.body.removeChild(loadingDiv);
                        
                    } catch (error) {
                        console.error("❌ Error handling subject click:", error);
                        alert("Failed to load subject topics. Please try again.");
                    }
                };
                subjectCell.appendChild(subjectLink);
            } else {
                subjectCell.textContent = 'Break';
                subjectCell.classList.add('break-cell');
            }
        }
        
        row.appendChild(fromCell);
        row.appendChild(toCell);
        row.appendChild(subjectCell);
        table.appendChild(row);
    });

    // Clear and update container
    container.innerHTML = '';
    container.appendChild(table);

    // Add back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = 'Back to Setup';
    backButton.onclick = () => {
        window.location.href = 'timetable-setup.html';
    };
    container.appendChild(backButton);

    // Add loading overlay styles if not already present
    if (!document.querySelector('#loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            .loading-spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            }
            .loading-text {
                color: #2c3e50;
                font-size: 1.2em;
                text-align: center;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Log the schedule details
    console.log("📊 Schedule Summary:");
    console.log("Total slots:", slots.length);
    console.log("Time range:", formatTime(slots[0].from), "to", formatTime(slots[slots.length - 1].to));
    
    // Count study slots vs breaks/meals
    const studySlots = slots.filter(slot => !slot.isMeal && slot.subject && slot.subject !== 'Break').length;
    const mealSlots = slots.filter(slot => slot.isMeal).length;
    console.log("Study slots:", studySlots);
    console.log("Meal breaks:", mealSlots);
}

async function fetchTopics(subject) {
    try {
        console.log("📚 Starting topic fetch for:", subject);
        
        // Store the subject immediately
        localStorage.setItem('currentSubject', subject);
        console.log("✅ Stored current subject:", subject);
        
        // Clear any existing topics data
        localStorage.removeItem('currentTopics');
        localStorage.removeItem('currentChapterText');
        localStorage.removeItem('currentTopic');
        
        const state = localStorage.getItem("state");
        const curriculum = localStorage.getItem("curriculum");
        const grade = localStorage.getItem("grade");

        if (!state || !curriculum || !grade || !subject) {
            throw new Error(`Missing required data: ${!state ? 'state' : !curriculum ? 'curriculum' : !grade ? 'grade' : 'subject'}`);
        }

        console.log("🌐 Fetching from API with:", { state, curriculum, grade, subject });

        const response = await fetch(`https://smartprep-ai-work.onrender.com/get-topics?${new URLSearchParams({
    state, curriculum, grade, subject
})}
`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("📦 Received topics data:", data);

        if (!data || !data.topics || !Array.isArray(data.topics)) {
            throw new Error("Invalid data format received from server");
        }

        if (data.topics.length === 0) {
            throw new Error("No topics available for this subject");
        }

        // Store the topics data
        localStorage.setItem('currentTopics', JSON.stringify(data.topics));
        
        // Verify storage
        const storedTopics = localStorage.getItem('currentTopics');
        const parsedTopics = JSON.parse(storedTopics || 'null');
        
        if (!parsedTopics || !Array.isArray(parsedTopics) || parsedTopics.length === 0) {
            throw new Error("Failed to store topics data");
        }

        console.log("✅ Topics data stored successfully:", {
            topicsCount: parsedTopics.length,
            firstTopic: parsedTopics[0],
            subject: subject
        });

        // Navigate to topics page
        window.location.href = 'topics.html';

    } catch (error) {
        console.error("❌ Error in fetchTopics:", error);
        // Clear subject if we failed to fetch topics
        localStorage.removeItem('currentSubject');
        throw error;
    }
}

// Function to initialize topics page
function initializeTopicsPage() {
    try {
        console.log("🔍 Initializing topics page...");
        
        // Hide the page transition overlay immediately
        const transition = document.getElementById('pageTransition');
        if (transition) {
            transition.classList.remove('active');
            transition.style.display = 'none';
        }
        
        const currentSubject = localStorage.getItem('currentSubject');
        const topicsData = localStorage.getItem('currentTopics');

        console.log("📦 Retrieved data:", {
            hasSubject: !!currentSubject,
            hasTopics: !!topicsData,
            subject: currentSubject,
            topicsLength: topicsData ? JSON.parse(topicsData).length : 0
        });

        if (!currentSubject) {
            throw new Error("No subject selected. Please select a subject from the timetable.");
        }

        if (!topicsData) {
            // If we have a subject but no topics, try to fetch them again
            console.log("🔄 No topics found, attempting to fetch topics for:", currentSubject);
            fetchTopics(currentSubject).catch(e => {
                console.error("❌ Failed to fetch topics:", e);
                throw new Error("Failed to load topics. Please try selecting the subject again.");
            });
            return;
        }

        let topics;
        try {
            topics = JSON.parse(topicsData);
            console.log("✅ Parsed topics:", topics.slice(0, 2));
            
            if (!Array.isArray(topics) || topics.length === 0) {
                throw new Error("Invalid or empty topics data");
            }
        } catch (e) {
            console.error("❌ Error parsing topics:", e);
            // Clear invalid data
            localStorage.removeItem('currentTopics');
            throw new Error("Failed to load topics data. Please try selecting the subject again.");
        }

        // Update page title and heading
        document.title = `Topics - ${currentSubject}`;
        const heading = document.querySelector('h2');
        if (heading) {
            heading.textContent = `${currentSubject} Topics`;
        }

        // Get topics container
        const topicsList = document.getElementById('topics-list');
        if (!topicsList) {
            throw new Error("Topics container not found");
        }

        // Clear existing content
        topicsList.innerHTML = '';

        // Add topics with animation delay
        topics.forEach((topic, index) => {
            const topicElement = document.createElement('div');
            topicElement.className = 'topic-item';
            topicElement.style.opacity = '0';
            topicElement.style.transform = 'translateY(20px)';
            topicElement.style.transition = 'all 0.3s ease';
            topicElement.style.transitionDelay = `${index * 0.05}s`;
            topicElement.innerHTML = `
                <span class="topic-number">${index + 1}.</span>
                <span class="topic-text">${topic}</span>
            `;
            
            topicElement.addEventListener('click', () => {
                handleTopicClickWithTransition(topic, currentSubject);
            });

            topicsList.appendChild(topicElement);
            
            // Trigger animation after a small delay
            setTimeout(() => {
                topicElement.style.opacity = '1';
                topicElement.style.transform = 'translateY(0)';
            }, 50);
        });

        console.log("✅ Topics page initialized successfully with", topics.length, "topics");

        // Add visible class after a short delay
        setTimeout(() => {
            const container = document.querySelector('.container');
            if (container) {
                container.classList.add('visible');
            }
        }, 100);

    } catch (error) {
        console.error("❌ Error initializing topics page:", error);
        
        // Hide loading animation in case of error
        const transition = document.getElementById('pageTransition');
        if (transition) {
            transition.classList.remove('active');
            transition.style.display = 'none';
        }
        
        // Show error message with more details
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <h2>Error Loading Topics</h2>
                <div class="error-message">
                    <p>${error.message}</p>
                    <p class="error-details">If this error persists, try clearing your browser data and refreshing the page.</p>
                </div>
                <button onclick="window.location.href='timetable.html'" class="back-button">
                    Back to Timetable
                </button>
            `;
        }
    }
}

// Initialize topics page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.includes('topics.html')) {
        initializeTopicsPage();
    }
});

// Update handleTopicClickWithTransition to properly handle topic selection
async function handleTopicClickWithTransition(topic, subject) {
    try {
        console.log("🔍 Topic selected:", { topic, subject });
        
        // Show transition overlay
        const transition = document.getElementById('pageTransition');
        if (transition) {
            transition.style.display = 'flex';
            transition.classList.add('active');
            transition.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading content for ${subject} - ${topic}...</div>
            `;
        }

        // Call the main handler to fetch and store content
        await handleTopicClick(topic, subject);

    } catch (error) {
        console.error("❌ Error in handleTopicClickWithTransition:", error);
        
        // Hide loading state
        const transition = document.getElementById('pageTransition');
        if (transition) {
            transition.classList.remove('active');
            transition.style.display = 'none';
        }
        
        alert(`Failed to load topic content: ${error.message}\nPlease try again.`);
    }
}

// Save dropdown values to localStorage
["state", "curriculum", "grade"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener("change", function () {
            localStorage.setItem(id, this.value);
        });
    }
});

