type BadgeVariant = 'enabled' | 'disabled';

interface BadgeProps {
  variant: BadgeVariant;
}

const styles: Record<BadgeVariant, string> = {
  enabled: 'bg-green-100 text-green-700',
  disabled: 'bg-gray-100 text-gray-500',
};

const labels: Record<BadgeVariant, string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
};

export function Badge({ variant }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {labels[variant]}
    </span>
  );
}
