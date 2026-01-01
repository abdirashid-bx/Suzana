import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updatePassword: (data) => api.put('/auth/password', data),
    logout: () => api.post('/auth/logout')
};

// Users API
export const usersAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data)
};

// Students API
export const studentsAPI = {
    getAll: (params) => api.get('/students', { params }),
    getById: (id) => api.get(`/students/${id}`),
    create: (data) => {
        // If data is FormData, let browser set Content-Type with boundary
        if (data instanceof FormData) {
            return api.post('/students', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        return api.post('/students', data);
    },
    update: (id, data) => {
        if (data instanceof FormData) {
            return api.put(`/students/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        return api.put(`/students/${id}`, data);
    },
    delete: (id) => api.delete(`/students/${id}`),
    getNextAdmissionNo: () => api.get('/students/next-admission-no'),
    getByClassroom: (classroomId) => api.get(`/students/classroom/${classroomId}`)
};

// Staff API
export const staffAPI = {
    getAll: (params) => api.get('/staff', { params }),
    getById: (id) => api.get(`/staff/${id}`),
    create: (data) => api.post('/staff', data),
    update: (id, data) => api.put(`/staff/${id}`, data),
    delete: (id) => api.delete(`/staff/${id}`)
};

// Grades API
export const gradesAPI = {
    getAll: () => api.get('/grades'),
    getById: (id) => api.get(`/grades/${id}`),
    create: (data) => api.post('/grades', data),
    update: (id, data) => api.put(`/grades/${id}`, data),
    delete: (id) => api.delete(`/grades/${id}`),
    promoteStudents: (id, data) => api.post(`/grades/${id}/promote`, data)
};

// Attendance API
export const attendanceAPI = {
    getAll: (params) => api.get('/attendance', { params }),
    getForMarking: (classroomId, params) => api.get(`/attendance/mark/${classroomId}`, { params }),
    mark: (data) => api.post('/attendance', data),
    update: (id, data) => api.put(`/attendance/${id}`, data),
    getStudentAttendance: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
    getSummary: (params) => api.get('/attendance/summary', { params })
};

// Fees API
export const feesAPI = {
    getAll: (params) => api.get('/fees', { params }),
    getStudentFees: (studentId) => api.get(`/fees/student/${studentId}`),
    create: (data) => api.post('/fees', data),
    pay: (id, data) => api.put(`/fees/${id}/pay`, data),
    delete: (id) => api.delete(`/fees/${id}`),
    getSummary: () => api.get('/fees/summary'),
    getReceipt: (id) => api.get(`/fees/${id}/receipt`)
};

// Schedules API
export const schedulesAPI = {
    getAll: (params) => api.get('/schedules', { params }),
    getByGrade: (gradeId) => api.get(`/schedules/grade/${gradeId}`),
    getTodaySchedule: (gradeId) => api.get(`/schedules/today/${gradeId}`),
    create: (data) => api.post('/schedules', data),
    initialize: (gradeId) => api.post(`/schedules/initialize/${gradeId}`),
    update: (id, data) => api.put(`/schedules/${id}`, data),
    delete: (id) => api.delete(`/schedules/${id}`),
    deleteAllByGrade: (gradeId) => api.delete(`/schedules/grade/${gradeId}/all`)
};
