import { useState, useMemo, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { useTaskLists } from './hooks/useTaskLists';
import { useTasks } from './hooks/useTasks';
import { useTask } from './hooks/useTask';
import { useSubtasks } from './hooks/useSubtasks';
import { useRecurrence } from './hooks/useRecurrence';
import { useUIStore } from './store/uiStore';
import { Header } from './components/common/Header';
import { ListSidebar } from './components/lists/ListSidebar';
import { TaskList } from './components/tasks/TaskList';
import { TaskDetails } from './components/tasks/TaskDetails';
import { CreateListModal } from './components/lists/CreateListModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { AuthModal } from './components/auth/AuthModal';
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
  const qc = useQueryClient();
  const { userId, profile, signOut } = useAuth();
  const { lists, createList, updateList, deleteList } = useTaskLists(userId);

  const {
    theme,
    toggleTheme,
    selectedListId,
    setSelectedListId,
    selectedTaskId,
    setSelectedTaskId,
    isSidebarOpen,
    toggleSidebar,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
    isCreateListModalOpen,
    setCreateListModalOpen,
    isSettingsModalOpen,
    setSettingsModalOpen,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
  } = useUIStore();

  const [editingList, setEditingList] = useState<TaskListType | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  // Responsive breakpoint detector
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync active list if current deleted or not set
  useEffect(() => {
    if (lists.length > 0 && (!selectedListId || !lists.some((l) => l.id === selectedListId))) {
      setSelectedListId(lists[0].id);
    }
  }, [lists, selectedListId, setSelectedListId]);

  // Tasks query & mutations
  const {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
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
    return lists.find((l) => l.id === selectedListId) || lists[0] || { name: 'My Tasks', id: '' };
  }, [lists, selectedListId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] dark:bg-[#202124] text-[#202124] dark:text-[#E8EAED]">
      {/* 1. Desktop / Tablet Sidebar */}
      <div
        className={`hidden lg:block shrink-0 transition-all duration-200 ease-in-out border-r border-[#DADCE0] dark:border-[#3C4043] ${
          isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <ListSidebar
          lists={lists}
          selectedListId={selectedListId}
          theme={theme}
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
          onOpenEditList={(list) => {
            setEditingList(list);
            setCreateListModalOpen(true);
          }}
          onDeleteList={async (id) => {
            await deleteList(id);
            if (selectedListId === id && lists.length > 1) {
              const remaining = lists.filter((l) => l.id !== id);
              setSelectedListId(remaining[0].id);
            }
          }}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* 2. Mobile Drawer Navigation */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 bg-white dark:bg-[#202124] shadow-2xl animate-in slide-in-from-left duration-250">
            <ListSidebar
              lists={lists}
              selectedListId={selectedListId}
              theme={theme}
              onSelectList={(id) => {
                setSelectedListId(id);
                setSelectedTaskId(null);
                setMobileDrawerOpen(false);
              }}
              onOpenCreateList={() => {
                if (isSupabaseConfigured() && !userId) {
                  setMobileDrawerOpen(false);
                  setAuthModalOpen(true);
                  return;
                }
                setEditingList(null);
                setCreateListModalOpen(true);
                setMobileDrawerOpen(false);
              }}
              onOpenEditList={(list) => {
                setEditingList(list);
                setCreateListModalOpen(true);
                setMobileDrawerOpen(false);
              }}
              onDeleteList={async (id) => {
                await deleteList(id);
                if (selectedListId === id && lists.length > 1) {
                  const remaining = lists.filter((l) => l.id !== id);
                  setSelectedListId(remaining[0].id);
                }
              }}
              onOpenSettings={() => {
                setSettingsModalOpen(true);
                setMobileDrawerOpen(false);
              }}
              onToggleTheme={toggleTheme}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 3. Main Content Center Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          currentListName={currentList.name}
          searchQuery={searchQuery}
          sortBy={sortBy}
          profile={profile || null}
          onToggleSidebar={() => {
            if (isMobile) {
              setMobileDrawerOpen(true);
            } else {
              toggleSidebar();
            }
          }}
          onSearchChange={setSearchQuery}
          onChangeSort={setSortBy}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <TaskList
            listId={selectedListId}
            listName={currentList.name}
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            searchQuery={searchQuery}
            sortBy={sortBy}
            onSelectTask={(id) => setSelectedTaskId(id)}
            onToggleComplete={(id, checked) => toggleComplete(id, checked)}
            onAddTask={async (input) => {
              if (isSupabaseConfigured() && !userId) {
                setAuthModalOpen(true);
                return;
              }
              const targetListId = selectedListId || (lists[0]?.id ?? '');
              await createTask({
                ...input,
                listId: targetListId,
              });
            }}
          />
        </main>
      </div>

      {/* 4. Desktop / Tablet Task Details Panel (3rd Column) */}
      {!isMobile && selectedTaskId && (
        <aside className="w-96 shrink-0 border-l border-[#DADCE0] dark:border-[#3C4043] h-full shadow-xs animate-in slide-in-from-right duration-200">
          <TaskDetails
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
            onSkipOccurrence={async (id) => {
              await skipOccurrence(id);
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
        </aside>
      )}

      {/* 5. Mobile Task Details BottomSheet */}
      {isMobile && selectedTaskId && (
        <BottomSheet
          isOpen={Boolean(selectedTaskId)}
          onClose={() => setSelectedTaskId(null)}
        >
          <div className="h-[75vh]">
            <TaskDetails
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
              onSkipOccurrence={async (id) => {
                await skipOccurrence(id);
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
          </div>
        </BottomSheet>
      )}

      {/* 6. List Creation & Editing Modal */}
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

      {/* 7. Settings & Account Modal */}
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

      {/* 8. Authentication Modal */}
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
