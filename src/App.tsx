import { useState, useMemo, useEffect } from 'react';
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
import { CreateListModal } from './components/lists/CreateListModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { AuthModal } from './components/auth/AuthModal';
import { NewTaskModal } from './components/tasks/NewTaskModal';
import { ListActionsModal } from './components/lists/ListActionsModal';
import { BottomSheet } from './components/common/BottomSheet';
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
      if (!selectedListId || (selectedListId !== 'starred' && !lists.some((l) => l.id === selectedListId))) {
        setSelectedListId(lists[0].id);
      }
    }
  }, [lists, selectedListId, setSelectedListId]);

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
    skipOccurrence,
  } = useTasks(userId, selectedListId);

  // Selected task details query & mutations
  const {
    task: selectedTask,
    subtasks,
    recurrence,
  } = useTask(selectedTaskId);

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
    return lists.find((l) => l.id === selectedListId) || lists[0] || { name: 'My Tasks', id: '' };
  }, [lists, selectedListId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F0F4F9] dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] font-sans">
      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* 1. Google Tasks Centered Header */}
        <Header
          profile={profile || null}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        {/* 2. Google Tasks Scrollable List Tabs Bar */}
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

        {/* 3. Main Tasks Card Container */}
        <main className="flex-1 overflow-y-auto pt-1">
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
          />
        </main>
      </div>

      {/* 4. Dedicated Task Details Page (Matching User Screenshot) */}
      {selectedTaskId && (
        <TaskDetailPage
          task={selectedTask || null}
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

      {/* 6. Three Dots (⋮) List Actions BottomSheet (Screenshot 3) */}
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

      {/* 7. New Task BottomSheet (Screenshot 2) */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        lists={lists}
        defaultListId={selectedListId}
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

      {/* 8. Create/Rename List Modal */}
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

      {/* 9. Settings & Account Modal */}
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

      {/* 10. Authentication Modal */}
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
