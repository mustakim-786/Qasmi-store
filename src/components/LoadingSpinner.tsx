import { Loader2 } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';

export function LoadingSpinner({ label }: { label?: string }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <p className="mt-3 text-sm text-muted">
        {label || t('Loading...', 'لوڈ ہو رہا ہے...')}
      </p>
    </div>
  );
}

export function InlineSpinner({ size = 16 }: { size?: number }) {
  return <Loader2 className="animate-spin" style={{ width: size, height: size }} />;
}
