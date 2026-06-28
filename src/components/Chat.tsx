import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { MessageSquareText, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import type { Message, TicketDraft } from '../types';
import { QuickActions } from './QuickActions';

type ChatProps = {
  input: string;
  messages: Message[];
  quickRequests: string[];
  detectedDraft: TicketDraft | null;
  onInputChange: (value: string) => void;
  onSend: (text?: string) => void;
  onOpenTicketForm: () => void;
};

export function Chat({
  input,
  messages,
  quickRequests,
  detectedDraft,
  onInputChange,
  onSend,
  onOpenTicketForm,
}: ChatProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend();
  }

  return (
    <Card withBorder radius="lg" padding="lg" className="chat-shell" aria-label="Регистрация обращения">
      <Group gap="sm" mb="md">
        <ThemeIcon size={46} radius="md" variant="light" color="blue">
          <MessageSquareText size={22} />
        </ThemeIcon>
        <div>
          <Badge variant="light" color="blue" radius="sm">Service Desk</Badge>
          <Title order={2} mt={4}>Новое обращение</Title>
        </div>
      </Group>

      <Stack gap="sm" className="messages" aria-live="polite">
        {messages.map((message) => (
          <Paper
            key={message.id}
            className={`message ${message.role}`}
            radius="md"
            p="sm"
            withBorder={message.role === 'assistant'}
          >
            <Text size="xs" fw={800} c={message.role === 'assistant' ? 'dimmed' : 'blue.1'} mb={4}>
              {message.role === 'assistant' ? 'Сервисная линия' : 'Сотрудник'}
            </Text>
            <Text size="sm" className="message-text">
              {message.text}
            </Text>
          </Paper>
        ))}
      </Stack>

      {detectedDraft ? (
        <Card withBorder radius="md" padding="md" mb="md" className="sla-panel">
          <Group justify="space-between" align="flex-start" mb="sm">
            <div>
              <Text fw={800}>Распознано намерение: создать заявку</Text>
              <Text size="sm" c="dimmed">
                Категория: {detectedDraft.categoryTitle}. Откройте форму, чтобы добавить данные сотрудника и SLA.
              </Text>
            </div>
            <Badge color="blue" variant="filled">Intent</Badge>
          </Group>
          <Button onClick={onOpenTicketForm}>Открыть форму заявки</Button>
        </Card>
      ) : (
        <Stack gap="xs" mb="md">
          <Text size="xs" fw={800} c="dimmed" tt="uppercase">Быстрые сценарии</Text>
          <QuickActions items={quickRequests} onSelect={onSend} />
        </Stack>
      )}

      <form onSubmit={handleSubmit}>
        <Group gap="sm" align="stretch">
          <TextInput
            className="composer-input"
            aria-label="Описание проблемы"
            placeholder="Спросите про SLA или опишите проблему: не работает монитор, кабинет 204"
            value={input}
            onChange={(event) => onInputChange(event.currentTarget.value)}
            flex={1}
          />
          <ActionIcon type="submit" size={42} radius="md" color="blue" aria-label="Зарегистрировать обращение">
            <Send size={18} />
          </ActionIcon>
        </Group>
      </form>
    </Card>
  );
}
