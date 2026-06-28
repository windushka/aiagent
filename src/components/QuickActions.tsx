import { Button, SimpleGrid } from '@mantine/core';

type QuickActionsProps = {
  items: string[];
  onSelect: (text: string) => void;
};

export function QuickActions({ items, onSelect }: QuickActionsProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xs" aria-label="Частые обращения">
      {items.map((item) => (
        <Button key={item} type="button" variant="light" color="gray" justify="flex-start" onClick={() => onSelect(item)}>
          {item}
        </Button>
      ))}
    </SimpleGrid>
  );
}
