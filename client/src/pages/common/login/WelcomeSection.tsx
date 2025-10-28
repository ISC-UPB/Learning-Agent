export default function WelcomeSection() {
  return (
    <section className="max-md:hidden md:flex md:col-span-7 relative items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--app-colorBgContainer)] to-[var(--app-colorBgElevated)]" />
      <div className="relative w-full h-full flex flex-col items-center justify-center px-8 lg:px-16 py-10 text-center">
        <p className="text-[var(--app-colorTextSecondary)] text-lg">Nice to see you again</p>
        <h2 className="mt-1 text-5xl font-extrabold text-[var(--app-colorPrimary)] tracking-tight">
          Welcome back
        </h2>

        <img
          src="/src/assets/login4.svg"
          alt="Welcome illustration"
          className="mt-8 w-[80%] max-w-2xl h-auto"
          loading="lazy"
        />

        <div className="pointer-events-none absolute inset-0">
          <span className="absolute right-10 top-20 h-6 w-6 rounded-full bg-[var(--app-colorBgElevated)] opacity-50" />
          <span className="absolute right-24 top-48 h-3 w-3 rounded-full bg-[var(--app-colorBgElevated)] opacity-50" />
          <span className="absolute right-40 top-28 h-4 w-4 rounded-full bg-[var(--app-colorBgElevated)] opacity-50" />
        </div>
      </div>
    </section>
  );
}