import { useState, useMemo, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { useTaskLists } from './hooks/useTaskLists';
import { useTasks } from './hooks/useTasks';
import { useTask } from './hooks/useTask';
import { useSubtasks } from './hooks/useSubtasks';
import { useRecurrence } from './hooks/useRecurrence';
import { useUIStore } from './store/uiStore';
import { Header } from './components/common/Header';
import { ListTabs } from './components/common/ListTabs';
import { TaskList } from './components/tasks/TaskList';
import { TaskDetails } from './components/tasks/TaskDetails';
import { TaskDetailPage } from './components/tasks/TaskDetailPage';
import { WebHeader } from './components/web/WebHeader';
import { WebSidebar } from './components/web/WebSidebar';
import { WebTaskCard } from './components/web/WebTaskCard';
import { CreateListModal } from './components/lists/CreateListModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { AuthModal } from './components/auth/AuthModal';
import { NewTaskModal } from './components/tasks/NewTaskModal';
import { ListActionsModal } from './components/lists/ListActionsModal';
import { isSupabaseConfigured } from './services/supabase';
import { TaskList as TaskListType } from './types/list';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function TasksApp() {
  const { userId, profile, signOut } = useAuth();
  const { lists, createList, updateList, deleteList } = useTaskLists(userId);

  const {
    theme,
    toggleTheme,
    selectedListId,
    setSelectedListId,
    selectedTaskId,
    setSelectedTaskId,
    isCreateListModalOpen,
    setCreateListModalOpen,
    isSettingsModalOpen,
    setSettingsModalOpen,
    searchQuery,
    sortBy,
    setSortBy,
  } = useUIStore();

  const [editingList, setEditingList] = useState<TaskListType | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isWebSidebarOpen, setIsWebSidebarOpen] = useState(true);
  const [isWebAddingTask, setIsWebAddingTask] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isListActionsOpen, setIsListActionsOpen] = useState(false);

  // Automatically close AuthModal when user logs in
  useEffect(() => {
    if (userId) {
      setAuthModalOpen(false);
    }
  }, [userId]);

  // Responsive breakpoint detector
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync active list if current not set or invalid
  useEffect(() => {
    if (lists.length > 0) {
      if (
        !selectedListId ||
        (selectedListId !== 'starred' &&
          selectedListId !== 'all' &&
          !lists.some((l) => l.id === selectedListId))
      ) {
        setSelectedListId(!isMobile ? 'all' : lists[0].id);
      }
    }
  }, [lists, selectedListId, setSelectedListId, isMobile]);

  // Mobile horizontal swipe navigation between Starred / Favorites and Lists
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Must be predominantly horizontal swipe gesture (distance > 45px, more horizontal than vertical, within 600ms)
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2 && duration < 600) {
      const defaultList = lists[0]?.id || '';

      if (deltaX < 0) {
        // Swipe Left (<-): from My Tasks to Favorites (Starred)
        if (selectedListId !== 'starred') {
          setSelectedListId('starred');
          setSelectedTaskId(null);
        } else {
          setSelectedListId(defaultList);
          setSelectedTaskId(null);
        }
      } else {
        // Swipe Right (->): from Favorites to My Tasks
        if (selectedListId === 'starred') {
          setSelectedListId(defaultList);
          setSelectedTaskId(null);
        } else {
          setSelectedListId('starred');
          setSelectedTaskId(null);
        }
      }
    }
  };

  // Query all tasks to calculate real-time task counts and starred count
  const { tasks: allTasks } = useTasks(userId, undefined);

  const starredCount = useMemo(() => {
    return allTasks.filter((t) => t.isStarred && !t.completed).length;
  }, [allTasks]);

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    lists.forEach((l) => {
      counts[l.id] = allTasks.filter((t) => t.listId === l.id && !t.completed).length;
    });
    return counts;
  }, [lists, allTasks]);

  // Tasks query & mutations for active tab/list
  const {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    toggleStar,
    deleteCompletedTasks,
    reorderTasks,
  } = useTasks(userId, selectedListId);

  // Selected task details query & mutations
  const {
    task: selectedTask,
    subtasks,
    recurrence,
  } = useTask(selectedTaskId);

  const effectiveSelectedTask =
    selectedTask ||
    tasks.find((t) => t.id === selectedTaskId) ||
    allTasks.find((t) => t.id === selectedTaskId) ||
    null;

  const {
    createSubtask,
    updateSubtask,
    deleteSubtask,
  } = useSubtasks(selectedTaskId);

  const {
    saveRecurrence,
    deleteRecurrence,
  } = useRecurrence(selectedTaskId);

  const currentList = useMemo(() => {
    if (selectedListId === 'starred') {
      return { name: 'Starred', id: 'starred' };
    }
    if (selectedListId === 'all') {
      return { name: lists[0]?.name || 'My Tasks', id: 'all' };
    }
    return lists.find((l) => l.id === selectedListId) || lists[0] || { name: 'My Tasks', id: '' };
  }, [lists, selectedListId]);

  // Sync dark class on document root whenever theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-[#F8FAFD] dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] font-sans ${theme === 'dark' ? 'dark' : ''}`}>
      {!isMobile ? (
        /* ================= DESKTOP GOOGLE TASKS WEB VIEW (MATCHING USER SCREENSHOT) ================= */
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
          {/* Top Google Tasks Web Header */}
          <WebHeader
            profile={profile || null}
            theme={theme}
            onToggleSidebar={() => setIsWebSidebarOpen((prev) => !prev)}
            onOpenSettings={() => setSettingsModalOpen(true)}
            onOpenAuth={() => setAuthModalOpen(true)}
            onToggleTheme={toggleTheme}
            onSignOut={signOut}
          />

          {/* Web Workspace Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <WebSidebar
              isOpen={isWebSidebarOpen}
              lists={lists}
              selectedListId={selectedListId}
              onSelectList={(id) => {
                setSelectedListId(id);
                setSelectedTaskId(null);
              }}
              onOpenNewTask={() => {
                if (isSupabaseConfigured() && !userId) {
                  setAuthModalOpen(true);
                  return;
                }
                setIsNewTaskModalOpen(true);
              }}
              onOpenCreateList={() => {
                if (isSupabaseConfigured() && !userId) {
                  setAuthModalOpen(true);
                  return;
                }
                setEditingList(null);
                setCreateListModalOpen(true);
              }}
            />

            {/* Main Center Canvas */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-8 flex items-start justify-center gap-6 bg-[#F8FAFD] dark:bg-[#131314]">
              {/* Elevated Web Tasks Card */}
              <WebTaskCard
                listId={selectedListId}
                listName={currentList.name}
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                searchQuery={searchQuery}
                sortBy={sortBy}
                onChangeSort={setSortBy}
                isAddingTask={isWebAddingTask}
                onToggleAddingTask={(val) => setIsWebAddingTask(val)}
                onOpenNewTask={() => {
                  if (isSupabaseConfigured() && !userId) {
                    setAuthModalOpen(true);
                    return;
                  }
                  setIsWebAddingTask(true);
                }}
                onInlineAddTask={async (data) => {
                  await createTask({
                    title: data.title,
                    notes: data.notes || undefined,
                    dueDate: data.dueDate || undefined,
                    dueTime: data.dueTime || undefined,
                    isStarred: false,
                    isRecurring: data.isRecurring || false,
                    recurrence: data.recurrence || undefined,
                    listId:
                      selectedListId === 'starred' || selectedListId === 'all'
                        ? lists[0]?.id || ''
                        : selectedListId,
                  });
                }}
                lists={lists}
                onSelectTask={(id) => setSelectedTaskId(id)}
                onToggleComplete={(id, checked) => toggleComplete(id, checked)}
                onToggleStar={(id, starred) => toggleStar(id, starred)}
                onDeleteTask={async (id) => {
                  await deleteTask(id);
                  if (selectedTaskId === id) setSelectedTaskId(null);
                }}
                onUpdateTask={async (id, updates) => {
                  await updateTask({ id, input: updates });
                }}
                onReorderTasks={async (items) => {
                  await reorderTasks(items);
                }}
                onCreateSubtask={async (taskId, title) => {
                  await createSubtask({ taskId, title });
                }}
                onToggleSubtaskComplete={async (subtaskId, completed) => {
                  await updateSubtask({ id: subtaskId, input: { completed } });
                }}
                onDeleteSubtask={async (subtaskId) => {
                  await deleteSubtask(subtaskId);
                }}
                onOpenCreateList={() => {
                  if (isSupabaseConfigured() && !userId) {
                    setAuthModalOpen(true);
                    return;
                  }
                  setEditingList(null);
                  setCreateListModalOpen(true);
                }}
                onRenameList={() => {
                  setEditingList(currentList as any);
                  setCreateListModalOpen(true);
                }}
                onDeleteList={async () => {
                  await deleteList(currentList.id);
                  setSelectedListId('all');
                }}
                onDeleteCompleted={async () => {
                  await deleteCompletedTasks();
                }}
                isDefaultList={
                  currentList.id === lists[0]?.id ||
                  currentList.id === 'starred' ||
                  currentList.id === 'all'
                }
              />
            </main>
          </div>
        </div>
      ) : (
        /* ================= MOBILE VIEW (PRESERVED PRECISELY) ================= */
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Mobile Header */}
          <Header
            profile={profile || null}
            onOpenSettings={() => setSettingsModalOpen(true)}
            onOpenAuth={() => setAuthModalOpen(true)}
          />

          {/* Mobile List Tabs Bar */}
          <ListTabs
            lists={lists}
            selectedListId={selectedListId}
            starredCount={starredCount}
            taskCounts={taskCounts}
            onSelectList={(id) => {
              setSelectedListId(id);
              setSelectedTaskId(null);
            }}
            onOpenCreateList={() => {
              if (isSupabaseConfigured() && !userId) {
                setAuthModalOpen(true);
                return;
              }
              setEditingList(null);
              setCreateListModalOpen(true);
            }}
          />

          {/* Mobile Tasks List Container with Swipe Navigation */}
          <main
            className="flex-1 overflow-y-auto pt-1 touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div key={selectedListId} className="animate-in fade-in duration-150">
              <TaskList
                listId={selectedListId}
                listName={currentList.name}
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                searchQuery={searchQuery}
                sortBy={sortBy}
                onChangeSort={setSortBy}
                onOpenListActions={() => setIsListActionsOpen(true)}
                onOpenNewTask={() => {
                  if (isSupabaseConfigured() && !userId) {
                    setAuthModalOpen(true);
                    return;
                  }
                  setIsNewTaskModalOpen(true);
                }}
                onSelectTask={(id) => setSelectedTaskId(id)}
                onToggleComplete={(id, checked) => toggleComplete(id, checked)}
                onToggleStar={(id, starred) => toggleStar(id, starred)}
                onUpdateTask={async (id, updates) => {
                  await updateTask({ id, input: updates });
                }}
                onReorderTasks={async (items) => {
                  await reorderTasks(items);
                }}
                onDeleteTask={async (id) => {
                  await deleteTask(id);
                }}
              />
            </div>
          </main>
        </div>
      )}

      {/* Dedicated Task Details Page for Mobile */}
      {isMobile && selectedTaskId && (
        <TaskDetailPage
          task={effectiveSelectedTask}
          lists={lists}
          subtasks={subtasks}
          recurrence={recurrence || null}
          onClose={() => setSelectedTaskId(null)}
          onUpdateTask={async (id, updates) => {
            await updateTask({ id, input: updates });
          }}
          onDeleteTask={async (id) => {
            await deleteTask(id);
            setSelectedTaskId(null);
          }}
          onToggleComplete={async (id, checked) => {
            await toggleComplete(id, checked);
          }}
          onToggleStar={async (id, starred) => {
            await toggleStar(id, starred);
          }}
          onSaveRecurrence={async (taskId, rule) => {
            await saveRecurrence({ taskId, rule });
          }}
          onDeleteRecurrence={async (taskId) => {
            await deleteRecurrence(taskId);
          }}
          onCreateSubtask={async (taskId, title) => {
            await createSubtask({ taskId, title });
          }}
          onUpdateSubtask={async (id, updates) => {
            await updateSubtask({ id, input: updates });
          }}
          onDeleteSubtask={async (id) => {
            await deleteSubtask(id);
          }}
        />
      )}

      {/* Three Dots (⋮) List Actions BottomSheet for Mobile */}
      {isMobile && (
        <ListActionsModal
          isOpen={isListActionsOpen}
          onClose={() => setIsListActionsOpen(false)}
          listName={currentList.name}
          isDefaultList={currentList.id === lists[0]?.id || currentList.id === 'starred'}
          hasCompletedTasks={tasks.some((t) => t.completed)}
          onRename={() => {
            setEditingList(currentList as any);
            setCreateListModalOpen(true);
          }}
          onDelete={async () => {
            await deleteList(currentList.id);
            setSelectedListId(lists[0]?.id || '');
          }}
          onDeleteCompleted={async () => {
            await deleteCompletedTasks();
          }}
        />
      )}

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        lists={lists}
        defaultListId={
          selectedListId === 'starred' || selectedListId === 'all'
            ? lists[0]?.id || ''
            : selectedListId
        }
        onAddTask={async (data) => {
          await createTask({
            title: data.title,
            notes: data.notes,
            dueDate: data.dueDate,
            dueTime: data.dueTime,
            isStarred: data.isStarred,
            isRecurring: data.isRecurring,
            recurrence: data.recurrenceRule || undefined,
            listId: data.listId,
          });
        }}
      />

      {/* Create/Rename List Modal */}
      {isCreateListModalOpen && (
        <CreateListModal
          isOpen={isCreateListModalOpen}
          onClose={() => {
            setCreateListModalOpen(false);
            setEditingList(null);
          }}
          editingList={editingList}
          onSave={async (name) => {
            if (isSupabaseConfigured() && !userId) {
              setCreateListModalOpen(false);
              setAuthModalOpen(true);
              return;
            }
            if (editingList) {
              await updateList({ id: editingList.id, input: { name } });
            } else {
              const newList = await createList({ name });
              setSelectedListId(newList.id);
            }
          }}
        />
      )}

      {/* Settings & Account Modal */}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          profile={profile || null}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSignOut={signOut}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
      )}

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TasksApp />
    </QueryClientProvider>
  );
}
