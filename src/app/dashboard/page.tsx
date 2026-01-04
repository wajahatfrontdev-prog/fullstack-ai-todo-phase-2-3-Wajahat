'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getSession, signOut } from '../../lib/auth';
import { Analytics } from '@/components/Analytics';
import { TaskTimeline } from '@/components/TaskTimeline';
import { ProductivityChart } from '@/components/ProductivityChart';
import { FloatingChatbot } from '@/components/FloatingChatbot';
import { Plus, Search, LogOut, Menu, X, Calendar, Flag, Tag, CheckCircle2, Trash2, Edit2, Bell, Settings, Home } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate: string;
  recurring: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'analytics'>('list');
  const [newTask, setNewTask] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newCategory, setNewCategory] = useState('personal');
  const [newDueDate, setNewDueDate] = useState('');
  const [newRecurring, setNewRecurring] = useState('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('priority');

  useEffect(() => {
    async function checkAuth() {
      const currentSession = await getSession();
      if (!currentSession) {
        router.push('/login');
      } else {
        setSession(currentSession);
      }
    }
    checkAuth();
  }, [router]);

  // Listen for chatbot task creation to refresh dashboard
  useEffect(() => {
    const handleTaskCreated = () => {
      // Reload tasks when chatbot creates a task
      if (session) {
        loadTasks();
      }
    };
    
    window.addEventListener('task-created', handleTaskCreated);
    return () => window.removeEventListener('task-created', handleTaskCreated);
  }, [session]);

  // Load tasks function (moved outside useEffect for reuse)
  const loadTasks = async () => {
    const token = localStorage.getItem('auth-token');
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-todo-app-by-wajahat-ali-l.vercel.app'}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        console.error('API error:', response.status);
        setTasks([]);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks([]);
    }
  };

  // Load tasks from backend API
  useEffect(() => {
    if (session) {
      loadTasks();
    }
    
    // Auto-refresh every 2 seconds for faster updates
    const interval = setInterval(() => {
      if (session) {
        loadTasks();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [session]);

  // Listen for chatbot task additions
  useEffect(() => {
    const handleChatbotTask = (event: CustomEvent) => {
      console.log('Dashboard received chatbot task:', event.detail);
      const { action, task } = event.detail;
      if (action === 'add') {
        const newTask = {
          id: Date.now(),
          title: task,
          description: 'Added via AI Assistant',
          completed: false,
          priority: 'medium' as const,
          category: 'personal',
          dueDate: '',
          recurring: 'none'
        };
        setTasks(prev => {
          const updated = [...prev, newTask];
          // Save to localStorage
          localStorage.setItem('dashboard-tasks', JSON.stringify(updated));
          return updated;
        });
      }
    };
    
    window.addEventListener('chatbot-task', handleChatbotTask as EventListener);
    return () => window.removeEventListener('chatbot-task', handleChatbotTask as EventListener);
  }, []);

  async function addTask() {
    if (!newTask.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      let updatedTasks;
      if (editingId) {
        updatedTasks = tasks.map(t => 
          t.id === editingId 
            ? { ...t, title: newTask.trim(), description: newDescription.trim(), priority: newPriority, category: newCategory, dueDate: newDueDate, recurring: newRecurring }
            : t
        );
        setTasks(updatedTasks);
        setEditingId(null);
      } else {
        const newTaskObj = { 
          id: Date.now(), 
          title: newTask.trim(), 
          description: newDescription.trim(),
          completed: false,
          priority: newPriority,
          category: newCategory,
          dueDate: newDueDate,
          recurring: newRecurring
        };
        updatedTasks = [...tasks, newTaskObj];
        setTasks(updatedTasks);
      }
      
      // Save to localStorage
      localStorage.setItem('dashboard-tasks', JSON.stringify(updatedTasks));
      
      setNewTask('');
      setNewDescription('');
      setNewPriority('medium');
      setNewCategory('personal');
      setNewDueDate('');
      setNewRecurring('none');
      setShowModal(false);
    } catch (err) {
      setError('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function toggleTask(id: number) {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem('dashboard-tasks', JSON.stringify(updatedTasks));
  }

  async function deleteTask(id: number) {
    const token = localStorage.getItem('auth-token');
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-todo-app-by-wajahat-ali-l.vercel.app'}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const updatedTasks = tasks.filter(task => task.id !== id);
        setTasks(updatedTasks);
      } else {
        console.error('Delete failed:', response.status);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setNewTask(task.title);
    setNewDescription(task.description);
    setNewPriority(task.priority);
    setNewCategory(task.category);
    setNewDueDate(task.dueDate);
    setNewRecurring(task.recurring);
    setShowModal(true);
  }

  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'completed' && task.completed) ||
                           (filterStatus === 'pending' && !task.completed);
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (sortBy === 'priority') {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return b.id - a.id;
    });

  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
          <p className="text-white/80">Loading your dashboard...</p>
        </div>
      </motion.div>
    );
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const stats = {
    total: tasks.length,
    completed: completedCount,
    pending: tasks.length - completedCount,
    completionRate: tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700"
    >
      {/* Navigation */}
      <nav className="bg-green-900/50 backdrop-blur-xl border-b border-green-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Todo Pro</h1>
            </motion.div>

            <div className="flex items-center gap-4">
              <span className="text-slate-300 text-sm">Welcome, {session?.user?.email || 'User'}!</span>
              <motion.button
                onClick={() => signOut()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Total Tasks', value: stats.total, icon: '📋', color: 'from-blue-500 to-cyan-500' },
            { label: 'Completed', value: stats.completed, icon: '✅', color: 'from-green-500 to-emerald-500' },
            { label: 'Pending', value: stats.pending, icon: '⏳', color: 'from-yellow-500 to-orange-500' },
            { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: '📈', color: 'from-purple-500 to-pink-500' }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium mb-2">{stat.label}</p>
                  <p className="text-4xl font-bold">{stat.value}</p>
                </div>
                <span className="text-5xl opacity-50">{stat.icon}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* View Mode Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex gap-2 mb-6 bg-green-900/50 backdrop-blur p-2 rounded-xl border border-green-700/50"
        >
          {(['list', 'timeline', 'analytics'] as const).map((mode) => (
            <motion.button
              key={mode}
              onClick={() => setViewMode(mode)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                viewMode === mode
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {mode === 'list' ? '📝 List View' : mode === 'timeline' ? '🗓️ Timeline' : '📊 Analytics'}
            </motion.button>
          ))}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="bg-green-900/50 backdrop-blur rounded-2xl p-6 border border-green-700/50 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-green-800 border border-green-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-green-800 border border-green-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 bg-green-800 border border-green-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-green-800 border border-green-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="title">Sort by Title</option>
            </select>
            <motion.button
              onClick={() => {
                setShowModal(true);
                setEditingId(null);
                setNewTask('');
                setNewDescription('');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </motion.button>
          </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {filteredTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-green-900/50 backdrop-blur rounded-2xl p-12 text-center border border-green-700/50"
                >
                  <p className="text-slate-400 text-lg mb-4">
                    {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                      ? '❌ No tasks match your filters'
                      : '🎉 No tasks yet — add your first one!'}
                  </p>
                  {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && (
                    <motion.button
                      onClick={() => setShowModal(true)}
                      whileHover={{ scale: 1.05 }}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium inline-block"
                    >
                      Create First Task
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                filteredTasks.map((task, idx) => (
                  <TaskItem key={task.id} task={task} index={idx} onToggle={toggleTask} onDelete={deleteTask} onEdit={startEdit} />
                ))
              )}
            </motion.div>
          )}

          {viewMode === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-green-900/50 backdrop-blur rounded-2xl p-6 border border-green-700/50"
            >
              <TaskTimeline tasks={filteredTasks.map(t => ({ ...t, time: t.dueDate || 'No date' }))} />
            </motion.div>
          )}

          {viewMode === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-green-900/50 backdrop-blur rounded-2xl p-6 border border-green-700/50">
                  <Analytics />
                </div>
                <div className="bg-green-900/50 backdrop-blur rounded-2xl p-6 border border-green-700/50">
                  <ProductivityChart />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Task Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowModal(false);
              setEditingId(null);
            }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-green-800 to-green-900 rounded-2xl p-8 max-w-md w-full border border-green-700 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingId ? '✏️ Edit Task' : '➕ Add New Task'}
              </h2>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Task Title *</label>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Enter task title"
                    className="w-full px-4 py-2 bg-green-700 border border-green-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value.slice(0, 500))}
                    placeholder="Add details (optional)"
                    className="w-full px-4 py-2 bg-green-700 border border-green-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors resize-none h-20"
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-400 mt-1">{newDescription.length}/500</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-green-700 border border-green-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-green-700 border border-green-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="home">Home</option>
                      <option value="health">Health</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-4 py-2 bg-green-700 border border-green-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Repeat</label>
                  <select
                    value={newRecurring}
                    onChange={(e) => setNewRecurring(e.target.value)}
                    className="w-full px-4 py-2 bg-green-700 border border-green-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="none">No Repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    onClick={addTask}
                    disabled={loading || !newTask.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 rounded-lg font-medium disabled:opacity-50 transition-opacity"
                  >
                    {loading ? '💫 Saving...' : (editingId ? '💾 Update' : '➕ Add')}
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-green-700 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <FloatingChatbot />
    </motion.div>
  );
}

function TaskItem({ task, index, onToggle, onDelete, onEdit }: { task: Task; index: number; onToggle: (id: number) => void; onDelete: (id: number) => void; onEdit: (task: Task) => void }) {
  const priorityColors = {
    high: 'from-red-500 to-pink-500',
    medium: 'from-yellow-500 to-orange-500',
    low: 'from-blue-500 to-cyan-500'
  };

  const categoryEmojis: { [key: string]: string } = {
    work: '💼',
    personal: '👤',
    home: '🏠',
    health: '❤️'
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      className={`group bg-green-900/50 backdrop-blur rounded-xl p-4 border transition-all ${
        task.completed
          ? 'border-green-700/30 opacity-60'
          : isOverdue
          ? 'border-red-500/50 bg-red-500/5'
          : 'border-green-700/50 hover:border-green-600/50'
      }`}
    >
      <div className="flex gap-4">
        <motion.input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          whileHover={{ scale: 1.1 }}
          className="mt-1 w-5 h-5 rounded text-green-500 bg-green-800 border-green-600 cursor-pointer flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`text-lg font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
              {task.title}
            </h3>
          </div>

          {task.description && (
            <p className={`text-sm mb-3 ${task.completed ? 'text-slate-500' : 'text-slate-300'}`}>
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${priorityColors[task.priority]} text-white`}
            >
              {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
            </motion.span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-700 text-green-200">
              {categoryEmojis[task.category]} {task.category}
            </span>
            {task.recurring !== 'none' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                🔄 {task.recurring}
              </span>
            )}
            {task.dueDate && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isOverdue
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}>
                📅 {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <motion.button
            onClick={() => onEdit(task)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => onDelete(task.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
