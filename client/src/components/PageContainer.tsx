export const PageContainer = ({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div className={`px-5 pt-5 pb-24 space-y-4 ${className}`}>
      {children}
    </div>
  )
}
