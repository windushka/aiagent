export type Priority = 'Низкий' | 'Средний' | 'Высокий' | 'Критический';

export type TicketStatus = 'Создана' | 'Ожидает специалиста' | 'В работе' | 'Закрыта';

export type FaqCategory = {
  id: string;
  title: string;
  shortTitle: string;
  keywords: string[];
  priority: Priority;
  specialistGroup: string;
  clarify: string[];
  adminSummary: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export type Ticket = {
  id: string;
  status: TicketStatus;
  category: string;
  priority: Priority;
  impact: string;
  specialistGroup: string;
  assignee: string;
  eta: string;
  description: string;
  adminSummary: string;
  createdAt: string;
  closedAt?: string;
};

export type SlaOption = {
  id: string;
  label: string;
  description: string;
  priority: Priority;
};

export type TicketDraft = {
  description: string;
  categoryId: string;
  categoryTitle: string;
};

export type TicketFormValues = {
  employee: string;
  room: string;
  inventory: string;
  description: string;
  categoryId: string;
  impactId: string;
  assignee: string;
};
