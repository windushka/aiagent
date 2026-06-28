import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { CheckCircle2, Clock3, RotateCcw, Search, SlidersHorizontal, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Priority, Ticket, TicketStatus } from '../types';

type RequestHistoryProps = {
  tickets: Ticket[];
  onUpdateTicket: (id: string, patch: Partial<Ticket>) => void;
};

const statusOptions: TicketStatus[] = ['Создана', 'Ожидает специалиста', 'В работе', 'Закрыта'];
const priorityOptions: Priority[] = ['Низкий', 'Средний', 'Высокий', 'Критический'];

const priorityRank: Record<Priority, number> = {
  Критический: 4,
  Высокий: 3,
  Средний: 2,
  Низкий: 1,
};

function priorityColor(priority: Priority) {
  if (priority === 'Критический') return 'red';
  if (priority === 'Высокий') return 'orange';
  if (priority === 'Средний') return 'blue';
  return 'gray';
}

function formatDate(value?: string) {
  if (!value) return 'Не задано';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function toInputDateTime(value: string) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromInputDateTime(value: string) {
  return value ? new Date(value).toISOString() : '';
}

export function RequestHistory({ tickets, onUpdateTicket }: RequestHistoryProps) {
  const [scope, setScope] = useState<string | null>('open');
  const [sort, setSort] = useState<string | null>('newest');
  const [query, setQuery] = useState('');

  const openTickets = tickets.filter((ticket) => ticket.status !== 'Закрыта');
  const closedTickets = tickets.filter((ticket) => ticket.status === 'Закрыта');

  const visibleTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const scoped = tickets.filter((ticket) => {
      if (scope === 'open' && ticket.status === 'Закрыта') return false;
      if (scope === 'closed' && ticket.status !== 'Закрыта') return false;
      if (!normalizedQuery) return true;

      return [
        ticket.id,
        ticket.category,
        ticket.description,
        ticket.assignee,
        ticket.specialistGroup,
        ticket.status,
        ticket.priority,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });

    return [...scoped].sort((a, b) => {
      if (sort === 'priority') return priorityRank[b.priority] - priorityRank[a.priority];
      if (sort === 'eta') return new Date(a.eta || '2999-01-01').getTime() - new Date(b.eta || '2999-01-01').getTime();
      if (sort === 'status') return a.status.localeCompare(b.status, 'ru');
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [query, scope, sort, tickets]);

  function closeTicket(ticket: Ticket) {
    onUpdateTicket(ticket.id, {
      status: 'Закрыта',
      closedAt: new Date().toISOString(),
    });
  }

  function reopenTicket(ticket: Ticket) {
    onUpdateTicket(ticket.id, {
      status: 'Ожидает специалиста',
      closedAt: undefined,
    });
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Badge variant="light" color="blue" radius="sm">Журнал заявок</Badge>
          <Title order={2} mt={6}>История обращений</Title>
          <Text c="dimmed" size="sm">Открытые и закрытые заявки с редактированием SLA, статуса, исполнителя и ETA.</Text>
        </div>
        <Group gap="xs">
          <Badge color="blue" variant="light">Открыто: {openTickets.length}</Badge>
          <Badge color="gray" variant="light">Закрыто: {closedTickets.length}</Badge>
        </Group>
      </Group>

      <Card withBorder radius="lg" padding="md">
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
          <TextInput
            leftSection={<Search size={16} />}
            placeholder="Поиск по номеру, описанию, исполнителю"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <Select
            leftSection={<SlidersHorizontal size={16} />}
            value={sort}
            onChange={setSort}
            data={[
              { value: 'newest', label: 'Сначала новые' },
              { value: 'priority', label: 'По приоритету' },
              { value: 'eta', label: 'По ETA' },
              { value: 'status', label: 'По статусу' },
            ]}
          />
          <Tabs value={scope} onChange={setScope} variant="pills">
            <Tabs.List grow>
              <Tabs.Tab value="open">Открытые</Tabs.Tab>
              <Tabs.Tab value="closed">Закрытые</Tabs.Tab>
              <Tabs.Tab value="all">Все</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </SimpleGrid>
      </Card>

      {visibleTickets.length === 0 ? (
        <Card withBorder radius="lg" padding="xl" ta="center">
          <ThemeIcon size={46} radius="md" variant="light" color="gray" mx="auto" mb="sm">
            <Clock3 size={24} />
          </ThemeIcon>
          <Text fw={800}>Заявок не найдено</Text>
          <Text c="dimmed" size="sm">Создайте обращение или измените фильтры журнала.</Text>
        </Card>
      ) : (
        <Stack gap="sm">
          {visibleTickets.map((ticket) => (
            <Card withBorder radius="lg" padding="md" key={ticket.id} className="history-card">
              <Group justify="space-between" align="flex-start" mb="sm">
                <div>
                  <Group gap="xs" mb={4}>
                    <Text fw={900}>{ticket.id}</Text>
                    <Badge color={priorityColor(ticket.priority)} variant="filled">{ticket.priority}</Badge>
                    <Badge color={ticket.status === 'Закрыта' ? 'gray' : 'yellow'} variant="light">{ticket.status}</Badge>
                  </Group>
                  <Text fw={800}>{ticket.category}</Text>
                  <Text c="dimmed" size="sm" className="history-description">{ticket.description}</Text>
                </div>
                <Group gap="xs">
                  {ticket.status === 'Закрыта' ? (
                    <ActionIcon variant="light" color="blue" radius="md" onClick={() => reopenTicket(ticket)} aria-label="Вернуть в работу">
                      <RotateCcw size={17} />
                    </ActionIcon>
                  ) : (
                    <Button
                      size="xs"
                      color="teal"
                      leftSection={<CheckCircle2 size={14} />}
                      onClick={() => closeTicket(ticket)}
                    >
                      Готово
                    </Button>
                  )}
                </Group>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 4 }} spacing="sm">
                <Select
                  label="Статус"
                  value={ticket.status}
                  data={statusOptions}
                  onChange={(value) =>
                    onUpdateTicket(ticket.id, {
                      status: (value ?? ticket.status) as TicketStatus,
                      closedAt: value === 'Закрыта' ? ticket.closedAt ?? new Date().toISOString() : undefined,
                    })
                  }
                />
                <Select
                  label="SLA"
                  value={ticket.priority}
                  data={priorityOptions}
                  onChange={(value) => onUpdateTicket(ticket.id, { priority: (value ?? ticket.priority) as Priority })}
                />
                <TextInput
                  label="Исполнитель"
                  leftSection={<UserRound size={15} />}
                  value={ticket.assignee}
                  onChange={(event) => onUpdateTicket(ticket.id, { assignee: event.currentTarget.value })}
                />
                <TextInput
                  label="ETA"
                  type="datetime-local"
                  value={toInputDateTime(ticket.eta)}
                  onChange={(event) => onUpdateTicket(ticket.id, { eta: fromInputDateTime(event.currentTarget.value) })}
                />
              </SimpleGrid>

              <Group gap="lg" mt="sm">
                <Text size="xs" c="dimmed">Создана: {formatDate(ticket.createdAt)}</Text>
                <Text size="xs" c="dimmed">ETA: {formatDate(ticket.eta)}</Text>
                {ticket.closedAt && <Text size="xs" c="dimmed">Закрыта: {formatDate(ticket.closedAt)}</Text>}
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
