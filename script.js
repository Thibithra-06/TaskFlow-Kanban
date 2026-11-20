// Get existing HTML elements
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("due_date");
// Get Kanban columns
const columns = document.querySelectorAll(".column");
// Create Search and Filter Controls
function createSearchControls() {

    const toolbar = document.createElement("div");

    toolbar.className = "task-toolbar";

    toolbar.innerHTML = `
        <div class="search-box">
            <input
                type="search"
                id="taskSearch"
                placeholder="Search tasks..."
                aria-label="Search tasks"
            >
        </div>

        <select id="priorityFilter" aria-label="Filter by priority">
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
        </select>

        <select id="statusFilter" aria-label="Filter by status">
            <option value="all">All Status</option>
            <option value="0">To Do</option>
            <option value="1">In Progress</option>
            <option value="2">Done</option>
        </select>
        <button type="button" id="importTasksBtn" class="import-sample-btn">
    Import Sample Tasks
</button>
    `;

document.querySelector(".main-container")
    .insertBefore(toolbar, document.querySelector(".kanban-board"));
    return toolbar;
}



// Initialize Search Controls
const searchToolbar = createSearchControls();
// Import sample tasks from API
const importTasksBtn = document.getElementById("importTasksBtn");

importTasksBtn.addEventListener("click", async function () {

    importTasksBtn.disabled = true;
    importTasksBtn.textContent = "Importing...";

    try {

        const response = await fetch(
            "https://jsonplaceholder.typicode.com/todos?_limit=5"
        );

        if (!response.ok) {
            throw new Error("Unable to fetch sample tasks.");
        }

        const sampleTasks = await response.json();

        sampleTasks.forEach(function (item) {

            const taskCard = document.createElement("div");
            taskCard.classList.add("task-card");

            const title = document.createElement("h4");
            title.classList.add("task-title");
            title.textContent = item.title;

            const priority = document.createElement("span");
            priority.classList.add("priority-medium");
            priority.textContent = "Medium";

            taskCard.appendChild(title);
            taskCard.appendChild(priority);
            const dueDate = new Date();
dueDate.setDate(dueDate.getDate() + 7);

const dueDateValue = [
    dueDate.getFullYear(),
    String(dueDate.getMonth() + 1).padStart(2, "0"),
    String(dueDate.getDate()).padStart(2, "0")
].join("-");

const dueDateElement = document.createElement("p");
dueDateElement.classList.add("due-date");
dueDateElement.textContent = "Due: " + formatTaskDate(dueDateValue);

taskCard.appendChild(dueDateElement);

            addEditButton(taskCard);
            addDeleteButton(taskCard);
            enableTaskDragging(taskCard);

            const columnIndex = item.completed ? 2 : 0;

            columns[columnIndex]
                .querySelector(".task-list")
                .appendChild(taskCard);

        });

        saveTasks();
        updateTaskCounters();

        alert("5 sample tasks imported successfully!");

    } catch (error) {

        console.error("Import error:", error);

        alert("Unable to import tasks. Please check your internet connection and try again.");

    } finally {

        importTasksBtn.disabled = false;
        importTasksBtn.textContent = "Import Sample Tasks";

    }

});

const searchInput = document.getElementById("taskSearch");
const priorityFilter = document.getElementById("priorityFilter");
const statusFilter = document.getElementById("statusFilter");


// Apply Search and Filters
function applyTaskFilters() {

    const searchText = searchInput.value.toLowerCase().trim();

    const selectedPriority = priorityFilter.value;

    const selectedStatus = statusFilter.value;

    columns.forEach(function(column, index) {

        const taskCards = column.querySelectorAll(".task-card");

        taskCards.forEach(function(taskCard) {

            const title = taskCard
                .querySelector(".task-title")
                .textContent.toLowerCase();

            const priorityElement = taskCard.querySelector("[class*='priority-']");

            const priorityClass = Array.from(priorityElement.classList)
                .find(className => className.startsWith("priority-"));

            const priority = priorityClass
                ? priorityClass.replace("priority-", "")
                : "medium";

            const matchesSearch = title.includes(searchText);

            const matchesPriority =
                selectedPriority === "all" ||
                priority === selectedPriority;

            const matchesStatus =
                selectedStatus === "all" ||
                index.toString() === selectedStatus;

            if (matchesSearch && matchesPriority && matchesStatus) {

                taskCard.style.display = "";

            } else {

                taskCard.style.display = "none";

            }

        });

    });

}


// Search Event
searchInput.addEventListener("input", applyTaskFilters);


// Priority Filter Event
priorityFilter.addEventListener("change", applyTaskFilters);


// Status Filter Event
statusFilter.addEventListener("change", applyTaskFilters);
// Enable Drag and Drop for task cards
function enableTaskDragging(taskCard) {
    taskCard.draggable = true;
}

// Drag and Drop functionality
columns.forEach(function(column) {

    const taskList = column.querySelector(".task-list");

    // Start dragging
    taskList.addEventListener("dragstart", function(event) {

        const taskCard = event.target.closest(".task-card");

        if (!taskCard) {
            return;
        }

        if (event.target.closest("button")) {
            event.preventDefault();
            return;
        }

        taskCard.classList.add("dragging");

        event.dataTransfer.effectAllowed = "move";

        event.dataTransfer.setData("text/plain", "task");

    });

    // Allow dropping
    taskList.addEventListener("dragover", function(event) {

        event.preventDefault();

        const draggingCard = document.querySelector(".dragging");

        if (!draggingCard) {
            return;
        }

        const targetCard = event.target.closest(".task-card");

        if (!targetCard || targetCard === draggingCard) {
            return;
        }

        const rect = targetCard.getBoundingClientRect();

        const mousePosition = event.clientY - rect.top;

        if (mousePosition < rect.height / 2) {
            taskList.insertBefore(draggingCard, targetCard);
        } else {
            taskList.insertBefore(draggingCard, targetCard.nextSibling);
        }

    });

    // Drop task
    taskList.addEventListener("drop", function(event) {

        event.preventDefault();

        const draggingCard = document.querySelector(".dragging");

        if (!draggingCard) {
            return;
        }

        taskList.appendChild(draggingCard);

        saveTasks();

        updateTaskCounters();

    });

    // End dragging
    taskList.addEventListener("dragend", function() {

        const draggingCard = document.querySelector(".dragging");

        if (draggingCard) {
            draggingCard.classList.remove("dragging");
        }

        saveTasks();

        updateTaskCounters();

    });

});
// LocalStorage key
const STORAGE_KEY = "taskflow_tasks";
// Format date as DD MMM YYYY
function formatTaskDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const [year, month, day] = dateValue.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// Get deadline status
function getDeadlineStatus(dateValue) {

    if (!dateValue) {
        return "";
    }

    const [year, month, day] = dateValue.split("-").map(Number);

    const dueDate = new Date(year, month - 1, day);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(today.getDate() + 1);

    if (dueDate < today) {
        return "overdue";
    }

    if (dueDate.getTime() === today.getTime()) {
        return "due-today";
    }

    if (dueDate.getTime() === tomorrow.getTime()) {
        return "due-tomorrow";
    }

    return "upcoming";
}


// Create professional due date element
function createDueDateElement(dateValue) {

    const dueDate = document.createElement("p");

    dueDate.classList.add("due-date");

    const status = getDeadlineStatus(dateValue);

    const formattedDate = formatTaskDate(dateValue);

    dueDate.classList.add(status);

    if (status === "overdue") {
        dueDate.textContent = "🔴 Overdue · " + formattedDate;
    }
    else if (status === "due-today") {
        dueDate.textContent = "🟠 Due Today · " + formattedDate;
    }
    else if (status === "due-tomorrow") {
        dueDate.textContent = "🟡 Due Tomorrow · " + formattedDate;
    }
    else {
        dueDate.textContent = "📅 Due · " + formattedDate;
    }

    dueDate.dataset.date = dateValue;

    return dueDate;
}

// Add Delete button
function addDeleteButton(taskCard) {

    if (taskCard.querySelector(".delete-task-btn")) {
        return;
    }

    const deleteButton = document.createElement("button");

    deleteButton.classList.add("delete-task-btn");
    deleteButton.textContent = "Delete";
    deleteButton.type = "button";

    taskCard.appendChild(deleteButton);
}
// Add Edit button
function addEditButton(taskCard) {

    if (taskCard.querySelector(".edit-task-btn")) {
        return;
    }

    const editButton = document.createElement("button");

    editButton.classList.add("edit-task-btn");
    editButton.textContent = "Edit";
    editButton.type = "button";

    taskCard.appendChild(editButton);
}
// Convert existing due dates into YYYY-MM-DD format
function getTaskDateValue(dateElement) {

    if (!dateElement) {
        return "";
    }

    if (dateElement.dataset.date) {
        return dateElement.dataset.date;
    }

    const text = dateElement.textContent.trim();

    // Handle DD/MM/YYYY format
    const oldFormat = text.match(
        /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/
    );

    if (oldFormat) {

        let day = oldFormat[1].padStart(2, "0");
        let month = oldFormat[2].padStart(2, "0");
        let year = oldFormat[3];

        if (year.length === 2) {
            year = "20" + year;
        }

        return `${year}-${month}-${day}`;
    }

    // Handle dates such as 20 Nov 2026
    const parsedDate = new Date(
        text.replace(/^(Due:|📅 Due|🔴 Overdue|🟠 Due Today|🟡 Due Tomorrow)\s*[·:]?\s*/, "")
    );

    if (isNaN(parsedDate.getTime())) {
        return "";
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}
// Save all tasks as an array in LocalStorage

function saveTasks() {

    const tasks = [];

    columns.forEach(function(column, index) {

        const taskCards = column.querySelectorAll(".task-card");

        taskCards.forEach(function(taskCard) {

            const titleElement =
                taskCard.querySelector(".task-title");

            const priorityElement =
                taskCard.querySelector("[class*='priority-']");

            const dueDateElement =
                taskCard.querySelector(".due-date");

            if (!titleElement) {
                return;
            }

            const priorityClass = priorityElement
                ? Array.from(priorityElement.classList)
                    .find(className => className.startsWith("priority-"))
                : "priority-medium";

            const priority = priorityClass
                ? priorityClass.replace("priority-", "")
                : "medium";

            const status = ["todo", "inprogress", "done"][index];

            tasks.push({

                title: titleElement.textContent.trim(),

                priority: priority,

                dueDate: getTaskDateValue(dueDateElement),

                status: status

            });

        });

    });

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(tasks)
        );

    } catch (error) {

        console.error("Unable to save tasks:", error);

        alert("Unable to save tasks. Please check your browser storage.");

    }

}
// =====================================
// UPDATE TASK COUNTERS AND DASHBOARD
// =====================================

function updateTaskCounters() {

    let totalTasks = 0;
    let todoTasks = 0;
    let progressTasks = 0;
    let completedTasks = 0;

    columns.forEach(function(column, index) {

        const taskList = column.querySelector(".task-list");
        const taskCount = column.querySelector(".task-count");

        const count = taskList
            ? taskList.querySelectorAll(".task-card").length
            : 0;

        totalTasks += count;

        if (index === 0) {
            todoTasks = count;
        }
        else if (index === 1) {
            progressTasks = count;
        }
        else if (index === 2) {
            completedTasks = count;
        }

        if (taskCount) {
            taskCount.textContent = "(" + count + ")";
        }

    });


    // Dashboard Statistics

    const totalElement =
        document.getElementById("statsTotalTasks");

    const todoElement =
        document.getElementById("statsTodoTasks");

    const progressElement =
        document.getElementById("statsProgressTasks");

    const completedElement =
        document.getElementById("statsCompletedTasks");


    if (totalElement) {
        totalElement.textContent = totalTasks;
    }

    if (todoElement) {
        todoElement.textContent = todoTasks;
    }

    if (progressElement) {
        progressElement.textContent = progressTasks;
    }

    if (completedElement) {
        completedElement.textContent = completedTasks;
    }


    // Overall Progress

    const percentage = totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    const percentageElement =
        document.getElementById("completionPercentage");

    const progressFill =
        document.getElementById("progressFill");

    if (percentageElement) {
        percentageElement.textContent = percentage + "%";
    }

    if (progressFill) {
        progressFill.style.width = percentage + "%";
    }

}


// Load tasks - supports old and new storage formats
function loadTasks() {

    const savedTasks = localStorage.getItem(STORAGE_KEY);

    if (!savedTasks) {
        updateTaskCounters();
        return;
    }

    try {

        const storedData = JSON.parse(savedTasks);

        let tasks = [];

        // Check whether data is in the old HTML format
        if (
            Array.isArray(storedData) &&
            storedData.length > 0 &&
            typeof storedData[0] === "string"
        ) {

            // Backup old data before migration
            const backupKey = "taskflow_tasks_backup_before_week3";

            if (!localStorage.getItem(backupKey)) {
                localStorage.setItem(backupKey, savedTasks);
            }

            storedData.forEach(function(html, index) {

                const temporaryContainer = document.createElement("div");

                temporaryContainer.innerHTML = html;

                temporaryContainer.querySelectorAll(".task-card")
                    .forEach(function(card) {

                        const title = card.querySelector(".task-title");
                        const priorityElement =
                            card.querySelector("[class*='priority-']");

                        const priorityClass = priorityElement
                            ? Array.from(priorityElement.classList)
                                .find(name => name.startsWith("priority-"))
                            : null;

                        const dueDateElement =
                            card.querySelector(".due-date");

                        tasks.push({

                            title: title ? title.textContent.trim() : "",

                            priority: priorityClass
                                ? priorityClass.replace("priority-", "")
                                : "medium",

                            dueDate: getTaskDateValue(dueDateElement),

                            status: ["todo", "inprogress", "done"][index] || "todo"

                        });

                    });

            });

        }

        // New task-array format
        else if (Array.isArray(storedData)) {

            tasks = storedData;

        }

        else {

            throw new Error("Invalid saved task format.");

        }

        // Rebuild the Kanban board
        columns.forEach(function(column) {

            column.querySelector(".task-list").innerHTML = "";

        });

        tasks.forEach(function(task) {

            if (!task.title) {
                return;
            }

            let columnIndex = 0;

            if (task.status === "inprogress") {
                columnIndex = 1;
            }
            else if (task.status === "done") {
                columnIndex = 2;
            }

            const taskCard = document.createElement("div");
            taskCard.classList.add("task-card");

            const title = document.createElement("h4");
            title.classList.add("task-title");
            title.textContent = task.title;

            const priority = document.createElement("span");
            const validPriority = ["high", "medium", "low"]
                .includes(task.priority) ? task.priority : "medium";

            priority.classList.add("priority-" + validPriority);
            priority.textContent =
                validPriority.charAt(0).toUpperCase() +
                validPriority.slice(1);

            taskCard.appendChild(title);
            taskCard.appendChild(priority);

            if (task.dueDate) {
                taskCard.appendChild(
                    createDueDateElement(task.dueDate)
                );
            }

            addEditButton(taskCard);
            addDeleteButton(taskCard);
            enableTaskDragging(taskCard);

            columns[columnIndex]
                .querySelector(".task-list")
                .appendChild(taskCard);

        });

        // Save migrated data in the new format
        saveTasks();

        updateTaskCounters();

    } catch (error) {

        console.error("Unable to load tasks:", error);

        alert("Unable to load saved tasks. Your previous backup has been preserved.");

    }

}
    // Update old saved due dates to the new format
document.querySelectorAll(".task-card").forEach(function(taskCard) {

    const dueDateElement = taskCard.querySelector(".due-date");

    if (!dueDateElement) {
        return;
    }

    let dateValue = dueDateElement.dataset.date || "";

    // Read old saved date format (DD/MM/YYYY)
    if (!dateValue) {

        const match = dueDateElement.textContent.match(
            /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/
        );

        if (match) {

            let day = match[1].padStart(2, "0");
            let month = match[2].padStart(2, "0");
            let year = match[3];

            if (year.length === 2) {
                year = "20" + year;
            }

            dateValue = `${year}-${month}-${day}`;

        }

    }

    if (dateValue) {

        dueDateElement.replaceWith(
            createDueDateElement(dateValue)
        );

    }

});
document.querySelectorAll(".task-card").forEach(function(taskCard) {

    addDeleteButton(taskCard);
    addEditButton(taskCard);
    enableTaskDragging(taskCard);

});


    updateTaskCounters();




// Add Task functionality
taskForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const taskTitle = taskInput.value.trim();

    const taskPriority = priorityInput.value.toLowerCase() || "medium";
    const taskDueDate = dueDateInput.value;
    if (taskTitle === "") {

        alert("Please enter a task name!");

        return;

    }

    const todoColumn = columns[0];

    const taskList = todoColumn.querySelector(".task-list");

    // Create task card
    const taskCard = document.createElement("div");

    taskCard.classList.add("task-card");

    // Create task title
    const title = document.createElement("h4");

    title.classList.add("task-title");

    title.textContent = taskTitle;

    // Create priority label
    const priority = document.createElement("span");

    priority.classList.add("priority-" + taskPriority);

    priority.textContent =
        taskPriority.charAt(0).toUpperCase() +
        taskPriority.slice(1);
taskCard.appendChild(title);
taskCard.appendChild(priority);
// Display advanced due date
if (taskDueDate !== "") {

    const dueDate = createDueDateElement(taskDueDate);

    taskCard.appendChild(dueDate);

}
// Add Edit and Delete buttons
addDeleteButton(taskCard);
addEditButton(taskCard);

// Enable Drag and Drop
enableTaskDragging(taskCard);

// Add task to To Do column
taskList.appendChild(taskCard);

// Clear input fields
taskInput.value = "";
priorityInput.value = "medium";
dueDateInput.value = "";

// Save tasks
saveTasks();

// Update task counters
updateTaskCounters();

});

// End of Add Task functionality
// Create Edit Task Modal
function createEditModal() {

    const modal = document.createElement("div");

    modal.className = "task-edit-overlay";

    modal.innerHTML = `
        <div class="task-edit-modal">

            <div class="edit-modal-header">
                <h2>Edit Task</h2>
                <button type="button" class="close-edit-modal">&times;</button>
            </div>

            <form id="editTaskForm">

                <label for="editTaskTitle">Task Title</label>
                <input type="text" id="editTaskTitle" required maxlength="100">

                <label for="editTaskPriority">Priority</label>
                <select id="editTaskPriority">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>

                <label for="editTaskDueDate">Due Date</label>
                <input type="date" id="editTaskDueDate">

                <div class="edit-modal-actions">
                    <button type="button" class="cancel-edit-btn">
                        Cancel
                    </button>

                    <button type="submit" class="save-edit-btn">
                        Save Changes
                    </button>
                </div>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    return modal;
}


// Initialize Edit Modal
const editModal = createEditModal();

const editForm = document.getElementById("editTaskForm");


// Open Edit Modal
columns.forEach(function(column) {

    column.addEventListener("click", function(event) {

        if (!event.target.classList.contains("edit-task-btn")) {
            return;
        }

        const taskCard = event.target.closest(".task-card");

        const title = taskCard.querySelector(".task-title");
        const priority = taskCard.querySelector("[class*='priority-']");
        const dueDate = taskCard.querySelector(".due-date");

        document.getElementById("editTaskTitle").value = title.textContent;

        const priorityClass = Array.from(priority.classList)
            .find(className => className.startsWith("priority-"));

        document.getElementById("editTaskPriority").value =
            priorityClass ? priorityClass.replace("priority-", "") : "medium";

        let dateValue = "";

        if (dueDate) {

            dateValue = dueDate.dataset.date || "";

            if (!dateValue) {
                const parsedDate = new Date(
                    dueDate.textContent.replace("Due:", "").trim()
                );

                if (!isNaN(parsedDate.getTime())) {
                    const year = parsedDate.getFullYear();
                    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
                    const day = String(parsedDate.getDate()).padStart(2, "0");

                    dateValue = `${year}-${month}-${day}`;
                }
            }
        }

        document.getElementById("editTaskDueDate").value = dateValue;

        editModal.dataset.taskEditing = "true";
        window.currentEditingTask = taskCard;

        editModal.classList.add("active");

    });

});


// Save Edited Task
editForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const taskCard = window.currentEditingTask;

    if (!taskCard) {
        return;
    }

    const newTitle = document.getElementById("editTaskTitle").value.trim();

    const newPriority = document.getElementById("editTaskPriority").value;

    const newDueDate = document.getElementById("editTaskDueDate").value;

    if (!newTitle) {
        alert("Please enter a task title.");
        return;
    }

    const titleElement = taskCard.querySelector(".task-title");

    const priorityElement = taskCard.querySelector("[class*='priority-']");

    titleElement.textContent = newTitle;

    priorityElement.className = "priority-" + newPriority;

    priorityElement.textContent =
        newPriority.charAt(0).toUpperCase() + newPriority.slice(1);
let dueDateElement = taskCard.querySelector(".due-date");

if (newDueDate) {

    const updatedDueDate = createDueDateElement(newDueDate);

    if (dueDateElement) {

        dueDateElement.replaceWith(updatedDueDate);

    } else {

        taskCard.appendChild(updatedDueDate);

    }

} else if (dueDateElement) {

    dueDateElement.remove();

}
   
    editModal.classList.remove("active");

    window.currentEditingTask = null;
    saveTasks();
updateTaskCounters();

});


// Close Edit Modal
function closeEditModal() {

    editModal.classList.remove("active");

    window.currentEditingTask = null;

}

editModal.querySelector(".close-edit-modal")
    .addEventListener("click", closeEditModal);

editModal.querySelector(".cancel-edit-btn")
    .addEventListener("click", closeEditModal);

editModal.addEventListener("click", function(event) {

    if (event.target === editModal) {
        closeEditModal();
    }

});

document.addEventListener("keydown", function(event) {

    if (event.key === "Escape" && editModal.classList.contains("active")) {
        closeEditModal();
    }

});
// Delete Task functionality
columns.forEach(function(column) {

    column.addEventListener("click", function(event) {

        if (event.target.classList.contains("delete-task-btn")) {

            const taskCard = event.target.closest(".task-card");

            if (taskCard && confirm("Are you sure you want to delete this task?")) {

                taskCard.remove();

                saveTasks();

                updateTaskCounters();

            }

        }

    });

});


// Move Task functionality
columns.forEach(function(column, index) {

    const taskList = column.querySelector(".task-list");

    taskList.addEventListener("click", function(event) {

        const taskCard = event.target.closest(".task-card");

        if (!taskCard) {
            return;
        }

        // Ignore Delete button click
        if (event.target.classList.contains("delete-task-btn")) {
            return;
        }

        // Handle Move button click
        if (event.target.classList.contains("move-task-btn")) {

            let nextColumn;

            if (index === 0) {
                nextColumn = columns[1];
            }
            else if (index === 1) {
                nextColumn = columns[2];
            }
            else {
                nextColumn = columns[0];
            }

            const nextTaskList = nextColumn.querySelector(".task-list");

            const moveButton = taskCard.querySelector(".move-task-btn");

            if (moveButton) {
                moveButton.remove();
            }

            nextTaskList.appendChild(taskCard);

            saveTasks();

            updateTaskCounters();

            return;

        }

        // Prevent duplicate Move buttons
        if (taskCard.querySelector(".move-task-btn")) {
            return;
        }

        // Create Move button
        const moveButton = document.createElement("button");

        moveButton.classList.add("move-task-btn");

        moveButton.type = "button";

        if (index === 0) {
            moveButton.textContent = "Move to In Progress";
        }
        else if (index === 1) {
            moveButton.textContent = "Move to Done";
        }
        else {
            moveButton.textContent = "Move to To Do";
        }

        taskCard.appendChild(moveButton);

    });

});


// Load tasks when page opens
loadTasks();