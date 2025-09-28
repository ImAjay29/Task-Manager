const taskInput = document.getElementById('task-input');
const taskDescription = document.getElementById('task-description');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const progress = document.getElementById('progress');
const progressPercentage = document.getElementById('progress-percentage');
const completedCount = document.getElementById('completed-count');
const pendingCount = document.getElementById('pending-count');
const totalCount = document.getElementById('total-count');

let currentFilter = 'all'; 
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Add task function
function addTask() {
    const taskTitle = taskInput.value.trim();
    const description = taskDescription.value.trim();
    
    if (taskTitle === '') {
        taskInput.style.animation = 'shake 0.5s';
        setTimeout(() => {
            taskInput.style.animation = '';
        }, 500);
        return;
    }

    const task = {
        id: Date.now(),
        title: taskTitle,
        description: description,
        completed: false,
        isEditing: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task); 
    saveTasks();
    renderTasks();
    
    taskInput.value = '';
    taskDescription.value = '';
    taskInput.focus();
    
    updateProgress();
    
    const addBtn = document.getElementById('add-btn');
    const originalText = addBtn.innerHTML;
    addBtn.innerHTML = '<i class="fas fa-check"></i> Task Added!';
    addBtn.disabled = true;
    
    setTimeout(() => {
        addBtn.innerHTML = originalText;
        addBtn.disabled = false;
    }, 2000);
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    updateProgress();
}

function toggleTaskStatus(id) {
    if (tasks.some(task => task.id === id && task.isEditing)) {
        return;
    }
    
    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks();
    updateProgress();
    renderTasks();
}

function toggleEditMode(id) {
    tasks = tasks.map(task => 
        task.id === id 
            ? { ...task, isEditing: !task.isEditing }
            : task
    );
    saveTasks();
    renderTasks();
}

function saveEditedTask(id, title, description) {
    if (title.trim() === '') {
        deleteTask(id);
        return;
    }
    
    tasks = tasks.map(task => 
        task.id === id 
            ? { 
                ...task, 
                title: title.trim(), 
                description: description.trim(),
                isEditing: false 
              }
            : task
    );
    saveTasks();
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = '';
    
    const filteredTasks = filterTasks();
    
    if (filteredTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        let message = 'No tasks yet';
        let subMessage = 'Add your first task to get started!';
        
        if (currentFilter === 'completed') {
            message = 'No completed tasks';
            subMessage = 'Complete some tasks to see them here!';
        } else if (currentFilter === 'pending') {
            message = 'No pending tasks';
            subMessage = 'All caught up! Add a new task or check completed tasks.';
        }
        
        emptyState.innerHTML = `
            <i class="fas fa-tasks"></i>
            <h3>${message}</h3>
            <p>${subMessage}</p>
        `;
        taskList.appendChild(emptyState);
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''} ${task.isEditing ? 'editing' : ''}`;
        taskItem.dataset.taskId = task.id;
        
        if (task.isEditing) {
            taskItem.innerHTML = `
                <div class="task-content">
                    <div class="input-group">
                        <label for="edit-title-${task.id}">Task Title</label>
                        <input type="text" id="edit-title-${task.id}" class="edit-title" value="${escapeHtml(task.title)}" placeholder="What needs to be done?" autofocus>
                    </div>
                    <div class="input-group">
                        <label for="edit-desc-${task.id}">Description <span class="optional">(optional)</span></label>
                        <textarea id="edit-desc-${task.id}" class="edit-description" placeholder="Add details about your task...">${escapeHtml(task.description || '')}</textarea>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-outline cancel-btn" title="Cancel">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="btn btn-primary save-btn" title="Save changes">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            `;
            
            const saveBtn = taskItem.querySelector('.save-btn');
            const cancelBtn = taskItem.querySelector('.cancel-btn');
            const editTitle = taskItem.querySelector('.edit-title');
            const editDescription = taskItem.querySelector('.edit-description');
            
            const saveChanges = () => {
                saveEditedTask(task.id, editTitle.value, editDescription.value);
            };
            
            const cancelChanges = () => {
                toggleEditMode(task.id);
            };
            
            saveBtn.addEventListener('click', saveChanges);
            cancelBtn.addEventListener('click', cancelChanges);
            
            editTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveChanges();
                } else if (e.key === 'Escape') {
                    cancelChanges();
                }
            });
            
            editDescription.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    saveChanges();
                } else if (e.key === 'Escape') {
                    cancelChanges();
                }
            });
            
            setTimeout(() => {
                editTitle.focus();
                editTitle.setSelectionRange(editTitle.value.length, editTitle.value.length);
            }, 10);
            
        } else {
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description).replace(/\n/g, '<br>')}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="btn btn-icon edit-btn" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon delete-btn danger" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            const checkbox = taskItem.querySelector('.task-checkbox');
            const editBtn = taskItem.querySelector('.edit-btn');
            const deleteBtn = taskItem.querySelector('.delete-btn');
            
            checkbox.addEventListener('change', () => toggleTaskStatus(task.id));
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleEditMode(task.id);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this task?')) {
                    deleteTask(task.id);
                }
            });
            
            const taskContent = taskItem.querySelector('.task-content');
            if (taskContent) {
                taskContent.addEventListener('click', (e) => {
                    if (!e.target.closest('button, a, [contenteditable]')) {
                        toggleTaskStatus(task.id);
                    }
                });
            }
        }
        
        taskList.appendChild(taskItem);
    });
}

function filterTasks() {
    return tasks.filter(task => {
        if (currentFilter === 'completed') return task.completed;
        if (currentFilter === 'pending') return !task.completed;
        return true; 
    });
}

function updateProgress() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    progress.style.width = `${percentage}%`;
    progressPercentage.textContent = `${percentage}%`;
    
    completedCount.textContent = completedTasks;
    pendingCount.textContent = pendingTasks;
    totalCount.textContent = totalTasks;
}

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
    }
    
    .task-item {
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

function init() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    
    renderTasks();
    updateProgress();
    
    taskInput.focus();
    
    const addTaskForm = document.querySelector('.form-group');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addTask();
        });
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            
            btn.classList.add('active');
            
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && taskInput.value.trim() !== '') {
            addTask();
        }
    });
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function handleClickOutside(event) {
    const clickedTaskItem = event.target.closest('.task-item');
    const isEditing = clickedTaskItem && clickedTaskItem.classList.contains('editing');
    
    if (!clickedTaskItem || !isEditing) {
        const editingTaskItem = document.querySelector('.task-item.editing');
        if (editingTaskItem) {
            const taskId = parseInt(editingTaskItem.dataset.taskId);
            
            toggleEditMode(taskId);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 100);
});

document.addEventListener('click', (e) => {
    if (e.target.closest('.task-item.editing') || 
        e.target.closest('.edit-btn') || 
        e.target.closest('.save-btn') || 
        e.target.closest('.cancel-btn')) {
        e.stopPropagation();
    }
});
