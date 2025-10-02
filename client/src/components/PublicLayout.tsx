const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-screen text-gray-100">
    <div className="absolute inset-0 z-0 flex justify-center">
      <div
        className="h-full w-full max-w-4xl bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.metmuseum.org/CRDImages/ad/original/ap06.1281.jpg")'
        }}
      />
    </div>

    <div className="relative z-10 grid grid-rows-[minmax(0,1fr)_auto] h-full">
      <div className="relative min-h-0">
        <header className="relative z-10 pt-8">
          <h1 className="text-6xl font-semibold text-center">Viulumeri</h1>
        </header>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-neutral-900 z-10" />
      </div>

      <div className="w-full bg-neutral-900 -mt-px">
        <div className="mx-auto w-full max-w-md px-4">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  </div>
)

export default PublicLayout
