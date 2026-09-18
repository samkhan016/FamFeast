import {create} from 'zustand';
import type {AppSnapshot, Member, Permission} from '../domain/types';
import {loadSnapshot, subscribeSnapshot} from '../services';

type Toast = {
  id: string;
  message: string;
  tone: 'success' | 'error' | 'info';
};

type AppStore = {
  snapshot: AppSnapshot;
  selectedDate: string;
  toast?: Toast;
  setSelectedDate: (date: string) => void;
  showToast: (message: string, tone?: Toast['tone']) => void;
  hideToast: () => void;
  currentMember: () => Member | undefined;
  permission: () => Permission;
  canEdit: () => boolean;
};

export const useAppStore = create<AppStore>((set, get) => ({
  snapshot: loadSnapshot(),
  selectedDate: new Date().toISOString().slice(0, 10),
  setSelectedDate: date => set({selectedDate: date}),
  showToast: (message, tone = 'success') =>
    set({
      toast: {id: `${Date.now()}`, message, tone},
    }),
  hideToast: () => set({toast: undefined}),
  currentMember: () => {
    const {snapshot} = get();
    return snapshot.members.find(member => member.id === snapshot.currentMemberId);
  },
  permission: () => get().currentMember()?.permission ?? 'viewer',
  canEdit: () => get().permission() === 'editor',
}));

subscribeSnapshot(snapshot => {
  useAppStore.setState({snapshot});
});
