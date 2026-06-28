import {
  AppShell,
  ActionIcon,
  Badge,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import {
  Building2,
  CheckCircle2,
  Clock3,
  Headphones,
  Moon,
  ServerCog,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Chat } from './components/Chat';
import { RequestHistory } from './components/RequestHistory';
import { TicketFormModal } from './components/TicketFormModal';
import { TicketPanel } from './components/TicketPanel';
import { faqCategories, quickRequests } from './data/faq';
import { analyzeIntent } from './data/intents';
import type { Message, SlaOption, Ticket, TicketDraft, TicketFormValues } from './types';

const initialMessages: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text:
      'Задайте общий вопрос про Service Desk или опишите проблему с рабочим местом. Если это инцидент, я распознаю категорию и предложу открыть структурированную форму заявки.',
  },
];

const ticketsStorageKey = 'service-desk-tickets';

const slaOptions: SlaOption[] = [
  {
    id: 'blocked',
    label: 'Нет, работа полностью остановлена',
    description: 'Критический приоритет: сотрудник не может продолжать работу.',
    priority: 'Критический',
  },
  {
    id: 'limited',
    label: 'Могу переключиться на другие задачи',
    description: 'Высокий приоритет: основная работа затруднена, но есть временная альтернатива.',
    priority: 'Высокий',
  },
  {
    id: 'inconvenient',
    label: 'Могу работать, но неудобно',
    description: 'Средний приоритет: работа продолжается, проблема снижает удобство или скорость.',
    priority: 'Средний',
  },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function createTicketNumber() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const sequence = Math.floor(1000 + Math.random() * 9000);
  return `SD-${day}${month}-${sequence}`;
}

function createEta(priority: SlaOption['priority']) {
  const date = new Date();
  const hoursByPriority: Record<SlaOption['priority'], number> = {
    Критический: 2,
    Высокий: 8,
    Средний: 24,
    Низкий: 72,
  };
  date.setHours(date.getHours() + hoursByPriority[priority]);
  return date.toISOString();
}

function loadStoredTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(ticketsStorageKey);
    return raw ? (JSON.parse(raw) as Ticket[]) : [];
  } catch {
    return [];
  }
}

function buildAssistantText(ticket: Ticket, clarify: string[]) {
  return [
    `Обращение зарегистрировано: ${ticket.id}. Категория: "${ticket.category}". SLA: ${ticket.priority.toLowerCase()}.`,
    `Ответственная группа: ${ticket.specialistGroup}.`,
    clarify.join(' '),
  ].join('\n\n');
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(loadStoredTickets);
  const [detectedDraft, setDetectedDraft] = useState<TicketDraft | null>(null);
  const [ticketFormOpened, setTicketFormOpened] = useState(false);
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  useEffect(() => {
    localStorage.setItem(ticketsStorageKey, JSON.stringify(tickets));
  }, [tickets]);

  const stats = useMemo(
    () => [
      { label: 'Каналы', value: 'Телефон + портал', icon: Headphones },
      { label: 'Открыто', value: `${tickets.filter((item) => item.status !== 'Закрыта').length} заявок`, icon: Users },
      { label: 'Intent', value: 'Вопрос или заявка', icon: CheckCircle2 },
    ],
    [tickets],
  );

  function handleSend(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText) {
      return;
    }

    const userMessage: Message = {
      id: createId('user'),
      role: 'user',
      text: userText,
    };

    const intent = analyzeIntent(userText);

    const assistantMessage: Message = {
      id: createId('assistant'),
      role: 'assistant',
      text:
        intent.type === 'general'
          ? intent.answer
          : intent.type === 'ticket'
            ? [
                `Я распознал обращение как инцидент: "${intent.category.title}".`,
                `Уверенность распознавания: ${intent.confidence}%.`,
                'Чтобы зарегистрировать заявку корректно, нажмите "Открыть форму заявки" и заполните структурированные поля.',
              ].join('\n\n')
            : intent.answer,
    };

    if (intent.type === 'ticket') {
      setDetectedDraft({
        description: userText,
        categoryId: intent.category.id,
        categoryTitle: intent.category.title,
      });
      setTicket(null);
    } else {
      setDetectedDraft(null);
    }

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput('');
  }

  function handleSubmitTicketForm(values: TicketFormValues) {
    const category = faqCategories.find((item) => item.id === values.categoryId) ?? faqCategories[0];
    const sla = slaOptions.find((item) => item.id === values.impactId) ?? slaOptions[2];
    const structuredDetails = [
      values.employee ? `Сотрудник: ${values.employee}` : '',
      values.room ? `Кабинет: ${values.room}` : '',
      values.inventory ? `Инвентарный номер: ${values.inventory}` : '',
    ].filter(Boolean);
    const fullDescription = [values.description, ...structuredDetails].join('\n');

    const nextTicket: Ticket = {
      id: createTicketNumber(),
      status: 'Ожидает специалиста',
      category: category.title,
      priority: sla.priority,
      impact: sla.label,
      specialistGroup: category.specialistGroup,
      assignee: values.assignee,
      eta: createEta(sla.priority),
      description: fullDescription,
      adminSummary: category.adminSummary,
      createdAt: new Date().toISOString(),
    };

    setTicket(nextTicket);
    setTickets((current) => [nextTicket, ...current]);
    setDetectedDraft(null);
    setTicketFormOpened(false);
    setMessages((current) => [
      ...current,
      {
        id: createId('assistant'),
        role: 'assistant',
        text: buildAssistantText(nextTicket, category.clarify),
      },
    ]);
  }

  function handleUpdateTicket(id: string, patch: Partial<Ticket>) {
    setTickets((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setTicket((current) => (current?.id === id ? { ...current, ...patch } : current));
  }

  function handleReset() {
    setMessages(initialMessages);
    setTicket(null);
    setDetectedDraft(null);
    setTicketFormOpened(false);
    setInput('');
  }

  return (
    <AppShell className="app-shell">
      <Container size="xl" py="lg">
        <Group justify="space-between" align="center" className="topbar">
          <Group gap="sm">
            <ThemeIcon size={46} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
              <ServerCog size={26} />
            </ThemeIcon>
            <div>
              <Text size="sm" c="blue.1">Внутренний портал</Text>
              <Title order={3} c="white">Service Desk ИТ-поддержки</Title>
            </div>
          </Group>
          <Group gap="xs">
            <Badge leftSection={<Headphones size={14} />} variant="light" color="blue" size="lg">
              Прием обращений
            </Badge>
            <Badge leftSection={<Building2 size={14} />} variant="light" color="cyan" size="lg">
              Рабочие места
            </Badge>
            <Tooltip label={isDark ? 'Светлая тема' : 'Темная тема'}>
              <ActionIcon
                size="lg"
                radius="md"
                variant="light"
                color={isDark ? 'yellow' : 'blue'}
                onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
                aria-label={isDark ? 'Включить светлую тему' : 'Включить темную тему'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" className="intro">
          <div>
            <Badge variant="light" color="blue" radius="sm">Регистрация инцидентов</Badge>
            <Title order={1} mt="sm">Единое окно для обращений сотрудников в ИТ-поддержку</Title>
          </div>
          <Text size="lg" c="dimmed" maw={560}>
            Сервис понимает общие вопросы, распознает намерение пользователя и создает заявку только через
            структурированную форму с SLA и ответственным направлением.
          </Text>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mb="md">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Card withBorder radius="lg" padding="md" key={item.label}>
                <Group gap="sm">
                  <ThemeIcon variant="light" color="blue" radius="md">
                    <Icon size={18} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed" fw={800} tt="uppercase">{item.label}</Text>
                    <Text fw={800}>{item.value}</Text>
                  </div>
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>

        <Tabs defaultValue="register" variant="pills" radius="md" className="main-tabs">
          <Tabs.List mb="md">
            <Tabs.Tab value="register">Регистрация</Tabs.Tab>
            <Tabs.Tab value="history">
              Журнал заявок
              <Badge size="xs" ml={8} variant="filled" color="blue">{tickets.length}</Badge>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="register">
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" className="workspace">
              <Chat
                input={input}
                messages={messages}
                quickRequests={quickRequests}
                detectedDraft={detectedDraft}
                onInputChange={setInput}
                onSend={handleSend}
                onOpenTicketForm={() => setTicketFormOpened(true)}
              />
              <Stack gap="md">
                <TicketPanel ticket={ticket} onReset={handleReset} />
                <Card withBorder radius="lg" padding="lg">
                  <Group gap="sm" mb="sm">
                    <ThemeIcon variant="light" color="teal" radius="md">
                      <ShieldCheck size={20} />
                    </ThemeIcon>
                    <Title order={3}>Порядок обработки</Title>
                  </Group>
                  <Stack gap="sm">
                    <ProcessItem icon={<Clock3 size={16} />} text="Обращение фиксируется в очереди первой линии." />
                    <ProcessItem icon={<CheckCircle2 size={16} />} text="SLA назначается по влиянию проблемы на работу." />
                    <ProcessItem icon={<Users size={16} />} text="Заявка передается профильной группе администраторов." />
                  </Stack>
                </Card>
              </Stack>
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="history">
            <RequestHistory tickets={tickets} onUpdateTicket={handleUpdateTicket} />
          </Tabs.Panel>
        </Tabs>
        <TicketFormModal
          opened={ticketFormOpened}
          draft={detectedDraft}
          categories={faqCategories}
          slaOptions={slaOptions}
          onClose={() => setTicketFormOpened(false)}
          onSubmit={handleSubmitTicketForm}
        />
      </Container>
    </AppShell>
  );
}

function ProcessItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <Group gap="sm" align="flex-start">
      <ThemeIcon variant="light" color="teal" radius="md" size={28}>
        {icon}
      </ThemeIcon>
      <Text size="sm" c="dimmed">{text}</Text>
    </Group>
  );
}
