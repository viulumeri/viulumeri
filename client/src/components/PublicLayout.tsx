const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="h-screen overflow-hidden bg-neutral-900 text-gray-100 flex flex-col justify-between">
    <div className="relative basis-[75vh] shrink min-h-0">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.metmuseum.org/CRDImages/ad/original/ap06.1281.jpg")'
        }}
      />
      <header className="relative z-10 pt-8">
        <h1 className=" text-6xl font-semibold text-center">Viulumeri</h1>
      </header>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-neutral-900 z-10" />
    </div>

    <div className="w-full">
      <div className="mx-auto w-full max-w-md px-4 pb-2">
        <div className="p-6">{children}</div>
      </div>
    </div>
  </div>
)

export default PublicLayout
