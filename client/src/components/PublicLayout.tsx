const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-neutral-900 text-gray-100 flex justify-center">
    <div className="w-full max-w-4xl bg-neutral-900 text-gray-100 p-4">
      <h1>Viulumeri</h1>
      {children}
    </div>
  </div>
)

export default PublicLayout
