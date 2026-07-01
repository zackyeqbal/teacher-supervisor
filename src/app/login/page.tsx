import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="grid w-full max-w-6xl gap-6 overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        <div className="relative h-72 overflow-hidden md:h-auto">
          <img
            src="/logo-sekolah.svg"
            alt="Ilustrasi login"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white md:p-8">
            <h2 className="text-3xl font-semibold">Selamat Datang</h2>
          </div>
          <div className="absolute left-6 top-6">
            <img src="/logo-sekolah.svg" alt="Logo sekolah" className="h-12 w-auto" />
          </div>
        </div>

        <div className="flex items-center justify-center p-8 sm:p-10">
          <div className="w-full max-w-md space-y-6">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Teacher Supervisor</h1>
              <p className="mt-2 text-sm text-slate-500">Masuk untuk melanjutkan</p>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {message}
              </p>
            )}

            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="nama@sekolah.sch.id"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-2">
                <button
                  formAction={login}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Masuk
                </button>
                <button
                  formAction={signup}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Daftar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
