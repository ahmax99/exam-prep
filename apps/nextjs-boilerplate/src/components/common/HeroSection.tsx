function HeroSection() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:animate-in space-y-6 motion-safe:duration-500">
        <h1 className="text-foreground text-4xl font-semibold tracking-tight lg:text-6xl">
          A full-stack boilerplate, proven end-to-end
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed">
          Next.js BFF, Elysia API, Cognito auth, and Neon Postgres — wired
          together and demonstrated below, ready to rename into your own
          product.
        </p>
      </div>
    </section>
  )
}

export { HeroSection }
