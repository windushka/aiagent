import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { ClipboardList, Clock, RotateCcw, ShieldCheck } from 'lucide-react';
import type { Ticket } from '../types';

type TicketPanelProps = {
  ticket: Ticket | null;
  onReset: () => void;
};

export function TicketPanel({ ticket, onReset }: TicketPanelProps) {
  const priorityColor =
    ticket?.priority === 'Критический'
      ? 'red'
      : ticket?.priority === 'Высокий'
        ? 'orange'
        : ticket?.priority === 'Средний'
          ? 'blue'
          : 'gray';

  return (
    <Card withBorder radius="lg" padding="lg" aria-label="Состояние заявки">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Badge variant="light" color="gray" radius="sm">Текущая заявка</Badge>
          <Title order={3} mt={4}>Сводка</Title>
        </div>
        <Button variant="subtle" color="gray" px="xs" onClick={onReset} title="Новая заявка" aria-label="Новая заявка">
          <RotateCcw size={18} />
        </Button>
      </Group>

      {ticket ? (
        <Stack gap="md">
          <Group justify="space-between" className="ticket-number">
            <Group gap="xs">
              <ClipboardList size={20} />
              <Text fw={900}>{ticket.id}</Text>
            </Group>
            <Badge color={priorityColor} variant="filled">{ticket.priority}</Badge>
          </Group>

          <Stack gap="xs">
            <Group justify="space-between" gap="md">
              <Text size="sm" c="dimmed">Статус</Text>
              <Badge leftSection={<Clock size={12} />} color="yellow" variant="light">
                {ticket.status}
              </Badge>
            </Group>
            <Divider />
            <InfoRow label="Категория" value={ticket.category} />
            <InfoRow label="Влияние" value={ticket.impact} />
            <InfoRow label="Группа" value={ticket.specialistGroup} />
            <InfoRow label="Исполнитель" value={ticket.assignee} />
            <InfoRow label="ETA" value={formatDate(ticket.eta)} />
            <InfoRow label="Описание" value={ticket.description} />
          </Stack>

          <Card withBorder radius="md" padding="sm" className="soft-panel">
            <Group align="flex-start" gap="sm">
              <ThemeIcon variant="light" color="teal" radius="md">
                <ShieldCheck size={18} />
              </ThemeIcon>
              <Text size="sm" c="dimmed">{ticket.adminSummary}</Text>
            </Group>
          </Card>
        </Stack>
      ) : (
        <Card withBorder radius="md" padding="xl" ta="center" className="empty-ticket-panel">
          <ThemeIcon size={46} radius="md" variant="light" color="gray" mx="auto" mb="sm">
            <ClipboardList size={24} />
          </ThemeIcon>
          <Text c="dimmed" size="sm">После описания проблемы здесь появятся номер, SLA и назначенная группа.</Text>
        </Card>
      )}
    </Card>
  );
}

function formatDate(value: string) {
  if (!value) return 'Не задано';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Group justify="space-between" align="flex-start" gap="md">
        <Text size="sm" c="dimmed">{label}</Text>
        <Text size="sm" fw={700} ta="right" className="info-value">{value}</Text>
      </Group>
      <Divider />
    </>
  );
}
