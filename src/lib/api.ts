export interface TaskResponse {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
}

// 🔥 CORRECT BACKEND URL (working one with 52 tasks)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-todo-app-by-wajahat-ali-l.vercel.app';

function getApiBase(): string {
  return API_BASE.replace(/\/$/, '');
}

// 🔥 NO TOKEN — Demo mode me auth bypass hai
export async function getTasks(): Promise<TaskResponse[]> {
  const response = await fetch(`${getApiBase()}/api/tasks`);
  
  if (!response.ok) {
    console.error('Tasks fetch failed:', response.status, await response.text());
    return [];
  }
  
  const data = await response.json();
  console.log('Fetched tasks:', data); // Debug ke liye
  return data.tasks || [];
}

export async function createTask(task: TaskCreate): Promise<TaskResponse> {
  const response = await fetch(`${getApiBase()}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // No Authorization
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    console.error('Create failed:', response.status, await response.text());
    throw new Error('Failed to create task');
  }
  
  return response.json();
}

// Baaki functions me bhi Authorization header hata do
export async function updateTask(id: string, task: TaskUpdate): Promise<TaskResponse> {
  const response = await fetch(`${getApiBase()}/api/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${getApiBase()}/api/tasks/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) throw new Error('Failed to delete task');
}

export async function toggleTaskComplete(id: string): Promise<TaskResponse> {
  const response = await fetch(`${getApiBase()}/api/tasks/${id}/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ completed: !true }), // Toggle logic
  });

  if (!response.ok) throw new Error('Failed to toggle task');
  return response.json();
}
