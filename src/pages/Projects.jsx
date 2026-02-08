import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassInput from '../components/ui/GlassInput';
import { Plus, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Projects() {
    const [newProjectName, setNewProjectName] = useState('');

    const projects = useLiveQuery(() => db.projects.toArray());
    const tasks = useLiveQuery(() => db.tasks.toArray());

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        await db.projects.add({
            name: newProjectName,
            status: 'In Progress',
            priority: 'Medium',
            createdAt: new Date()
        });
        setNewProjectName('');
    };

    const handleAddTask = async (projectId, title) => {
        await db.tasks.add({
            projectId,
            title,
            isDone: false,
            createdAt: new Date()
        });
    };

    const toggleTask = (taskId, currentStatus) => {
        db.tasks.update(taskId, { isDone: !currentStatus });
    };

    const deleteProject = (id) => {
        if (confirm('Delete project?')) db.projects.delete(id);
        // create logic to delete associated tasks
    };

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

                                {/* Simple inline task adder for this demo */}
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
