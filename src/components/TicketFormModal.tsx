import {
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import type { FaqCategory, SlaOption, TicketDraft, TicketFormValues } from '../types';

type TicketFormModalProps = {
  opened: boolean;
  draft: TicketDraft | null;
  categories: FaqCategory[];
  slaOptions: SlaOption[];
  onClose: () => void;
  onSubmit: (values: TicketFormValues) => void;
};

const defaultValues: TicketFormValues = {
  employee: '',
  room: '',
  inventory: '',
  description: '',
  categoryId: '',
  impactId: '',
  assignee: 'Не назначен',
};

export function TicketFormModal({ opened, draft, categories, slaOptions, onClose, onSubmit }: TicketFormModalProps) {
  const [values, setValues] = useState<TicketFormValues>(defaultValues);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setValues({
      ...defaultValues,
      description: draft?.description ?? '',
      categoryId: draft?.categoryId ?? categories[0]?.id ?? '',
    });
  }, [categories, draft, opened]);

  const canSubmit = values.description.trim() && values.categoryId && values.impactId;

  function updateField<Key extends keyof TicketFormValues>(key: Key, value: TicketFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    onSubmit({
      ...values,
      description: values.description.trim(),
      employee: values.employee.trim(),
      room: values.room.trim(),
      inventory: values.inventory.trim(),
      assignee: values.assignee.trim() || 'Не назначен',
    });
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Создание заявки" size="lg" radius="lg" centered>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Заполните структурированные поля. Это имитирует работу первой линии поддержки перед передачей заявки
          системному администратору.
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <TextInput
            label="ФИО сотрудника"
            placeholder="Иванов И.И."
            value={values.employee}
            onChange={(event) => updateField('employee', event.currentTarget.value)}
          />
          <TextInput
            label="Кабинет"
            placeholder="204"
            value={values.room}
            onChange={(event) => updateField('room', event.currentTarget.value)}
          />
          <TextInput
            label="Инвентарный номер"
            placeholder="При наличии"
            value={values.inventory}
            onChange={(event) => updateField('inventory', event.currentTarget.value)}
          />
          <TextInput
            label="Исполнитель"
            placeholder="Не назначен"
            value={values.assignee}
            onChange={(event) => updateField('assignee', event.currentTarget.value)}
          />
        </SimpleGrid>

        <Select
          label="Категория"
          data={categories.map((category) => ({ value: category.id, label: category.title }))}
          value={values.categoryId}
          onChange={(value) => updateField('categoryId', value ?? '')}
          searchable
          required
        />

        <Select
          label="Влияние на работу / SLA"
          data={slaOptions.map((option) => ({
            value: option.id,
            label: `${option.label} — ${option.priority}`,
          }))}
          value={values.impactId}
          onChange={(value) => updateField('impactId', value ?? '')}
          required
        />

        <Textarea
          label="Описание проблемы"
          minRows={4}
          autosize
          value={values.description}
          onChange={(event) => updateField('description', event.currentTarget.value)}
          required
        />

        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Создать заявку
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
