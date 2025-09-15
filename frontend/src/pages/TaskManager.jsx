import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  CheckSquare
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import TaskModal from '../components/TaskModal';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await axios.get(`/api/tasks?${params}`, {
        withCredentials: true
      });
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
      console.error('Fetch tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`, {
          withCredentials: true
        });
        toast.success('Task deleted successfully');
        fetchTasks();
      } catch (error) {
        toast.error('Failed to delete task');
        console.error('Delete task error:', error);
      }
    }
  };

  const handleTaskSaved = () => {
    setShowModal(false);
    setEditingTask(null);
    fetchTasks();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in-progress': return <CheckSquare className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
          <button
            onClick={handleCreateTask}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Task
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="deadline">Sort by Deadline</option>
              <option value="status">Sort by Status</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="input-field"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {task.assignedTo}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {formatDate(task.deadline)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    <span className="ml-1 capitalize">{task.status.replace('-', ' ')}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating your first task.'
              }
            </p>
            {!searchTerm && !statusFilter && (
              <button
                onClick={handleCreateTask}
                className="btn-primary"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Task
              </button>
            )}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          onSave={handleTaskSaved}
        />
      )}
    </div>
  );
};

export default TaskManager;
