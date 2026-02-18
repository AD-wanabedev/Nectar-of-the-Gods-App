import { useState, useEffect } from 'react';
import { db } from '../db';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassInput from '../components/ui/GlassInput';
import { Plus, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { db as firestore, auth } from '../firebase';

export default function Projects() {
    const [newProjectName, setNewProjectName] = useState('');
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        // Optimized Real-time Sync
        const projectsQuery = query(
            collection(firestore, 'users', userId, 'projects'),
            orderBy('createdAt', 'desc')
        );

        const tasksQuery = query(
            collection(firestore, 'users', userId, 'tasks'),
            orderBy('createdAt', 'desc')
        );

        const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Projects sync error:", error);
            setLoading(false);
        });

        const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubProjects();
            unsubTasks();
        };
    }, []);

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        // Using legacy helper for consistency or direct firestore? 
        // Let's use direct firestore for better performance and reliability
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        try {
            await db.projects.add({
                name: newProjectName,
                status: 'In Progress',
                priority: 'Medium',
                createdAt: new Date()
            });
            setNewProjectName('');
        } catch (error) {
            console.error("Add project error:", error);
        }
    };

    const handleAddTask = async (projectId, title) => {
        if (!title.trim()) return;
        try {
            await db.tasks.add({
                projectId,
                title,
                isDone: false,
                createdAt: new Date()
            });
        } catch (error) {
            console.error("Add task error:", error);
        }
    };

    const toggleTask = (taskId, currentStatus) => {
        db.tasks.update(taskId, { isDone: !currentStatus });
    };

    const deleteProject = (id) => {
        if (confirm('Delete project?')) db.projects.delete(id);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="pb-24 pt-4 space-y-6">
            <h2 className="text-xl font-bold text-white px-2">Projects</h2>

            {/* Add Project */}
            <form onSubmit={handleAddProject} className="flex gap-2 px-1">
                <GlassInput
                    placeholder="New Project Name..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                />
                <GlassButton type="submit" disabled={!newProjectName} className="bg-blue-600/20 hover:bg-blue-600">
                    <Plus />
                </GlassButton>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {projects?.map(project => {
                    const projectTasks = tasks?.filter(t => t.projectId === project.id) || [];
                    const completed = projectTasks.filter(t => t.isDone).length;
                    const progress = projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0;

                    return (
                        <GlassCard key={project.id} className="relative overflow-hidden h-full flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                                <button onClick={() => deleteProject(project.id)} className="text-white/30 hover:text-red-400">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1 w-full bg-white/10 rounded-full mb-4 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* Tasks */}
                            <div className="space-y-2">
                                {projectTasks.map(task => (
                                    <div key={task.id}
                                        onClick={() => toggleTask(task.id, task.isDone)}
                                        className="flex items-center gap-2 cursor-pointer group text-sm text-white/80"
                                    >
                                        {task.isDone ? <CheckCircle size={16} className="text-green-400" /> : <Circle size={16} className="text-white/40 group-hover:text-white" />}
                                        <span className={task.isDone ? "line-through text-white/40" : ""}>{task.title}</span>
                                    </div>
                                ))}

                                {/* Simple inline task adder */}
                                <div className="mt-2 pt-2 border-t border-white/5">
                                    <input
                                        className="bg-transparent text-xs text-white placeholder-white/30 focus:outline-none w-full"
                                        placeholder="+ Add task..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddTask(project.id, e.currentTarget.value);
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </GlassCard>
                    );
                })}
                {projects?.length === 0 && <p className="text-center text-white/40 text-sm">No active projects.</p>}
            </div>
        </div>
    );
}
