'use client';

type LoadingStateProps = {
  message: string;
  minHeight?: string;
};

export default function LoadingState({
  message,
  minHeight = 'min-h-60',
}: LoadingStateProps) {
  return (
    <div className={`flex ${minHeight} items-center justify-center`}>
      <div className='loading loading-dots loading-lg'>{message}</div>
    </div>
  );
}
