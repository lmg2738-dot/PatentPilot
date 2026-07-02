interface HeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function Header({ title, description, children }: HeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 break-words">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}
