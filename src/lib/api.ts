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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-todo-app-by-wajahat-ali-lastof-250bbwsmx.vercel.app';

function getApiBase(): string {
  return API_BASE.replace(/\/$/, ''); // Remove trailing slash
}

export async function getTasks(): Promise<TaskResponse[]> {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTZhMzk5My05MWE2LTQxZmUtOTY0NC02ZTcwODljMDkyOGMiLCJpYXQiOjE3Njc0ODA3MTgsImV4cCI6MTc2NzQ4NDMxOH0.f5Ruf68pzotiVLJlZ0nRf7zHYi75dJH820qOBok8jQo';
  
  const response = await fetch(`${getApiBase()}/api/tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch tasks');
  const data = await response.json();
  return data.tasks || [];
}

export async function createTask(task: TaskCreate): Promise<TaskResponse> {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTZhMzk5My05MWE2LTQxZmUtOTY0NC02ZTcwODljMDkyOGMiLCJpYXQiOjE3Njc0ODA3MTgsImV4cCI6MTc2NzQ4NDMxOH0.f5Ruf68pzotiVLJlZ0nRf7zHYi75dJH820qOBok8jQo';
  
  const response = await fetch(`${getApiBase()}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
}

export async function updateTask(id: string, task: TaskUpdate): Promise<TaskResponse> {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTZhMzk5My05MWE2LTQxZmUtOTY0NC02ZTcwODljMDkyOGMiLCJpYXQiOjE3Njc0ODA3MTgsImV4cCI6MTc2NzQ4NDMxOH0.f5Ruf68pzotiVLJlZ0nRf7zHYi75dJH820qOBok8jQo';
  
  const response = await fetch(`${getApiBase()}/api/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

export async function deleteTask(id: string): Promise<void> {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTZhMzk5My05MWE2LTQxZmUtOTY0NC02ZTcwODljMDkyOGMiLCJpYXQiOjE3Njc0ODA3MTgsImV4cCI6MTc2NzQ4NDMxOH0.f5Ruf68pzotiVLJlZ0nRf7zHYi75dJH820qOBok8jQo';
  
  const response = await fetch(`${getApiBase()}/api/tasks/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to delete task');
}

export async function toggleTaskComplete(id: string): Promise<TaskResponse> {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YTZhMzk5My05MWE2LTQxZmUtOTY0NC02ZTcwODljMDkyOGMiLCJpYXQiOjE3Njc0ODA3MTgsImV4cCI6MTc2NzQ4NDMxOH0.f5Ruf68pzotiVLJlZ0nRf7zHYi75dJH820qOBok8jQo';
  
  const response = await fetch(`${getApiBase()}/api/tasks/${id}/complete`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to toggle task');
  return response.json();
}