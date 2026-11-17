// Get existing HTML elements
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("due_date");
// Get Kanban columns
const columns = document.querySelectorAll(".column");

// LocalStorage key
const STORAGE_KEY = "taskflow_tasks";


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


// Save all tasks in LocalStorage
function saveTasks() {

    const boardData = [];

    columns.forEach(function(column) {

        const taskList = column.querySelector(".task-list");

        const savedList = taskList.cloneNode(true);

        // Do not save temporary Move buttons
        savedList.querySelectorAll(".move-task-btn").forEach(function(button) {
            button.remove();
        });

        boardData.push(savedList.innerHTML);

    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(boardData));

}


// Update task counters
function updateTaskCounters() {

    columns.forEach(function(column) {

        const taskList = column.querySelector(".task-list");
        const taskCount = column.querySelector(".task-count");

        const totalTasks = taskList.querySelectorAll(".task-card").length;

        if (taskCount) {
            taskCount.textContent = "(" + totalTasks + ")";
        }

    });

}


// Load saved tasks
function loadTasks() {

    const savedTasks = localStorage.getItem(STORAGE_KEY);

    if (savedTasks) {

        try {

            const boardData = JSON.parse(savedTasks);

            columns.forEach(function(column, index) {

                const taskList = column.querySelector(".task-list");

                if (boardData[index] !== undefined) {
                    taskList.innerHTML = boardData[index];
                }

            });

        } catch (error) {

            console.error("Unable to load saved tasks:", error);

        }

    }

    // Restore Delete buttons
    document.querySelectorAll(".task-card").forEach(function(taskCard) {

        addDeleteButton(taskCard);

    });

    updateTaskCounters();

    saveTasks();

}


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

// Display due date
if (taskDueDate !== "") {

    const dueDate = document.createElement("p");

    dueDate.classList.add("due-date");

    const [year, month, day] = taskDueDate.split("-");

    const formattedDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    ).toLocaleDateString();

    dueDate.textContent = "Due: " + formattedDate;

    taskCard.appendChild(dueDate);

}

addDeleteButton(taskCard);


    taskList.appendChild(taskCard);

    taskInput.value = "";
    dueDateInput.value = "";
    saveTasks();

    updateTaskCounters();

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