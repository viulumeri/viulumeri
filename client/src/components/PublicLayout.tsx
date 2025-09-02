const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-100 flex justify-center">
    <div className="w-full max-w-sm bg-neutral-900 text-gray-100 p-4">
      <h1>Viulumeri</h1>
      {children}
    </div>
  </div>
)

export default PublicLayout
